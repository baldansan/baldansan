"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "@/lib/motion/config";

type PageTransitionProps = {
  /** Change when content swaps (e.g. review card id, lesson step key). */
  transitionKey: string;
  children: ReactNode;
  className?: string;
};

/**
 * Gentle fade + 8px slide-up for lesson modules / review steps.
 * Wrap the inner content that changes — not the full page shell.
 */
export function PageTransition({
  transitionKey,
  children,
  className,
}: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        className={className}
        initial={{ opacity: 0, y: MOTION.distance.slideUp }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -MOTION.distance.slideUp / 2 }}
        transition={{
          duration: MOTION.duration.normal,
          ease: MOTION.ease.out,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
