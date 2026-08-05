"use client";

import Script from "next/script";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { PiPaperPlaneTiltDuotone } from "react-icons/pi";
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

  return (
    <form
      className="contact-form anim d1"
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
      <div className="contact-form-head">
        <p className="eyebrow">Send an enquiry</p>
        <h2>Protect what matters.</h2>
        <p>
          Share the context you can. Auxgens will respond through the primary
          sales inbox within one business day.
        </p>
      </div>

      <div className="contact-form-grid">
        <div className="field-block">
          <label htmlFor="name">Full name *</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            minLength={contactFieldLimits.name.min}
            maxLength={contactFieldLimits.name.max}
            value={values.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="name-help name-error"
          />
          <span id="name-help" className="field-help">Who should our team contact?</span>
          {errors.name && <span id="name-error" className="field-error">{errors.name}</span>}
        </div>

        <div className="field-block">
          <label htmlFor="email">Work email *</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={contactFieldLimits.email.max}
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby="email-help email-error"
          />
          <span id="email-help" className="field-help">Use the address where we can reply.</span>
          {errors.email && <span id="email-error" className="field-error">{errors.email}</span>}
        </div>

        <div className="field-block">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={contactFieldLimits.company.max}
            value={values.company}
            onChange={handleChange}
            aria-describedby="company-help"
          />
          <span id="company-help" className="field-help">Optional, but useful for routing.</span>
        </div>

        <div className="field-block">
          <label htmlFor="service">Service area *</label>
          <select
            id="service"
            name="service"
            value={values.service}
            onChange={handleChange}
            aria-invalid={Boolean(errors.service)}
            aria-describedby="service-help service-error"
          >
            <option value="">Select a service</option>
            {contactServices.map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          <span id="service-help" className="field-help">Pick the closest match.</span>
          {errors.service && <span id="service-error" className="field-error">{errors.service}</span>}
        </div>

        <div className="field-block">
          <label htmlFor="region">Region</label>
          <select
            id="region"
            name="region"
            value={values.region}
            onChange={handleChange}
            aria-describedby="region-help"
          >
            <option value="">Select a region</option>
            {contactRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <span id="region-help" className="field-help">Where will the engagement be based?</span>
        </div>

        <div className="field-block field-block-wide">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            rows={7}
            minLength={contactFieldLimits.message.min}
            maxLength={contactFieldLimits.message.max}
            value={values.message}
            onChange={handleChange}
            aria-invalid={Boolean(errors.message)}
            aria-describedby="message-help message-error"
          />
          <span id="message-help" className="field-help">Include timelines, systems, frameworks, or urgent concerns.</span>
          {errors.message && <span id="message-error" className="field-error">{errors.message}</span>}
        </div>
      </div>

      {turnstileSiteKey && (
        <div className="contact-security-check">
          <div ref={turnstileContainerRef} />
        </div>
      )}

      <div className="contact-form-actions">
        <button className="contact-submit" type="submit" disabled={status === "loading"}>
          <PiPaperPlaneTiltDuotone aria-hidden="true" focusable="false" />
          <span>{status === "loading" ? "Sending..." : "Send enquiry"}</span>
        </button>
        <p className={`contact-form-status contact-form-status-${status}`} aria-live="polite">
          {statusMessage}
        </p>
      </div>
    </form>
  );
}
