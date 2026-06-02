"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { MOTION } from "@/lib/motion/config";
import { errorHaptic, successHaptic } from "@/lib/motion/haptics";

export type ExerciseFeedbackStatus = "idle" | "correct" | "wrong";

type Props = {
  status: ExerciseFeedbackStatus;
  children: ReactNode;
  className?: string;
};

/**
 * Wraps exercise content: green flash + check on correct, soft x-shake on wrong.
 */
export function ExerciseFeedback({ status, children, className }: Props) {
  const reducedMotion = useReducedMotion();
  const prevStatus = useRef<ExerciseFeedbackStatus>("idle");

  useEffect(() => {
    if (status === prevStatus.current) return;
    if (status === "correct" && !reducedMotion) {
      successHaptic();
    }
    if (status === "wrong" && !reducedMotion) {
      errorHaptic();
    }
    prevStatus.current = status;
  }, [status, reducedMotion]);

  const shake =
    status === "wrong" && !reducedMotion
      ? {
          x: MOTION.shake.x,
          transition: { duration: 0.35, ease: MOTION.ease.standard },
        }
      : undefined;

  return (
    <motion.div
      className={`relative ${className ?? ""}`}
      animate={shake}
    >
      {children}

      {status === "correct" && !reducedMotion ? (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-emerald-400/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            transition={{ duration: 0.45, ease: MOTION.ease.out }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute left-1/2 top-3 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white shadow-sm"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: [0.5, 1.08, 1] }}
            transition={{ duration: 0.35, ease: MOTION.ease.out }}
            aria-hidden
          >
            ✓
          </motion.div>
        </>
      ) : null}
    </motion.div>
  );
}
