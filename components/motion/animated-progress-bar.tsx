"use client";

import { motion, useReducedMotion } from "motion/react";
import { MOTION } from "@/lib/motion/config";

type Props = {
  value: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
};

export function AnimatedProgressBar({
  value,
  className = "",
  trackClassName = "h-2 overflow-hidden rounded-full bg-slate-100",
  fillClassName = "h-full rounded-full bg-[var(--app-primary,#1FB85A)]",
}: Props) {
  const reducedMotion = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      <div className={trackClassName}>
        <motion.div
          className={fillClassName}
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={{
            duration: reducedMotion ? 0 : MOTION.duration.progress,
            ease: MOTION.ease.out,
          }}
        />
      </div>
    </div>
  );
}
