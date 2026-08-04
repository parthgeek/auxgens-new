import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { marketingQuestions, marketingSections } from "../../digital-marketing-questionnaire/questions";

export const runtime = "nodejs";

type SmtpError = Error & {
  code?: string;
  responseCode?: number;
};

type QuestionnairePayload = {
  name: string;
  email: string;
  organisation: string;
  website: string;
  responses: Array<{
    id: string;
    answer: string;
  }>;
};

const contactAddress = "contact@auxgens.net";
const websiteUrl = "https://auxgens.net";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const signatureImageUrl =
  "https://cdn.postimage.me/2026/06/12/WhatsApp-Image-2026-06-13-at-01.23.46.jpeg";

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

function readString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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

function emailUnavailable(message: string) {
  return NextResponse.json(
    {
      error:
        process.env.NODE_ENV === "development"
          ? message
          : "Email is temporarily unavailable. Please try again shortly.",
    },
    { status: 503 },
  );
}

function parsePayload(value: unknown): QuestionnairePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;
  const rawResponses = Array.isArray(body.responses) ? body.responses.slice(0, 100) : [];
  const payload: QuestionnairePayload = {
    name: readString(body.name, 120),
    email: readString(body.email, 254),
    organisation: readString(body.organisation, 180),
    website: readString(body.website, 500),
    responses: rawResponses.map((item) => {
      const response = item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {};
      const rawAnswer = response.answer;
      return {
        id: readString(response.id, 100),
        answer: Array.isArray(rawAnswer)
          ? rawAnswer.map((answer) => readString(answer, 300)).filter(Boolean).join(", ").slice(0, 6000)
          : readString(rawAnswer, 6000),
      };
    }),
  };

  if (
    !payload.name ||
    !payload.organisation ||
    !emailPattern.test(payload.email) ||
    payload.responses.length === 0
  ) {
    return null;
  }

  return payload;
}

