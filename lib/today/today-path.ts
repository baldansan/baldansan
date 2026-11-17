import { todayKeyUB } from "@/lib/listen/daily-listening-local";

/**
 * «Өнөөдрийн 3 алхам» — нүүрний өдрийн зам. Алхам бүрийн гүйцэтгэлийг төхөөрөмж дээр
 * өдрөөр нь тэмдэглэнэ (сервер рүү юу ч явуулахгүй).
 */
const KEY = "bs.today-path.v1";

export type TodayStepId = "words" | "lesson" | "listen";
type Stored = { day: string; done: Partial<Record<TodayStepId, boolean>> };

function read(): Stored {
  const day = todayKeyUB();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (parsed && parsed.day === day && parsed.done) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { day, done: {} };
}

export function readTodayPathDone(): Partial<Record<TodayStepId, boolean>> {
  if (typeof window === "undefined") return {};
  return read().done;
}

export const TODAY_PATH_EVENT = "bs:today-path";

/** Алхмыг өнөөдөр хийсэн гэж тэмдэглэнэ (хичээлийн үе дуусах, үг давтах, сонсгол дуусах үед дуудна). */
export function markTodayStepDone(step: TodayStepId): void {
  if (typeof window === "undefined") return;
  try {
    const cur = read();
    if (cur.done[step]) return;
    cur.done[step] = true;
    window.localStorage.setItem(KEY, JSON.stringify(cur));
    window.dispatchEvent(new Event(TODAY_PATH_EVENT));
  } catch {
    /* ignore */
  }
}
