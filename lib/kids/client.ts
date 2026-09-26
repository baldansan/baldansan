/** Хүүхдийн бүртгэл — browser талын wrapper-ууд (/api/kids/* route-ууд) + хүүхдийн горим. */

import { ACTIVE_HSK_LEVEL_KEY, writeStoredActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { SELECTED_COURSE_ID_KEY, SELECTED_LANGUAGE_KEY } from "@/lib/language-track";
import { setLearnerLanguagePreference } from "@/lib/learner-onboarding";
import { supabase } from "@/lib/supabase/client";
import { dismissProgressSyncOffer } from "@/lib/supabase/progress-sync";
import {
  GUARDIAN_EMAIL_STORAGE_KEY,
  KID_MODE_PROFILE_STORAGE_KEY,
  KID_MODE_STORAGE_KEY,
  isKidEmail,
  type KidLoginTokens,
  type KidProfile,
} from "@/lib/kids/types";

export type KidsClientResult<T> = {
  data: T | null;
  error: string | null;
  /** Сервер дээр SUPABASE_SERVICE_ROLE_KEY тохируулаагүй. */
  serviceRoleMissing?: boolean;
  adminHint?: string | null;
  warning?: string | null;
};

type KidsApiPayload<T> = {
  ok?: boolean;
  data?: T;
  message?: string;
  adminHint?: string | null;
  serviceRoleMissing?: boolean;
  warning?: string | null;
};

async function callKidsApi<T>(
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown }
): Promise<KidsClientResult<T>> {
  try {
    const response = await fetch(path, {
      method: init?.method ?? "POST",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as KidsApiPayload<T> | null;
    if (!response.ok || !payload?.ok) {
      return {
        data: null,
        error: payload?.message ?? "Алдаа гарлаа. Дахин оролдоно уу.",
        serviceRoleMissing: Boolean(payload?.serviceRoleMissing),
        adminHint: payload?.adminHint ?? null,
      };
    }
    return { data: (payload.data ?? null) as T | null, error: null, warning: payload.warning ?? null };
  } catch {
    return { data: null, error: "Сүлжээний алдаа гарлаа. Дахин оролдоно уу." };
  }
}

// --- API wrappers ---

export function fetchKids(classroomId?: string | null): Promise<KidsClientResult<KidProfile[]>> {
  const query = classroomId ? `?classroomId=${encodeURIComponent(classroomId)}` : "";
  return callKidsApi<KidProfile[]>(`/api/kids/list${query}`, { method: "GET" });
}

export function createKidProfile(input: {
  displayName: string;
  avatar: string;
  pin: string;
  birthYear?: number | null;
  classroomJoinCode?: string | null;
  classroomId?: string | null;
}): Promise<KidsClientResult<KidProfile>> {
  return callKidsApi<KidProfile>("/api/kids/create", { body: input });
}

export function updateKidProfile(input: {
  childUserId: string;
  displayName?: string;
  avatar?: string;
  pin?: string;
  birthYear?: number | null;
  /** undefined = өөрчлөхгүй, "" = ангиас гаргах */
  classroomJoinCode?: string;
}): Promise<KidsClientResult<KidProfile>> {
  return callKidsApi<KidProfile>("/api/kids/update", { body: input });
}

export function deleteKidProfile(childUserId: string): Promise<KidsClientResult<{ childUserId: string }>> {
  return callKidsApi<{ childUserId: string }>("/api/kids/delete", { body: { childUserId } });
}

// --- Хүүхдийн горим (localStorage) ---

export type KidModeProfile = { childUserId: string; displayName: string; avatar: string };

/** Эцэг эхийн төхөөрөмжийн хэл/түвшний тохиргоо — хүүхдийн горимоос гарахад сэргээнэ. */
const GUARDIAN_PREFS_STORAGE_KEY = "buunduu-guardian-prefs-v1";
const GUARDIAN_PREF_KEYS = [
  SELECTED_LANGUAGE_KEY,
  SELECTED_COURSE_ID_KEY,
  ACTIVE_HSK_LEVEL_KEY,
  "buunduu-preferred-course-v1",
  "buunduu-onboarding-completed-v1",
] as const;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function getKidModeChildId(): string | null {
  if (typeof window === "undefined") return null;
  return safeGet(KID_MODE_STORAGE_KEY);
}

export function getKidModeProfile(): KidModeProfile | null {
  const childUserId = getKidModeChildId();
  if (!childUserId) return null;
  try {
    const raw = safeGet(KID_MODE_PROFILE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<KidModeProfile>) : null;
    if (parsed && parsed.childUserId === childUserId) {
      return {
        childUserId,
        displayName: String(parsed.displayName ?? ""),
        avatar: String(parsed.avatar ?? "🧒"),
      };
    }
  } catch {
    // ignore
  }
  return { childUserId, displayName: "", avatar: "🧒" };
}

export function getRememberedGuardianEmail(): string | null {
  if (typeof window === "undefined") return null;
  return safeGet(GUARDIAN_EMAIL_STORAGE_KEY);
}

/** Хүүхдийн горимын тэмдэглэгээг арилгаж, эцэг эхийн хэл/түвшний тохиргоог сэргээнэ. */
export function clearKidMode(): void {
  if (typeof window === "undefined") return;
  safeSet(KID_MODE_STORAGE_KEY, null);
  safeSet(KID_MODE_PROFILE_STORAGE_KEY, null);
  const raw = safeGet(GUARDIAN_PREFS_STORAGE_KEY);
  if (raw) {
    try {
      const prefs = JSON.parse(raw) as Record<string, string | null>;
      for (const key of GUARDIAN_PREF_KEYS) {
        if (key in prefs) safeSet(key, prefs[key] ?? null);
      }
    } catch {
      // ignore
    }
    safeSet(GUARDIAN_PREFS_STORAGE_KEY, null);
  }
}

function snapshotGuardianPrefs(): void {
  // Аль хэдийн хүүхдийн горимд байгаа бол (хүүхэд солих) эцэг эхийн анхны утгыг дарахгүй
  if (safeGet(GUARDIAN_PREFS_STORAGE_KEY)) return;
  const prefs: Record<string, string | null> = {};
  for (const key of GUARDIAN_PREF_KEYS) prefs[key] = safeGet(key);
  safeSet(GUARDIAN_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * PIN-ээр хүүхдээр нэвтэрнэ: server token буцаана → browser session солино →
 * хүүхдийн горим, onboarding түлхүүрүүдийг тохируулна (шууд /home руу орно).
 */
export async function loginAsKid(
  childUserId: string,
  pin: string
): Promise<KidsClientResult<KidLoginTokens>> {
  if (!supabase) return { data: null, error: "Supabase тохируулагдаагүй." };

  // Эцэг эхийн имэйлийг «Эцэг эх рүү буцах» товчинд урьдчилж бөглөхөөр хадгална
  const { data: sessionData } = await supabase.auth.getSession();
  const guardianEmail = sessionData.session?.user.email ?? null;

  const result = await callKidsApi<KidLoginTokens>("/api/kids/login", {
    body: { childUserId, pin },
  });
  if (!result.data) return result;

  const { error } = await supabase.auth.setSession({
    access_token: result.data.accessToken,
    refresh_token: result.data.refreshToken,
  });
  if (error) return { data: null, error: error.message };

  if (guardianEmail && !isKidEmail(guardianEmail)) {
    safeSet(GUARDIAN_EMAIL_STORAGE_KEY, guardianEmail);
  }
  snapshotGuardianPrefs();
  safeSet(KID_MODE_STORAGE_KEY, result.data.childUserId);
  safeSet(
    KID_MODE_PROFILE_STORAGE_KEY,
    JSON.stringify({
      childUserId: result.data.childUserId,
      displayName: result.data.displayName,
      avatar: result.data.avatar,
    } satisfies KidModeProfile)
  );
  // Onboarding руу чиглүүлэхгүй: хятад хэл, HSK 1
  setLearnerLanguagePreference("zh", "hsk1");
  writeStoredActiveHskLevel(1);
  dismissProgressSyncOffer();

  return result;
}

/** Хүүхдийн горимоос гарна: session хаах → эцэг эхийн нэвтрэх хуудас (имэйл бөглөгдсөн). */
export async function exitKidMode(nextPath = "/family"): Promise<void> {
  if (supabase) {
    try {
      // local: зөвхөн энэ төхөөрөмжийн хүүхдийн session-г хаана
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore — local session is cleared regardless
    }
  }
  clearKidMode();
  window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
}
