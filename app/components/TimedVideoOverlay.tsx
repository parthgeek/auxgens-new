"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_DELAY_MS = 5000;
const VIDEO_SRC = "/gcfv.mp4";

export default function TimedVideoOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, VIDEO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    document.body.classList.add("has-video-overlay");
    const video = videoRef.current;

    if (video) {
      const playVideo = async () => {
        video.muted = false;
        video.volume = 1;

        try {
          await video.play();
        } catch {
          video.muted = true;
          await video.play().catch(() => undefined);
        }
      };

      playVideo();
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsVisible(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("has-video-overlay");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isVisible]);

  const closeOverlay = () => {
    const video = videoRef.current;

    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="video-overlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="video-overlay-backdrop"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="video-overlay-panel">
        <button
          type="button"
          className="video-overlay-close"
          aria-label="Close video"
          onClick={closeOverlay}
        >
          x
        </button>
        <video
          ref={videoRef}
          className="video-overlay-media"
          src={VIDEO_SRC}
          autoPlay
          playsInline
          controls
          preload="auto"
        />
      </div>
    </div>
  );
}
