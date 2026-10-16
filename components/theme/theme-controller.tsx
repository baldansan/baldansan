"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  THEME_CHANGED_EVENT,
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  getThemePref,
  isForcedLightPath,
  resolveTheme,
} from "@/lib/theme/theme-pref";

/**
 * Харагдах байдлыг амьд байлгана:
 *  - admin / багш / байгууллагын замд үргэлж "light"
 *  - "Системийн" сонголттой үед утасны горим солигдоход дагаж солигдоно
 *  - өөр таб дээр тохиргоо солигдвол (storage event) энд ч шинэчлэгдэнэ
 * Эхний рендерийн attribute-ыг app/layout.tsx-ийн inline script тавьдаг.
 */
export function ThemeController() {
  const pathname = usePathname();
  const forcedLight = isForcedLightPath(pathname);

  useEffect(() => {
    const sync = () => {
      applyThemeToDocument(forcedLight ? "light" : resolveTheme(getThemePref()));
    };
    sync();

    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      mql = null;
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) sync();
    };
    mql?.addEventListener?.("change", sync);
    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_CHANGED_EVENT, sync);
    return () => {
      mql?.removeEventListener?.("change", sync);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_CHANGED_EVENT, sync);
    };
  }, [forcedLight]);

  return null;
}
