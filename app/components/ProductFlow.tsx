"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import type { ProductStep } from "../data/products";

const pad = (value: number) => String(value).padStart(2, "0");

export default function ProductFlow({ steps, name }: { steps: ProductStep[]; name: string }) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const last = steps.length - 1;
  const running = visible && steps.length > 1;

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % steps.length), 3000);
    return () => window.clearTimeout(timer);
  }, [active, running, steps.length]);

  const goTo = (index: number) => {
    setActive(Math.max(0, Math.min(index, last)));
  };

  if (!steps.length) return null;

  return (
    <div
      ref={root}
      className="product-flow"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${name} process`}
    >
      <div className="product-flow-topline">
        <span>Explore the process</span>
        <span className="product-flow-count">{pad(active + 1)} <span>/ {pad(steps.length)}</span></span>
      </div>
      <div
        className="product-flow-stage"
        tabIndex={0}
        aria-label="Use left and right arrow keys or swipe to explore steps"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(active + (event.key === "ArrowRight" ? 1 : -1));
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            goTo(event.key === "Home" ? 0 : last);
          }
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          gesture.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => {
          const start = gesture.current;
          gesture.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goTo(active + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => { gesture.current = null; }}
        onLostPointerCapture={() => { gesture.current = null; }}
      >
        {steps.map((step, index) => {
          let offset = index - active;
          if (offset > steps.length / 2) offset -= steps.length;
          if (offset < -steps.length / 2) offset += steps.length;
          return (
            <article
              key={step.title}
              className={`product-flow-slide${offset === 0 ? " is-active" : ""}`}
              style={{ "--step-offset": offset, "--step-scale": offset === 0 ? 1 : 0.9 } as CSSProperties}
              role="group"
              aria-roledescription="slide"
              aria-label={`Step ${index + 1} of ${steps.length}`}
              aria-hidden={offset !== 0}
              data-distant={Math.abs(offset) > 1}
            >
              <span className="product-flow-step-label">Step {pad(index + 1)}</span>
              <span className="product-flow-watermark" aria-hidden="true">{pad(index + 1)}</span>
              <h3>{step.title}</h3>
              <p>{step.sub}</p>
              <span className="product-flow-slide-foot">{index === last ? "The outcome" : "The process"}<PiArrowRightBold aria-hidden="true" /></span>
            </article>
          );
        })}
      </div>
      <div className="product-flow-controls">
        <button type="button" className="product-flow-arrow" aria-label="Previous step" disabled={active === 0} onClick={() => goTo(active - 1)}>
          <PiArrowLeftBold aria-hidden="true" />
        </button>
        <div className="product-flow-markers" aria-label="Choose a step">
          {steps.map((step, index) => (
            <button
              type="button"
              key={step.title}
              className={`product-flow-marker${index === active ? " is-active" : ""}${index < active ? " is-complete" : ""}`}
              aria-label={`Step ${index + 1}: ${step.title}`}
              aria-current={index === active ? "step" : undefined}
              onClick={() => goTo(index)}
            >
              <span className="product-flow-marker-line" />
              <span className="product-flow-marker-number">{pad(index + 1)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="product-flow-arrow" aria-label="Next step" disabled={active === last} onClick={() => goTo(active + 1)}>
          <PiArrowRightBold aria-hidden="true" />
        </button>
      </div>
      <p className="product-flow-sr" aria-live={running ? "off" : "polite"} aria-atomic="true">
        Step {active + 1} of {steps.length}: {steps[active].title}. {steps[active].sub}
      </p>
    </div>
  );
}
