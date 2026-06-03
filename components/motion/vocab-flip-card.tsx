"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "@/lib/motion/config";

type Props = {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  onFlip: () => void;
  disabled?: boolean;
  className?: string;
};

/** 3D rotateY flip — 300ms, disabled when prefers-reduced-motion. */
export function VocabFlipCard({
  flipped,
  front,
  back,
  onFlip,
  disabled = false,
  className = "",
}: Props) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <button
        type="button"
        onClick={onFlip}
        disabled={disabled}
        className={`relative w-full min-h-[220px] rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200 ${className}`}
        aria-pressed={flipped}
      >
        {flipped ? back : front}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onFlip}
      disabled={disabled}
      className={`relative w-full min-h-[220px] rounded-2xl bg-transparent p-0 text-center ${className}`}
      style={{ perspective: 1000 }}
      aria-pressed={flipped}
    >
      <motion.div
        className="relative h-full min-h-[220px] w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{
          duration: MOTION.duration.flip,
          ease: MOTION.ease.out,
        }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-6 ring-1 ring-slate-200"
          style={{ backfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-6 ring-1 ring-slate-200"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </motion.div>
    </button>
  );
}
