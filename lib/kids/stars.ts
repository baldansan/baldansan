/** Хүүхдийн од (⭐) — localStorage, хүүхдийн профайл бүрээр (kid mode байхгүй бол "default"). */
import { getKidModeChildId } from "@/lib/kids/client";

export const KID_STARS_KEY = "buunduu-kid-stars-v1";

type Store = Record<string, Record<string, number>>; // kidId → lessonId → stars

function kidKey(): string {
  try {
    return getKidModeChildId() ?? "default";
  } catch {
    return "default";
  }
}

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KID_STARS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    window.localStorage.setItem(KID_STARS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getKidStars(kidId = kidKey()): number {
  const s = read()[kidId] ?? {};
  return Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0);
}

export function getKidLessonStars(lessonId: string, kidId = kidKey()): number {
  return read()[kidId]?.[lessonId] ?? 0;
}

/** Од нэмээд нийт одыг буцаана. */
export function addKidStars(lessonId: string, n: number, kidId = kidKey()): number {
  const store = read();
  const kid = store[kidId] ?? {};
  kid[lessonId] = (kid[lessonId] ?? 0) + n;
  store[kidId] = kid;
  write(store);
  return getKidStars(kidId);
}
