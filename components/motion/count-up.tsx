"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MOTION } from "@/lib/motion/config";

type Props = {
  value: number;
  className?: string;
  suffix?: string;
};

export function CountUp({ value, className, suffix = "" }: Props) {
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration: MOTION.duration.count,
      ease: MOTION.ease.out,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value, motionValue, reducedMotion]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
