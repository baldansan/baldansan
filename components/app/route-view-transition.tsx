"use client";

import { ViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Хуудас хоорондын зөөлөн шилжилт — React <ViewTransition> (Next.js
 * experimental.viewTransition). Route navigation бүр transition тул
 * хуучин агуулга .bs-page-out, шинэ нь .bs-page-in классаар хөдөлнө
 * (CSS: app/motion.css). Дэмжихгүй хөтөч дээр энгийн солигдоно.
 */
export function RouteViewTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter="bs-page-in"
      exit="bs-page-out"
      update="bs-page-swap"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
