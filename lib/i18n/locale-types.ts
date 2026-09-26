/** UI хэлний төрөл, тогтмолууд — сервер/клиент хоёуланд ("use client"-гүй). */
export type UiLocale = "mn" | "zh";

export const UI_LOCALE_COOKIE = "buunduu-ui-locale";
export const UI_LOCALE_STORAGE_KEY = "buunduu-ui-locale-v1";
export const DEFAULT_UI_LOCALE: UiLocale = "zh";

export function isUiLocale(v: unknown): v is UiLocale {
  return v === "mn" || v === "zh";
}
