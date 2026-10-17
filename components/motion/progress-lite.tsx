"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION } from "@/lib/motion/config";

/**
 * AnimatedProgressBar / CountUp-ийн «motion» сангүй хувилбар.
 * Хичээлийн дэлгэрэнгүй хуудас (lesson-progress-card) зөвхөн эдгээр хоёрыг
 * ашигладаг байсан тул 44KB(gz) motion/react-ийг эхний ачаалалд оруулахгүй.
 * Харагдах байдал ижил: эхний render-д шууд утга (initial=false), дараагийн
 * өөрчлөлтөд 0.45с/0.5с ease-out хөдөлгөөн; reduced-motion бол шууд.
 */

const EASE_OUT_CSS = `cubic-bezier(${MOTION.ease.out.join(",")})`;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

type BarProps = {
  value: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
};

export function ProgressBarLite({
  value,
  className = "",
  trackClassName = "h-2 overflow-hidden rounded-full bg-slate-100",
  fillClassName = "h-full rounded-full bg-[var(--app-primary,#1FB85A)]",
}: BarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      <div className={trackClassName}>
        <div
          className={fillClassName}
          style={{
            width: `${clamped}%`,
            transition: `width ${MOTION.duration.progress}s ${EASE_OUT_CSS}`,
          }}
        />
      </div>
    </div>
  );
}

type CountProps = {
  value: number;
  className?: string;
  suffix?: string;
};

/** cubic-bezier(0,0,0.2,1)-тэй ойролцоо ease-out. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUpLite({ value, className, suffix = "" }: CountProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    // reduced-motion бол нэг frame-д шууд эцсийн утга.
    const durationMs = prefersReducedMotion() ? 0 : MOTION.duration.count * 1000;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = durationMs === 0 ? 1 : Math.min(1, (now - start) / durationMs);
      const current = Math.round(from + (value - from) * easeOut(t));
      setDisplay(current);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = value;
    };
  }, [value]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
