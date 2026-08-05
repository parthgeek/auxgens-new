import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import {
  contactFieldLimits,
  contactRegions,
  contactServices,
} from "@/app/contact-us/contactFormConfig";

export const runtime = "nodejs";

type ContactPayload = {
  name: string;
  email: string;
  company: string;
  service: string;
  region: string;
  message: string;
  turnstileToken: string;
};

type SmtpError = Error & {
  code?: string;
  responseCode?: number;
};

type RateLimitEntry = {
  timestamps: number[];
};

type TurnstileResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const allowedPayloadKeys = new Set([
  "name",
  "email",
  "company",
  "service",
  "region",
  "message",
  "website",
  "startedAt",
  "turnstileToken",
]);
const serviceSet = new Set<string>(contactServices);
const regionSet = new Set<string>(contactRegions);
const emailPattern =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\p{N} .,'’()-]*$/u;
const maxRequestBytes = 12_000;
const minimumCompletionTimeMs = 2_000;
const maximumCompletionTimeMs = 24 * 60 * 60 * 1_000;

const globalRateLimitState = globalThis as typeof globalThis & {
  __auxgensContactRateLimits?: Map<string, RateLimitEntry>;
};
const rateLimits =
  globalRateLimitState.__auxgensContactRateLimits ??
  new Map<string, RateLimitEntry>();
globalRateLimitState.__auxgensContactRateLimits = rateLimits;

function json(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function readString(value: unknown, minLength: number, maxLength: number) {
  if (typeof value !== "string" || value.length > maxLength + 40) {
    return null;
  }

  const normalized = value.normalize("NFKC").trim();
  return normalized.length >= minLength && normalized.length <= maxLength
    ? normalized
    : null;
}

function isValidEmail(email: string) {
  const [localPart] = email.split("@");
  return (
    emailPattern.test(email) &&
    localPart.length <= 64 &&
    !localPart.startsWith(".") &&
    !localPart.endsWith(".") &&
    !localPart.includes("..")
  );
}

function parsePayload(value: unknown): ContactPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !allowedPayloadKeys.has(key))) {
    return null;
  }

  const name = readString(
    body.name,
    contactFieldLimits.name.min,
    contactFieldLimits.name.max,
  );
  const email = readString(body.email, 3, contactFieldLimits.email.max);
  const company =
    body.company === undefined ||
    (typeof body.company === "string" && body.company.trim() === "")
      ? ""
      : readString(body.company, 1, contactFieldLimits.company.max);
  const service = readString(body.service, 1, 120);
  const region =
    body.region === "" || body.region === undefined
      ? ""
      : readString(body.region, 1, 80);
  const message = readString(
    body.message,
    contactFieldLimits.message.min,
    contactFieldLimits.message.max,
  );
  const turnstileToken =
    body.turnstileToken === "" || body.turnstileToken === undefined
      ? ""
      : readString(body.turnstileToken, 1, 2_048);

  if (
    !name ||
    !namePattern.test(name) ||
    !email ||
    !isValidEmail(email) ||
    company === null ||
    !service ||
    !serviceSet.has(service) ||
    region === null ||
    (region !== "" && !regionSet.has(region)) ||
    !message ||
    turnstileToken === null
  ) {
    return null;
  }

  const urlCount = message.match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (urlCount > 3 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(message)) {
    return null;
  }

  return {
    name,
    email: `${email.slice(0, email.lastIndexOf("@"))}@${email
      .slice(email.lastIndexOf("@") + 1)
      .toLowerCase()}`,
    company,
    service,
    region,
    message,
    turnstileToken,
  };
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function isSmtpAuthError(error: unknown): error is SmtpError {
  if (!(error instanceof Error)) {
    return false;
  }

  const smtpError = error as SmtpError;
  return smtpError.code === "EAUTH" || smtpError.responseCode === 534;
}

function requestOriginIsAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return false;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  const configuredOrigins = (process.env.CONTACT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (configuredOrigins.includes(parsedOrigin.origin)) {
    return true;
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0];
  const requestHost = forwardedHost?.trim() || request.headers.get("host");
  return Boolean(requestHost && parsedOrigin.host === requestHost);
}

function getClientIp(request: Request) {
  const forwarded =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return forwarded.split(",")[0].trim().slice(0, 100) || "unknown";
}

function hashRateLimitKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function takeRateLimit(key: string, maximum: number, windowMs: number) {
  const now = Date.now();
  const entry = rateLimits.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(
    (timestamp) => timestamp > now - windowMs,
  );

  if (entry.timestamps.length >= maximum) {
    const retryAfterMs = entry.timestamps[0] + windowMs - now;
    return Math.max(1, Math.ceil(retryAfterMs / 1_000));
  }

  entry.timestamps.push(now);
  rateLimits.set(key, entry);

  if (rateLimits.size > 5_000) {
    for (const [storedKey, storedEntry] of rateLimits) {
      if (storedEntry.timestamps.at(-1)! < now - maximumCompletionTimeMs) {
        rateLimits.delete(storedKey);
      }
    }
  }

  return 0;
}

async function verifyTurnstile(
  token: string,
  clientIp: string,
  expectedHostname: string,
): Promise<boolean | "misconfigured"> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!siteKey && !secretKey) {
    return true;
  }
  if (!siteKey || !secretKey) {
    return "misconfigured";
  }
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          ...(clientIp !== "unknown" ? { remoteip: clientIp } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    const result = (await response.json()) as TurnstileResult;
    return Boolean(
      result.success &&
        result.action === "contact" &&
        result.hostname === expectedHostname,
    );
  } catch (error) {
    console.error("Contact form security verification failed:", error);
    return false;
  }
}

