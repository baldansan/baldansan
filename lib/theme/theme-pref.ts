"use client";

/**
 * Харагдах байдал (Гэрэлтэй / Харанхуй / Системийн).
 * Эх сурвалж: localStorage → "system" (өгөгдмөл).
 *
 * <html data-theme="light|dark"> attribute-аар хэрэгжинэ — app/globals.css дэх
 * `html[data-theme="dark"]` токенууд болон override-ууд шууд ажиллана.
 * Эхний рендерт анивчихгүйн тулд app/layout.tsx-ийн inline script мөн адил
 * түлхүүрийг уншиж attribute тавьдаг (THEME_SCRIPT).
 *
 * Admin / багш / байгууллагын хэсэгт харанхуй горим хэрэггүй — тэдгээр замд
 * ThemeController "light"-ыг хүчилнэ (isForcedLightPath).
 */

export const THEME_STORAGE_KEY = "buunduu-theme-v1";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREF: ThemePref = "system";

export const THEME_OPTIONS: { id: ThemePref; labelMn: string; descMn: string; icon: string }[] = [
  { id: "light", labelMn: "Гэрэлтэй", descMn: "Цагаан дэвсгэр, өдрийн цагт тохиромжтой", icon: "☀️" },
  { id: "dark", labelMn: "Харанхуй", descMn: "Нүд чилээхгүй бараан дэвсгэр", icon: "🌙" },
  { id: "system", labelMn: "Системийн", descMn: "Утасны тохиргоог дагана", icon: "📱" },
];

/** Харанхуй горим хэрэггүй замууд (admin CMS, багш, байгууллага). */
const FORCED_LIGHT_PREFIXES = ["/admin", "/teacher", "/teachers", "/teacher-dashboard", "/organization"];

export function isForcedLightPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return FORCED_LIGHT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isThemePref(v: unknown): v is ThemePref {
  return v === "light" || v === "dark" || v === "system";
}

export function getThemePref(): ThemePref {
  if (typeof window === "undefined") return DEFAULT_THEME_PREF;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePref(v) ? v : DEFAULT_THEME_PREF;
  } catch {
    return DEFAULT_THEME_PREF;
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

/** Сонголтыг хадгалаад <html> дээр шууд хэрэгжүүлнэ (reload шаардлагагүй). */
export function setThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // ignore
  }
  applyThemeToDocument(resolveTheme(pref));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: { pref } }));
  }
}

export const THEME_CHANGED_EVENT = "bs:theme-changed";

export function applyThemeToDocument(theme: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== theme) {
    root.setAttribute("data-theme", theme);
  }
  // PWA статус мөр / address bar-ын өнгө
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0f1512" : "#1FB85A");
}

/** Одоогийн <html data-theme> утга (эхний рендерийн script тавьсан). */
export function getDocumentTheme(): ResolvedTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
