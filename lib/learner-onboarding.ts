/** Learner onboarding + language/course preferences (localStorage; optional profile sync later). */

import {
  languageToDefaultCourseId,
  SELECTED_COURSE_ID_KEY,
  SELECTED_LANGUAGE_KEY,
  type SelectedLanguage,
} from "@/lib/language-track";

const ONBOARDING_COMPLETED_KEY = "buunduu-onboarding-completed-v1";
const PREFERRED_COURSE_KEY = "buunduu-preferred-course-v1";

export type PreferredCourseId = "hsk5" | "korean-1" | "korean-survival";

/** Routes that must never auto-redirect to onboarding. */
export const LEARNER_NEVER_REDIRECT_PREFIXES = [
  "/profile",
  "/settings",
  "/admin",
  "/debug",
  "/onboarding",
  "/login",
  "/signup",
  "/home",
  "/help",
  "/demo",
  "/offline",
  "/dashboard",
  "/progress",
  "/my-assignments",
  "/deployment-check",
  "/api",
] as const;

/** Learning routes that require a selected language track. */
export const LEARNER_LEARNING_ROUTE_PREFIXES = [
  "/lessons",
  "/study",
  "/courses",
  "/games",
  "/kanji",
  "/review",
] as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function isNeverRedirectRoute(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return LEARNER_NEVER_REDIRECT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function isLearningRoute(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return LEARNER_LEARNING_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/** Server-safe check — client guard uses getSelectedLanguage(). */
export function shouldForceOnboardingRedirect(pathname: string): boolean {
  if (isNeverRedirectRoute(pathname)) return false;
  if (!isLearningRoute(pathname)) return false;
  return false;
}

export function getOnboardingCompleted(): boolean {
  if (!isBrowser()) return true;
  try {
    if (getSelectedLanguage()) return true;
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  } catch {
    return true;
  }
}

export function setOnboardingCompleted(completed: boolean): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, completed ? "true" : "false");
  } catch {
    /* ignore quota errors */
  }
}

export function getSelectedLanguage(): SelectedLanguage | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SELECTED_LANGUAGE_KEY);
    if (raw === "ko" || raw === "zh") return raw;

    const legacy = localStorage.getItem(PREFERRED_COURSE_KEY);
    if (legacy === "korean-1" || legacy === "korean-survival") return "ko";
    if (legacy === "hsk5") return "zh";
  } catch {
    /* ignore */
  }
  return null;
}

export function getSelectedCourseId(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SELECTED_COURSE_ID_KEY);
    if (raw?.trim()) return raw.trim();
    const lang = getSelectedLanguage();
    if (lang) return languageToDefaultCourseId(lang);
  } catch {
    /* ignore */
  }
  return null;
}

export function setLearnerLanguagePreference(
  lang: SelectedLanguage,
  courseId?: string
): void {
  if (!isBrowser()) return;
  const resolvedCourseId = courseId ?? languageToDefaultCourseId(lang);
  try {
    localStorage.setItem(SELECTED_LANGUAGE_KEY, lang);
    localStorage.setItem(SELECTED_COURSE_ID_KEY, resolvedCourseId);
    setOnboardingCompleted(true);

    if (lang === "ko") {
      const legacy: PreferredCourseId =
        resolvedCourseId === "korean-survival" ? "korean-survival" : "korean-1";
      localStorage.setItem(PREFERRED_COURSE_KEY, legacy);
    } else {
      localStorage.setItem(PREFERRED_COURSE_KEY, "hsk5");
    }
  } catch {
    /* ignore */
  }
}

export function getPreferredCourseId(): PreferredCourseId {
  if (!isBrowser()) return "hsk5";
  try {
    const raw = localStorage.getItem(PREFERRED_COURSE_KEY);
    if (raw === "korean-1" || raw === "korean-survival" || raw === "hsk5") {
      return raw;
    }
    const lang = getSelectedLanguage();
    if (lang === "ko") return "korean-1";
  } catch {
    /* ignore */
  }
  return "hsk5";
}

export function setPreferredCourseId(courseId: PreferredCourseId): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(PREFERRED_COURSE_KEY, courseId);
  } catch {
    /* ignore */
  }
}

export const PREFERRED_COURSE_OPTIONS: {
  id: PreferredCourseId;
  label: string;
}[] = [
  { id: "hsk5", label: "HSK 5 上" },
  { id: "korean-1", label: "Korean · 한글" },
  { id: "korean-survival", label: "Ажилд явах Korean" },
];

export { type SelectedLanguage } from "@/lib/language-track";