export async function POST(request: Request) {
  if (!requestOriginIsAllowed(request)) {
    return json({ error: "This request could not be accepted." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ error: "This request could not be accepted." }, 415);
  }
  if (Number.isFinite(declaredLength) && declaredLength > maxRequestBytes) {
    return json({ error: "This request is too large." }, 413);
  }

  const clientIp = getClientIp(request);
  const ipRetryAfter =
    clientIp === "unknown"
      ? 0
      : takeRateLimit(
          `ip:${hashRateLimitKey(clientIp)}`,
          5,
          15 * 60 * 1_000,
        );
  if (ipRetryAfter) {
    return json(
      { error: "Too many enquiries were sent. Please try again later." },
      429,
      { "Retry-After": String(ipRetryAfter) },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > maxRequestBytes) {
      return json({ error: "This request is too large." }, 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "The enquiry details could not be read." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json(
      { error: "Please complete all required fields with valid details." },
      400,
    );
  }

  const rawBody = body as Record<string, unknown>;

  // Silently accept honeypot submissions so simple bots do not learn to retry.
  if (typeof rawBody.website === "string" && rawBody.website.trim()) {
    return json({ success: true });
  }

  const now = Date.now();
  const startedAt = rawBody.startedAt;
  if (
    typeof startedAt !== "number" ||
    !Number.isSafeInteger(startedAt) ||
    startedAt > now - minimumCompletionTimeMs ||
    startedAt < now - maximumCompletionTimeMs
  ) {
    return json(
      { error: "Please wait a moment, refresh the page, and try again." },
      400,
    );
  }

  const payload = parsePayload(body);
  if (!payload) {
    return json(
      { error: "Please complete all required fields with valid details." },
      400,
    );
  }

  const turnstileResult = await verifyTurnstile(
    payload.turnstileToken,
    clientIp,
    new URL(request.headers.get("origin")!).hostname,
  );
  if (turnstileResult === "misconfigured") {
    console.error(
      "Contact form Turnstile requires both NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.",
    );
    return json(
      { error: "The security check is temporarily unavailable." },
      503,
    );
  }
  if (!turnstileResult) {
    return json(
      { error: "The security check failed. Please refresh and try again." },
      400,
    );
  }

  const emailRetryAfter = takeRateLimit(
    `email:${hashRateLimitKey(payload.email.toLowerCase())}`,
    3,
    60 * 60 * 1_000,
  );
  const duplicateRetryAfter = takeRateLimit(
    `duplicate:${hashRateLimitKey(`${payload.email}\n${payload.message}`)}`,
    2,
    60 * 60 * 1_000,
  );
  const retryAfter = Math.max(emailRetryAfter, duplicateRetryAfter);
  if (retryAfter) {
    return json(
      { error: "This enquiry was already received. Please try again later." },
      429,
      { "Retry-After": String(retryAfter) },
    );
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpSecure =
    process.env.SMTP_SECURE === undefined
      ? false
      : process.env.SMTP_SECURE === "true";

  if (!smtpUser || !smtpPass || !Number.isInteger(smtpPort)) {
    console.error("Contact form SMTP configuration is incomplete.");
    return json(
      { error: "Email is temporarily unavailable. Please try again shortly." },
      503,
    );
  }

  if (smtpHost === "smtp.gmail.com" && smtpPass.length !== 16) {
    console.error(
      "Contact form Gmail authentication requires a 16-character app password in SMTP_PASS.",
    );
    return json(
      { error: "Email is temporarily unavailable. Please try again shortly." },
      503,
    );
  }

  const contactAddress = process.env.CONTACT_TO ?? smtpUser;
  const fromAddress = process.env.SMTP_FROM ?? `Auxgens <${smtpUser}>`;
  const safeName = singleLine(payload.name);
  const safeService = singleLine(payload.service);

  const details = [
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company || "Not provided"],
    ["Service interest", payload.service],
    ["Region", payload.region || "Not provided"],
  ];

  const detailsHtml = details
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 16px 8px 0;color:#667085;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#101828;font-weight:600">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: smtpHost === "smtp.gmail.com" && !smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: contactAddress,
      envelope: {
        from: smtpUser,
        to: contactAddress,
      },
      replyTo: {
        name: safeName,
        address: payload.email,
      },
      subject: `Website enquiry: ${safeService} - ${safeName}`,
      text: [
        "A new enquiry was submitted through the Auxgens website.",
        "",
        ...details.map(([label, value]) => `${label}: ${value}`),
        "",
        "Message:",
        payload.message,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#101828">
          <h1 style="font-size:24px;margin:0 0 16px">New website enquiry</h1>
          <p style="color:#475467">A new enquiry was submitted through the Auxgens contact page.</p>
          <table style="border-collapse:collapse;margin:24px 0">${detailsHtml}</table>
          <h2 style="font-size:16px;margin:24px 0 8px">Message</h2>
          <div style="padding:16px;background:#f2f4f7;border-radius:8px;white-space:pre-wrap;line-height:1.6">${escapeHtml(payload.message)}</div>
        </div>
      `,
    });

    // Do not auto-reply to unverified addresses: that would make this endpoint
    // an email relay and can create backscatter to unrelated recipients.
    return json({ success: true });
  } catch (error) {
    if (isSmtpAuthError(error)) {
      console.error(
        "Contact form SMTP authentication failed. For Gmail, use a 16-character app password generated after enabling 2-Step Verification.",
      );
      return json(
        { error: "Email is temporarily unavailable. Please try again shortly." },
        503,
      );
    }

    console.error("Contact form email delivery failed:", error);
    return json(
      { error: "We could not send your enquiry. Please try again shortly." },
      502,
    );
  } finally {
    transporter.close();
  }
}
