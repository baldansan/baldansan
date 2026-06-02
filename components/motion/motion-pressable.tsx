"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "@/lib/motion/config";

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  children: ReactNode;
};

/** Primary/secondary buttons — scale 0.97 on tap. */
export function MotionButton({
  children,
  className,
  disabled,
  type = "button",
  ...props
}: MotionButtonProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      className={className}
      disabled={disabled}
      whileTap={
        reducedMotion || disabled
          ? undefined
          : { scale: MOTION.press.buttonScale }
      }
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.standard }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

type MotionCardBaseProps = {
  children: ReactNode;
  disabled?: boolean;
};

type MotionCardDivProps = MotionCardBaseProps &
  Omit<HTMLMotionProps<"div">, "ref"> & { as?: "div" };

type MotionCardButtonProps = MotionCardBaseProps &
  Omit<HTMLMotionProps<"button">, "ref"> & { as: "button" };

type MotionCardProps = MotionCardDivProps | MotionCardButtonProps;

/** Interactive cards — slight lift + subtle scale on press. */
export function MotionCard(props: MotionCardProps) {
  const reducedMotion = useReducedMotion();
  const { children, className, disabled, as = "div", ...rest } = props;

  const whileTap =
    reducedMotion || disabled
      ? undefined
      : {
          scale: MOTION.press.cardScale,
          y: MOTION.press.cardLift,
        };

  const transition = {
    duration: MOTION.duration.fast,
    ease: MOTION.ease.standard,
  };

  if (as === "button") {
    return (
      <motion.button
        className={className}
        disabled={disabled}
        whileTap={whileTap}
        transition={transition}
        {...(rest as HTMLMotionProps<"button">)}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.div
      className={className}
      whileTap={whileTap}
      transition={transition}
      {...(rest as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}
