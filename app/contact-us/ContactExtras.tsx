"use client";

import { useEffect, useRef, useState } from "react";
import { PiCheckBold, PiCopySimpleDuotone } from "react-icons/pi";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      className={`cx-copy${copied ? " is-copied" : ""}`}
      onClick={handleCopy}
      aria-label={copied ? "Email copied" : `Copy ${email}`}
    >
      {copied ? (
        <PiCheckBold aria-hidden="true" focusable="false" />
      ) : (
        <PiCopySimpleDuotone aria-hidden="true" focusable="false" />
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function LocalTime({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const secondOffset = useRef(0);

  useEffect(() => {
    const start = new Date();
    secondOffset.current = start.getSeconds() + start.getMilliseconds() / 1000;
    setNow(start);
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const parts = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(now)
    : [];
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hours = part("hour") % 24;
  const minutes = part("minute");
  const seconds = part("second");

  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const label = now
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    : "--:--";

  return (
    <span className="cx-time">
      <svg
        className={`cx-clock${now ? " is-live" : ""}`}
        viewBox="0 0 40 40"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="cx-clock-face" cx="20" cy="20" r="18" />
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            className="cx-clock-tick"
            x1="20"
            y1={i % 3 ? "4.5" : "3.5"}
            x2="20"
            y2={i % 3 ? "6" : "7"}
            transform={`rotate(${i * 30} 20 20)`}
          />
        ))}
        <line
          className="cx-clock-hour"
          x1="20" y1="20" x2="20" y2="11"
          style={{ transform: `rotate(${hourAngle}deg)` }}
        />
        <line
          className="cx-clock-minute"
          x1="20" y1="20" x2="20" y2="7.5"
          style={{ transform: `rotate(${minuteAngle}deg)` }}
        />
        <g
          className="cx-clock-second"
          style={{ animationDelay: `-${secondOffset.current}s` }}
        >
          <line x1="20" y1="23.5" x2="20" y2="6" />
        </g>
        <circle className="cx-clock-pin" cx="20" cy="20" r="1.6" />
      </svg>
      <strong>{label}</strong>
    </span>
  );
}
