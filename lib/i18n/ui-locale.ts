"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Аппын UI-ийн хэл (контент биш — товч, гарчиг, тайлбар).
 * "zh" — хятад (ҮНДСЭН: багш, оюутнууд шууд ордог), "mn" — монгол (толгойн солигчоор).
 *
 * Эх сурвалж: cookie `buunduu-ui-locale` (сервер ч уншина) → localStorage (хуучин
 * хэрэглэгчийн сонголт) → "zh".
 */
import {
  DEFAULT_UI_LOCALE,
  UI_LOCALE_COOKIE,
  UI_LOCALE_STORAGE_KEY,
  isUiLocale,
  type UiLocale,
} from "./locale-types";

export { DEFAULT_UI_LOCALE, UI_LOCALE_COOKIE, UI_LOCALE_STORAGE_KEY, isUiLocale };
export type { UiLocale };

function readCookieLocale(): UiLocale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)buunduu-ui-locale=(zh|mn)(?:;|$)/);
  return m ? (m[1] as UiLocale) : null;
}

function readStorageLocale(): UiLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(UI_LOCALE_STORAGE_KEY);
    return isUiLocale(v) ? v : null;
  } catch {
    return null;
  }
}

/** Клиент дээр синхрон унших (hook биш газарт). Сервер дээр үргэлж DEFAULT. */
export function getUiLocale(): UiLocale {
  if (typeof window === "undefined") return DEFAULT_UI_LOCALE;
  return readCookieLocale() ?? readStorageLocale() ?? DEFAULT_UI_LOCALE;
}

export function setUiLocale(locale: UiLocale): void {
  try {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  try {
    document.cookie = `${UI_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // ignore
  }
}

/** Хэл солиод хуудсыг дахин ачаална (SSR + DOM орчуулагч хоёулаа шинэ хэлээр). */
export function switchUiLocale(locale: UiLocale): void {
  setUiLocale(locale);
  if (typeof window !== "undefined") window.location.reload();
}

export const UiLocaleContext = createContext<UiLocale | null>(null);

/**
 * UI хэлний hook. Root layout-ын UiLocaleProvider cookie-гоос уншсан утгыг өгдөг тул
 * сервер/клиент ижил render хийнэ (hydration зөрүүгүй). Provider-гүй газарт
 * mount-ын дараа клиентийн утга руу шилжинэ.
 */
export function useUiLocale(): UiLocale {
  const ctx = useContext(UiLocaleContext);
  const [fallback, setFallback] = useState<UiLocale>(DEFAULT_UI_LOCALE);
  useEffect(() => {
    if (ctx === null) setFallback(getUiLocale());
  }, [ctx]);
  return ctx ?? fallback;
}
