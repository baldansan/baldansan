"use client";

import { useReducedMotion } from "motion/react";
import { MOTION, motionDuration } from "@/lib/motion/config";

export function useMotionSettings() {
  const reducedMotion = useReducedMotion();

  return {
    reducedMotion: Boolean(reducedMotion),
    duration: {
      normal: motionDuration(MOTION.duration.normal, reducedMotion),
      flip: motionDuration(MOTION.duration.flip, reducedMotion),
      progress: motionDuration(MOTION.duration.progress, reducedMotion),
      count: motionDuration(MOTION.duration.count, reducedMotion),
    },
    shouldAnimate: !reducedMotion,
  };
}
