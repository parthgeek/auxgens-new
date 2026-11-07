"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import poster from "../../diwali-wish.png";
import styles from "./DiwaliCelebration.module.css";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

type Rocket = { x: number; y: number; target: number; vx: number; color: string };

function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const colors = ["#ffd580", "#f6b14a", "#ffecc2", "#a8d978", "#e99d7c"];
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;
    let nextLaunch = 0;
    let launchIndex = 0;
    let sparks: Spark[] = [];
    let rockets: Rocket[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const animate = (time: number) => {
      const step = Math.min((time - previousTime) / 16.67 || 1, 2);
      previousTime = time;
      context.clearRect(0, 0, width, height);

      if (time >= nextLaunch) {
        const left = launchIndex % 2 === 0;
        const x = width * (left ? 0.06 + Math.random() * 0.12 : 0.82 + Math.random() * 0.12);
        rockets.push({
          x,
          y: height + 20,
          target: height * (0.12 + Math.random() * 0.4),
          vx: (left ? 1 : -1) * (0.25 + Math.random() * 0.6),
          color: colors[launchIndex % colors.length],
        });
        launchIndex += 1;
        nextLaunch = time + 650 + Math.random() * 450;
      }

      rockets = rockets.filter((rocket) => {
        rocket.x += rocket.vx * step;
        rocket.y -= 8 * step;
        // A bright rocket head with a tapering, sparkling launch trail.
        const trail = context.createLinearGradient(rocket.x, rocket.y, rocket.x, rocket.y + 65);
        trail.addColorStop(0, rocket.color);
        trail.addColorStop(1, "transparent");
        context.strokeStyle = trail;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(rocket.x, rocket.y);
        context.lineTo(rocket.x - rocket.vx * 6, rocket.y + 65);
        context.stroke();
        context.fillStyle = "#fff4d6";
        context.beginPath();
        context.arc(rocket.x, rocket.y, 2.5, 0, Math.PI * 2);
        context.fill();

        if (rocket.y > rocket.target) return true;
        const count = width < 600 ? 36 : 60;
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * Math.PI * 2;
          const speed = 1.1 + Math.random() * 3.4;
          sparks.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: rocket.color,
          });
        }
        return false;
      });

      sparks = sparks.filter((spark) => {
        const oldX = spark.x;
        const oldY = spark.y;
        spark.x += spark.vx * step;
        spark.y += spark.vy * step;
        spark.vy += 0.035 * step;
        spark.vx *= Math.pow(0.986, step);
        spark.life -= 0.012 * step;
        if (spark.life <= 0) return false;
        context.globalAlpha = spark.life;
        context.strokeStyle = spark.color;
        context.lineWidth = 1.6;
        context.beginPath();
        context.moveTo(oldX, oldY);
        context.lineTo(spark.x, spark.y);
        context.stroke();
        return true;
      });
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(animate);
    };

    const updateMotion = () => {
      window.cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
      sparks = [];
      rockets = [];
      previousTime = 0;
      nextLaunch = 0;
      if (!motion.matches && !document.hidden) frame = window.requestAnimationFrame(animate);
    };

    resize();
    updateMotion();
    window.addEventListener("resize", resize);
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.fireworks} aria-hidden="true" />;
}

export default function DiwaliCelebration() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Happy Diwali from Auxgens"
      onCancel={() => setOpen(false)}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <Fireworks />
      <div className={styles.poster}>
        <Image
          src={poster}
          alt="Happy Deepawali from Auxgens. May the festival of lights bring happiness, good health and prosperity to you and your family. May the light of knowledge, positivity and new opportunities always guide you."
          sizes="(max-width: 640px) 90vw, 640px"
          className={styles.image}
        />
        <button
          type="button"
          className={styles.close}
          aria-label="Close Diwali wishes"
          onClick={() => setOpen(false)}
          autoFocus
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </dialog>
  );
}