export async function POST(request: Request) {
  let payload: QuestionnairePayload | null = null;

  try {
    payload = parsePayload(await request.json());
  } catch {
    return NextResponse.json(
      { error: "The questionnaire details could not be read." },
      { status: 400 },
    );
  }

  if (!payload) {
    return NextResponse.json(
      { error: "Please provide your name, school, valid email, and responses." },
      { status: 400 },
    );
  }

  const submittedAnswerMap = new Map(
    payload.responses.map((response) => [response.id, response.answer]),
  );
  const normalizedResponses = marketingQuestions.map((question, index) => ({
    number: index + 1,
    id: question.id,
    section: question.section,
    question: question.prompt,
    answer: submittedAnswerMap.get(question.id) || "Not answered",
  }));

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpSecure =
    process.env.SMTP_SECURE === undefined
      ? false
      : process.env.SMTP_SECURE === "true";

  if (!smtpUser || !smtpPass || !Number.isInteger(smtpPort)) {
    console.error("Digital marketing questionnaire SMTP configuration is incomplete.");
    return emailUnavailable(
      "Email is not configured locally. Add SMTP_USER and SMTP_PASS to .env.local, then restart the development server.",
    );
  }

  if (smtpHost === "smtp.gmail.com" && smtpPass.length !== 16) {
    console.error(
      "Digital marketing questionnaire Gmail authentication requires a 16-character app password in SMTP_PASS.",
    );
    return emailUnavailable(
      "Gmail SMTP requires a 16-character app password in SMTP_PASS. Update .env.local, then restart the development server.",
    );
  }

  const fromAddress = process.env.SMTP_FROM ?? `Auxgens <${smtpUser}>`;
  const safeName = singleLine(payload.name);
  const submittedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const textSections = marketingSections.flatMap((section) => [
    "",
    section.toUpperCase(),
    ...normalizedResponses
      .filter((response) => response.section === section)
      .map(
        (response) =>
          `${response.number}. ${response.question}\nAnswer: ${response.answer}`,
      ),
  ]);

  const htmlSections = marketingSections
    .map((section) => {
      const rows = normalizedResponses
        .filter((response) => response.section === section)
        .map(
          (response) => `
            <tr>
              <td style="width:34px;padding:14px 12px 14px 0;border-top:1px solid #dfe9da;color:#6a7d6c;vertical-align:top">${response.number}</td>
              <td style="padding:14px 12px;border-top:1px solid #dfe9da;vertical-align:top">
                <strong style="display:block;color:#17351b;font-size:14px">${escapeHtml(response.question)}</strong>
                <span style="display:block;margin-top:6px;color:#405845;white-space:pre-wrap">${escapeHtml(response.answer)}</span>
              </td>
            </tr>`,
        )
        .join("");

      return `
        <h2 style="margin:30px 0 8px;color:#1b4d22;font-size:17px">${escapeHtml(section)}</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse">${rows}</table>`;
    })
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
    socketTimeout: 25_000,
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: contactAddress,
      replyTo: {
        name: safeName,
        address: payload.email,
      },
      subject: `Sri Sri Academy digital marketing questionnaire - ${safeName}`,
      text: [
        "Sri Sri Academy's digital marketing questionnaire was submitted through the Auxgens website.",
        "",
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `School: ${payload.organisation}`,
        `Website: ${payload.website || "Not provided"}`,
        `Submitted: ${submittedAt}`,
        ...textSections,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;color:#17351b;line-height:1.6">
          <div style="padding:26px 28px;background:#17351b;color:#f5f9f2;border-radius:10px 10px 0 0">
            <p style="margin:0 0 6px;color:#a9d98f;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Prepared for Sri Sri Academy, Siliguri</p>
            <h1 style="margin:0;font-size:25px">Digital marketing questionnaire</h1>
          </div>
          <div style="padding:24px 28px;border:1px solid #d2e3c9;border-top:0;background:#fbfdf9">
            <table role="presentation" style="border-collapse:collapse">
              <tr><td style="padding:5px 18px 5px 0;color:#6a7d6c">Name</td><td style="padding:5px 0;font-weight:700">${escapeHtml(payload.name)}</td></tr>
              <tr><td style="padding:5px 18px 5px 0;color:#6a7d6c">Email</td><td style="padding:5px 0;font-weight:700">${escapeHtml(payload.email)}</td></tr>
              <tr><td style="padding:5px 18px 5px 0;color:#6a7d6c">School</td><td style="padding:5px 0;font-weight:700">${escapeHtml(payload.organisation)}</td></tr>
              <tr><td style="padding:5px 18px 5px 0;color:#6a7d6c">Website</td><td style="padding:5px 0;font-weight:700">${escapeHtml(payload.website || "Not provided")}</td></tr>
              <tr><td style="padding:5px 18px 5px 0;color:#6a7d6c">Submitted</td><td style="padding:5px 0;font-weight:700">${escapeHtml(submittedAt)}</td></tr>
            </table>
            ${htmlSections}
          </div>
        </div>`,
    });

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: {
          name: safeName,
          address: payload.email,
        },
        replyTo: contactAddress,
        subject: "Your Sri Sri Academy digital marketing questionnaire",
        text: [
          `Hello ${payload.name},`,
          "",
          "Thank you for completing Sri Sri Academy's digital marketing questionnaire. Your responses have been sent to the Auxgens team for review.",
          "",
          `School: ${payload.organisation}`,
          "",
          "We will contact you through the email address you provided.",
          "",
          "Regards,",
          "Team Auxgens",
          contactAddress,
          websiteUrl,
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#17351b;line-height:1.7">
            <p>Hello ${escapeHtml(payload.name)},</p>
            <p>Thank you for completing Sri Sri Academy&apos;s digital marketing questionnaire. Your responses have been sent to the Auxgens team for review.</p>
            <div style="margin:22px 0;padding:16px 18px;border:1px solid #d2e3c9;background:#f4f9f0;border-radius:8px">
              <span style="display:block;color:#6a7d6c;font-size:13px">School</span>
              <strong style="display:block;margin-top:3px">${escapeHtml(payload.organisation)}</strong>
            </div>
            <p>We will contact you through the email address you provided.</p>
            <p style="margin:28px 0 12px">Regards,</p>
            <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;max-width:560px;text-decoration:none">
              <img src="${signatureImageUrl}" alt="Team Auxgens - visit auxgens.net" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0" />
            </a>
          </div>`,
      });
    } catch (confirmationError) {
      console.error("Questionnaire confirmation email delivery failed:", confirmationError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isSmtpAuthError(error)) {
      console.error("Digital marketing questionnaire SMTP authentication failed.");
      return emailUnavailable(
        "SMTP authentication failed. For Gmail, use a 16-character app password generated after enabling 2-Step Verification.",
      );
    }

    console.error("Digital marketing questionnaire delivery failed:", error);
    return NextResponse.json(
      { error: "We could not send your questionnaire. Please try again shortly." },
      { status: 502 },
    );
  } finally {
    transporter.close();
  }
}
