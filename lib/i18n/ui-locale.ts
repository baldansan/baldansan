"use client";

import { useEffect, useState } from "react";

/**
 * Аппын UI-ийн хэл (контент биш — товч, гарчиг, тайлбар).
 * "mn" — монгол (үндсэн), "zh" — хятад (багш нарын үнэлгээнд).
 */
export type UiLocale = "mn" | "zh";

const STORAGE_KEY = "buunduu-ui-locale-v1";

export function getUiLocale(): UiLocale {
  if (typeof window === "undefined") return "mn";
  try {
    return localStorage.getItem(STORAGE_KEY) === "zh" ? "zh" : "mn";
  } catch {
    return "mn";
  }
}

export function setUiLocale(locale: UiLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

/**
 * Hydration-д аюулгүй hook: сервер дээр үргэлж "mn", клиент дээр mount
 * болмогц бодит утга руу шилжинэ. Хэл солиход хуудас reload хийгддэг тул
 * storage-ийн өөрчлөлтийг сонсох шаардлагагүй.
 */
export function useUiLocale(): UiLocale {
  const [locale, setLocale] = useState<UiLocale>("mn");
  useEffect(() => {
    setLocale(getUiLocale());
  }, []);
  return locale;
}
