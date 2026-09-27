/**
 * «Бичих дэвтэр» (写字本) — нийтлэг төрлүүд.
 * Локал (localStorage) ба Supabase (migration 067) хоёулаа ижил хэлбэртэй.
 */

export type WritingListKind = "own" | "lesson" | "hsk" | "assignment";

/** Дэвтрийн нэг ханз. */
export type WritingItem = {
  ch: string;
  /** Энэ ханз ямар үгнээс ирсэн бэ (олон ханзтай үг бол), үгүй бол null. */
  word: string | null;
  pinyin: string | null;
  meaning_mn: string | null;
};

export type WritingList = {
  id: string;
  title: string;
  kind: WritingListKind;
  ownerUserId: string | null;
  classroomId: string | null;
  assignmentId: string | null;
  repsTrace: number;
  repsMemory: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  items: WritingItem[];
};

/** Нэг ханзны ахиц (хэрэглэгч × дэвтэр × ханз). */
export type WritingCharProgress = {
  ch: string;
  traceDone: number;
  memoryDone: number;
  mistakes: number;
  completedAt: string | null;
  updatedAt: string;
};

export type WritingProgressMap = Record<string, WritingCharProgress>;

/** Жагсаалтад харуулах товч мэдээлэл (ахицтай нь). */
export type WritingListSummary = Omit<WritingList, "items"> & {
  charsTotal: number;
  charsDone: number;
  cellsTotal: number;
  cellsDone: number;
  percent: number;
};

export type WritingListInput = {
  title: string;
  kind: WritingListKind;
  items: WritingItem[];
  repsTrace: number;
  repsMemory: number;
  classroomId?: string | null;
  assignmentId?: string | null;
  dueDate?: string | null;
};

export type WritingListPatch = Partial<
  Pick<WritingListInput, "title" | "items" | "repsTrace" | "repsMemory" | "dueDate">
> & { assignmentId?: string | null };

export const REPS_TRACE_MIN = 1;
export const REPS_TRACE_MAX = 5;
export const REPS_TRACE_DEFAULT = 2;
export const REPS_MEMORY_MIN = 1;
export const REPS_MEMORY_MAX = 10;
export const REPS_MEMORY_DEFAULT = 3;

export function clampReps(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Дэвтрийн бүх нүд (дагаж + санаж) ба дууссан нүдний тоо. */
export function summarizeProgress(
  list: Pick<WritingList, "items" | "repsTrace" | "repsMemory">,
  progress: WritingProgressMap
): { charsTotal: number; charsDone: number; cellsTotal: number; cellsDone: number; percent: number } {
  const perChar = list.repsTrace + list.repsMemory;
  const charsTotal = list.items.length;
  let charsDone = 0;
  let cellsDone = 0;
  for (const item of list.items) {
    const p = progress[item.ch];
    if (!p) continue;
    const t = Math.min(p.traceDone, list.repsTrace);
    const m = Math.min(p.memoryDone, list.repsMemory);
    cellsDone += t + m;
    if (t >= list.repsTrace && m >= list.repsMemory) charsDone += 1;
  }
  const cellsTotal = charsTotal * perChar;
  return {
    charsTotal,
    charsDone,
    cellsTotal,
    cellsDone,
    percent: cellsTotal > 0 ? Math.round((cellsDone / cellsTotal) * 100) : 0,
  };
}

export function isCharDone(
  list: Pick<WritingList, "repsTrace" | "repsMemory">,
  p: WritingCharProgress | undefined
): boolean {
  if (!p) return false;
  return p.traceDone >= list.repsTrace && p.memoryDone >= list.repsMemory;
}

/** Ханзны даалгаврын lesson_id угтвар (assignments.lesson_id = "writing:<listId>"). */
export const WRITING_ASSIGNMENT_PREFIX = "writing:";

export function writingListIdFromLessonId(lessonId: string | null | undefined): string | null {
  if (!lessonId || !lessonId.startsWith(WRITING_ASSIGNMENT_PREFIX)) return null;
  const id = lessonId.slice(WRITING_ASSIGNMENT_PREFIX.length).trim();
  return id || null;
}

export function defaultListTitle(prefix: string, date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${prefix} ${y}-${m}-${d}`;
}

const HAN_RE = /\p{Script=Han}/u;

export function isHanChar(ch: string): boolean {
  return HAN_RE.test(ch);
}
