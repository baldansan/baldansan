"use client";

import { useEffect, type ReactNode } from "react";
import {
  UI_LOCALE_COOKIE,
  UiLocaleContext,
  getUiLocale,
  setUiLocale,
  type UiLocale,
} from "@/lib/i18n/ui-locale";

/**
 * Root layout cookie-гоос уншсан хэлийг бүх client компонентод өгнө (SSR = client).
 * Cookie байхгүй ч localStorage-д хуучин сонголт байвал cookie тавиад нэг удаа reload.
 */
export function UiLocaleProvider({ locale, children }: { locale: UiLocale; children: ReactNode }) {
  useEffect(() => {
    const hasCookie = new RegExp(`(?:^|;\\s*)${UI_LOCALE_COOKIE}=`).test(document.cookie);
    const client = getUiLocale();
    if (!hasCookie) {
      setUiLocale(client);
      if (client !== locale) window.location.reload();
    }
  }, [locale]);
  return <UiLocaleContext.Provider value={locale}>{children}</UiLocaleContext.Provider>;
}
