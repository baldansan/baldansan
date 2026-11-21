import { todayKeyUB } from "@/lib/listen/daily-listening-local";

/**
 * «Өнөөдрийн төлөвлөгөө» — нүүрний өдрийн зам. Алхам бүрийн гүйцэтгэлийг төхөөрөмж дээр
 * өдрөөр нь тэмдэглэнэ (сервер рүү юу ч явуулахгүй).
 *
 * Бүтэн оноо = 1 бүтэн хичээл (lessonFull) + ханзны дэвтэр (hanzi, алгасаж болно)
 * + үг давтах (words) + сонсгол (listen).
 * Шалгалт (check) нь орой, эсвэл маргааш нь өмнөх өдрийн хичээлээр хийгдэнэ.
 */
const KEY = "bs.today-path.v1";

export type TodayStepId = "words" | "lesson" | "listen" | "lessonFull" | "hanzi" | "check";

/** Өмнөх удаа бүтэн дуусгасан хичээл — дараагийн өдөр нь шалгахад хэрэглэнэ. */
export type PrevLessonDay = { day: string; lessonId: string; checked: boolean };

type Stored = {
  day: string;
  done: Partial<Record<TodayStepId, boolean>>;
  /** Өнөөдөр бүтэн дуусгасан хичээл. */
  lessonId?: string | null;
  /** Ханзны дэвтрийг «мэднэ» гээд алгассан. */
  hanziSkipped?: boolean;
  prev?: PrevLessonDay | null;
};

export type TodayPlan = Stored & { prev: PrevLessonDay | null };

function read(): TodayPlan {
  const day = todayKeyUB();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (parsed && parsed.done) {
        if (parsed.day === day) return { ...parsed, prev: parsed.prev ?? null };
        // Өдөр солигдсон: өчигдөр (эсвэл сүүлд) бүтэн дуусгасан хичээлийг шалгалтад үлдээнэ.
        const prev: PrevLessonDay | null =
          parsed.lessonId && parsed.done.lessonFull
            ? { day: parsed.day, lessonId: parsed.lessonId, checked: Boolean(parsed.done.check) }
            : (parsed.prev ?? null);
        return { day, done: {}, lessonId: null, hanziSkipped: false, prev };
      }
    }
  } catch {
    /* ignore */
  }
  return { day, done: {}, lessonId: null, hanziSkipped: false, prev: null };
}

export const TODAY_PATH_EVENT = "bs:today-path";

function write(next: TodayPlan): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(TODAY_PATH_EVENT));
  } catch {
    /* ignore */
  }
}

export function readTodayPathDone(): Partial<Record<TodayStepId, boolean>> {
  if (typeof window === "undefined") return {};
  return read().done;
}

export function readTodayPlan(): TodayPlan {
  if (typeof window === "undefined") {
    return { day: "", done: {}, lessonId: null, hanziSkipped: false, prev: null };
  }
  return read();
}

/** Алхмыг өнөөдөр хийсэн гэж тэмдэглэнэ (хичээлийн үе дуусах, үг давтах, сонсгол дуусах үед дуудна). */
export function markTodayStepDone(step: TodayStepId): void {
  if (typeof window === "undefined") return;
  const cur = read();
  if (cur.done[step]) return;
  cur.done[step] = true;
  write(cur);
}

/** Хичээлийн бүх үе дууслаа — өнөөдрийн «1 бүтэн хичээл». */
export function markTodayLessonFull(lessonId: string): void {
  if (typeof window === "undefined") return;
  const cur = read();
  if (cur.done.lessonFull && cur.lessonId === lessonId) return;
  // Нэг өдөр хоёр хичээл дуусгавал эхнийх нь өдрийн хичээл хэвээр (шалгалт, дэвтэр түүгээр).
  if (!cur.done.lessonFull) cur.lessonId = lessonId;
  cur.done.lesson = true;
  cur.done.lessonFull = true;
  write(cur);
}

/** Ханзны дэвтэр: бичиж дууссан эсвэл «мэднэ» гээд алгассан. */
export function markTodayHanzi(how: "done" | "skipped"): void {
  if (typeof window === "undefined") return;
  const cur = read();
  if (cur.done.hanzi && (how === "skipped" || !cur.hanziSkipped)) return;
  cur.done.hanzi = true;
  cur.hanziSkipped = how === "skipped";
  write(cur);
}

/** Өмнөх өдрийн хичээлийн шалгалтыг өгсөн. */
export function markPrevLessonChecked(): void {
  if (typeof window === "undefined") return;
  const cur = read();
  if (!cur.prev || cur.prev.checked) return;
  cur.prev = { ...cur.prev, checked: true };
  write(cur);
}

/** Улаанбаатарын цаг (0–23) — оройн шалгалт 18 цагаас гарна. */
export function hourUB(): number {
  return new Date(Date.now() + 8 * 3600 * 1000).getUTCHours();
}

export const EVENING_CHECK_HOUR = 18;

/* —— Номын эхлэх хичээл («энэ номыг үзэж байсан, N-р хичээл дээр явна») —— */
const BOOK_START_KEY = "bs:bookStart";

export function readBookStart(bookKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const map = JSON.parse(window.localStorage.getItem(BOOK_START_KEY) || "{}") as Record<string, string>;
    return map[bookKey] ?? null;
  } catch {
    return null;
  }
}

export function writeBookStart(bookKey: string, lessonId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const map = JSON.parse(window.localStorage.getItem(BOOK_START_KEY) || "{}") as Record<string, string>;
    if (lessonId) map[bookKey] = lessonId;
    else delete map[bookKey];
    window.localStorage.setItem(BOOK_START_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}
