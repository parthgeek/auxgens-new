"use client";

import Script from "next/script";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  PiArrowRightBold,
  PiCheckCircleDuotone,
  PiPaperPlaneTiltDuotone,
} from "react-icons/pi";
import {
  contactFieldLimits,
  contactRegions,
  contactServices,
} from "./contactFormConfig";

type FormValues = {
  name: string;
  email: string;
  company: string;
  service: string;
  region: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "light";
    },
  ) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const initialValues: FormValues = {
  name: "",
  email: "",
  company: "",
  service: "",
  region: "",
  message: "",
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues) {
  const errors: FormErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) {
    errors.name = "Please enter your name.";
  } else if (
    name.length < contactFieldLimits.name.min ||
    name.length > contactFieldLimits.name.max
  ) {
    errors.name = `Use ${contactFieldLimits.name.min}–${contactFieldLimits.name.max} characters.`;
  }

  if (!email) {
    errors.email = "Please enter your work email.";
  } else if (
    email.length > contactFieldLimits.email.max ||
    !emailPattern.test(email)
  ) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.service) {
    errors.service = "Please choose a service area.";
  }

  if (!message) {
    errors.message = "Please share a few details about your request.";
  } else if (
    message.length < contactFieldLimits.message.min ||
    message.length > contactFieldLimits.message.max
  ) {
    errors.message = `Use ${contactFieldLimits.message.min}–${contactFieldLimits.message.max.toLocaleString()} characters.`;
  }

  return errors;
}

export default function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [website, setWebsite] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    setStartedAt(Date.now());
  }, []);

  useEffect(() => {
    if (
      !turnstileSiteKey ||
      !turnstileReady ||
      !window.turnstile ||
      !turnstileContainerRef.current ||
      turnstileWidgetIdRef.current
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: turnstileSiteKey,
        action: "contact",
        callback: setTurnstileToken,
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
        theme: "light",
      },
    );
  }, [turnstileReady]);

  const resetTurnstile = () => {
    setTurnstileToken("");
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));

    if (errors[name as keyof FormValues]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }

    if (status !== "idle") {
      setStatus("idle");
      setSubmitError("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setSubmitError("Please review the highlighted fields before sending.");
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setStatus("error");
      setSubmitError("Please complete the security check before sending.");
      return;
    }

    setStatus("loading");
    setSubmitError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          website,
          startedAt,
          turnstileToken,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "We could not send your enquiry.");
      }

      setValues(initialValues);
      setWebsite("");
      setStartedAt(Date.now());
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not send your enquiry. Please try again.",
      );
    } finally {
      if (turnstileSiteKey) {
        resetTurnstile();
      }
    }
  };

  const statusMessage = {
    idle: "Fields marked with an asterisk are required.",
    loading: "Sending your enquiry securely...",
    success: "Thank you. Your enquiry has been sent to our team.",
    error: submitError,
  }[status];

  const messageLength = values.message.trim().length;

  return (
    <form
      className="cx-form"
      id="contact-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
        />
      )}
      <div className="contact-form-trap" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {status === "success" && (
        <div className="cx-success" role="status">
          <span className="cx-success-icon">
            <PiCheckCircleDuotone aria-hidden="true" focusable="false" />
          </span>
          <p className="eyebrow">Enquiry received</p>
          <h2>Thank you. We&rsquo;re on it.</h2>
          <p>
            Your enquiry has been sent to our team. Expect a reply from a
            specialist within one business day.
          </p>
          <button type="button" className="cx-ghost" onClick={() => setStatus("idle")}>
            Send another enquiry
          </button>
        </div>
      )}

      <div className="cx-form-body" hidden={status === "success"}>
        <div className="cx-form-head">
          <p className="eyebrow">Send an enquiry</p>
          <h2>Tell us what you need to protect.</h2>
          <p>Share the context you can &mdash; the more we know, the sharper our first reply.</p>
        </div>

        <fieldset className="cx-group">
          <legend><span>01</span> About you</legend>
          <div className="cx-grid">
            <div className="cx-field">
              <label htmlFor="name">Full name <i>*</i></label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                minLength={contactFieldLimits.name.min}
                maxLength={contactFieldLimits.name.max}
                value={values.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
                aria-describedby="name-error"
              />
              {errors.name && <span id="name-error" className="cx-error">{errors.name}</span>}
            </div>

            <div className="cx-field">
              <label htmlFor="email">Work email <i>*</i></label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                maxLength={contactFieldLimits.email.max}
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="email-error"
              />
              {errors.email && <span id="email-error" className="cx-error">{errors.email}</span>}
            </div>

            <div className="cx-field cx-field-wide">
              <label htmlFor="company">Company <small>Optional</small></label>
              <input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                placeholder="Where do you work?"
                maxLength={contactFieldLimits.company.max}
                value={values.company}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset
          className={`cx-group${errors.service ? " has-error" : ""}`}
          aria-describedby="service-error"
        >
          <legend><span>02</span> Service area <i>*</i></legend>
          <div className="cx-chips">
            {contactServices.map((service) => (
              <label key={service} className="cx-chip">
                <input
                  type="radio"
                  name="service"
                  value={service}
                  checked={values.service === service}
                  onChange={handleChange}
                />
                <span>{service}</span>
              </label>
            ))}
          </div>
          {errors.service && <span id="service-error" className="cx-error">{errors.service}</span>}
        </fieldset>

        <fieldset className="cx-group">
          <legend><span>03</span> Region <small>Optional</small></legend>
          <div className="cx-chips">
            {contactRegions.map((region) => (
              <label key={region} className="cx-chip">
                <input
                  type="radio"
                  name="region"
                  value={region}
                  checked={values.region === region}
                  onChange={handleChange}
                />
                <span>{region}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="cx-group">
          <legend><span>04</span> Your brief <i>*</i></legend>
          <div className="cx-field">
            <label htmlFor="message" className="cx-sr">Message</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Timelines, systems, frameworks, or urgent concerns..."
              minLength={contactFieldLimits.message.min}
              maxLength={contactFieldLimits.message.max}
              value={values.message}
              onChange={handleChange}
              aria-invalid={Boolean(errors.message)}
              aria-describedby="message-count message-error"
            />
            <div className="cx-field-foot">
              {errors.message ? (
                <span id="message-error" className="cx-error">{errors.message}</span>
              ) : (
                <span />
              )}
              <span id="message-count" className="cx-count">
                {messageLength.toLocaleString()} / {contactFieldLimits.message.max.toLocaleString()}
              </span>
            </div>
          </div>
        </fieldset>

        {turnstileSiteKey && (
          <div className="contact-security-check">
            <div ref={turnstileContainerRef} />
          </div>
        )}

        <div className="cx-actions">
          <p className={`cx-status cx-status-${status}`} aria-live="polite">
            {statusMessage}
          </p>
          <button className="cx-submit" type="submit" disabled={status === "loading"}>
            <PiPaperPlaneTiltDuotone aria-hidden="true" focusable="false" />
            <span>{status === "loading" ? "Sending..." : "Send enquiry"}</span>
            <PiArrowRightBold className="cx-submit-arrow" aria-hidden="true" focusable="false" />
          </button>
        </div>
      </div>
    </form>
  );
}
