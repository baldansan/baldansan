/**
 * «Хүүхдийн 7 хоног» (儿童七天) — 6 настай эхлэгчийн эхний долоо хоногийн зам.
 * 7 өдөр × 4–5 даалгавар (өдөрт 10–15 минут). Төлөвлөгөө тогтмол (static),
 * ахиц localStorage["buunduu-kid-path-v1"] дотор хүүхдийн id-гаар хадгалагдана.
 *
 * Сервер, клиент хоёуланд импортлогдоно — window-г зөвхөн функц дотор хэрэглэнэ.
 */
import { PINYIN_COURSE_STORAGE_KEY, getCourseUnit, type CourseProgress } from "@/lib/pronunciation/pinyin-course";
import { DAILY_TONE_STORAGE_KEY, dayKey, type DailyToneStore } from "@/lib/pronunciation/daily-tone";
import { LEVEL_STORAGE_KEY, type AllLevelProgress } from "@/lib/games/levels";
import { STORY_FINISHED_KEY, STORY_PROGRESS_KEY } from "@/lib/library/story-progress";
import { isCharDone, type WritingList, type WritingProgressMap } from "@/lib/writing/types";

export const KID_PATH_STORAGE_KEY = "buunduu-kid-path-v1";
export const KID_PATH_DAYS = 7;

/** Хүүхдийн 14 ханз — бичих дэвтрийн нэг жагсаалт */
export const KID_PATH_CHARS = ["一", "二", "三", "十", "人", "口", "大", "小", "上", "下", "日", "月", "山", "水"] as const;
export const KID_PATH_WRITING_TITLE = "Хүүхдийн 14 ханз";
export const KID_PATH_WRITING_REPS = { trace: 1, memory: 2 } as const;

/** Өдөр бүрийн наалт */
export const DAY_STICKERS = ["🐼", "🐯", "🐰", "🐘", "🦁", "🐬", "🏅"] as const;

/** 三字经 — өдөр бүрийн мөр (1-ээс эхлэн, хоёр тал орно). Мөрийн id: sanzijing-001…020 */
export const SANZIJING_DAY_LINES: Record<number, [number, number]> = {
  2: [1, 3],
  3: [4, 6],
  4: [7, 9],
  5: [10, 12],
  6: [13, 16],
  7: [17, 20],
};
export const SANZIJING_TOTAL_LINES = 20;

export function sanzijingLineId(n: number): string {
  return `sanzijing-${String(n).padStart(3, "0")}`;
}

export type KidTaskKind = "pinyin" | "book" | "sanzijing" | "write" | "game" | "song" | "daily" | "medal";

/** autoDone шалгах контекст — бусад модулиудын localStorage ахиц */
export type KidPathAutoCtx = {
  pinyin: CourseProgress;
  /** story id → хадгалсан хуудас */
  storyPage: Record<string, number>;
  /** story id → дууссан цаг (ms) */
  storyFinished: Record<string, number>;
  writingList: WritingList | null;
  writingProgress: WritingProgressMap;
  levels: AllLevelProgress;
  daily: Pick<DailyToneStore, "history">;
  path: KidPathState;
};

export type KidTask = {
  id: string;
  kind: KidTaskKind;
  emoji: string;
  title: string;
  titleZh: string;
  /** Контент (ном, ханз) — translate="no" */
  detail?: string;
  /** Хятад UI-д өөр харагдах бол (ж: «Үе 1» → «第 1 关») */
  detailZh?: string;
  href: string;
  minutes: number;
  /** Бичих даалгаврын ханзууд — href-ийг дэвтрийн id-гаар бүрдүүлнэ */
  chars?: string[];
  autoDone?: (ctx: KidPathAutoCtx) => boolean;
};

export type KidDay = {
  day: number;
  title: string;
  titleZh: string;
  sticker: string;
  tasks: KidTask[];
};

/* --------------------------------------------------------------------------
 * autoDone туслахууд
 * ----------------------------------------------------------------------- */

function pinyinListened(unitId: string) {
  return (ctx: KidPathAutoCtx): boolean => {
    const unit = getCourseUnit(unitId);
    const p = ctx.pinyin[unitId];
    if (!unit || !p) return false;
    return p.listened.length >= unit.items.length;
  };
}

function pinyinTested(unitId: string) {
  return (ctx: KidPathAutoCtx): boolean => ctx.pinyin[unitId]?.testScore != null;
}

function bookRead(storyId: string, pageCount: number) {
  return (ctx: KidPathAutoCtx): boolean =>
    ctx.storyFinished[storyId] != null || (ctx.storyPage[storyId] ?? 0) >= pageCount;
}

function charsWritten(chars: string[]) {
  return (ctx: KidPathAutoCtx): boolean => {
    const list = ctx.writingList;
    if (!list) return false;
    return chars.every((ch) => isCharDone(list, ctx.writingProgress[ch]));
  };
}

function gameStars(game: "match" | "arrange", level: number) {
  return (ctx: KidPathAutoCtx): boolean => (ctx.levels[game]?.[String(level)]?.stars ?? 0) >= 1;
}

function dailyToday(ctx: KidPathAutoCtx): boolean {
  return ctx.daily.history[dayKey()] != null;
}

/** 6-р өдөр: дуртай номоо дахин унш — 5-р өдрийн наалтаас хойш аль нэг ном дуусгасан бол */
function anyBookReread(ctx: KidPathAutoCtx): boolean {
  const since = ctx.path.days[5]?.stickerAt ?? ctx.path.startedAt ?? 0;
  return KID_PATH_BOOKS.some((b) => (ctx.storyFinished[b.id] ?? 0) > since);
}

/* --------------------------------------------------------------------------
 * Даалгавар үүсгэгчид
 * ----------------------------------------------------------------------- */

export const KID_PATH_BOOKS = [
  { id: "gsb-zh-0008", title: "你在做什么？", pages: 8 },
  { id: "gsb-zh-0302", title: "火", pages: 8 },
  { id: "gsb-zh-0156", title: "很饿的鳄鱼", pages: 5 },
  { id: "gsb-zh-0087", title: "我喜欢看书", pages: 8 },
  { id: "gsb-zh-0327", title: "数数动物", pages: 8 },
] as const;

const PINYIN_UNIT_LABEL: Record<string, { mn: string; zh: string }> = {
  "dan-egshig": { mn: "a o e i u ü", zh: "a o e i u ü" },
  "b-p-m-f": { mn: "b p m f", zh: "b p m f" },
  "d-t-n-l": { mn: "d t n l", zh: "d t n l" },
};

function pinyinListen(day: number, unitId: string): KidTask {
  return {
    id: `d${day}-pinyin`,
    kind: "pinyin",
    emoji: "🔤",
    title: "Сонсоод дага",
    titleZh: "听一听，跟着说",
    detail: PINYIN_UNIT_LABEL[unitId]?.mn ?? unitId,
    href: `/pronunciation/basics/${unitId}`,
    minutes: 3,
    autoDone: pinyinListened(unitId),
  };
}

function pinyinTest(day: number, unitId: string): KidTask {
  return {
    id: `d${day}-pinyin`,
    kind: "pinyin",
    emoji: "🔤",
    title: "Дасгал, шалгалт",
    titleZh: "练习和小测",
    detail: PINYIN_UNIT_LABEL[unitId]?.mn ?? unitId,
    href: `/pronunciation/basics/${unitId}`,
    minutes: 4,
    autoDone: pinyinTested(unitId),
  };
}

function book(day: number, storyId: (typeof KID_PATH_BOOKS)[number]["id"]): KidTask {
  const b = KID_PATH_BOOKS.find((x) => x.id === storyId)!;
  return {
    id: `d${day}-book`,
    kind: "book",
    emoji: "📖",
    title: "Ном унших",
    titleZh: "读绘本",
    detail: b.title,
    href: `/library/books/${b.id}`,
    minutes: 4,
    autoDone: bookRead(b.id, b.pages),
  };
}

function sanzijing(day: number): KidTask {
  const [from, to] = SANZIJING_DAY_LINES[day] ?? [1, 1];
  return {
    id: `d${day}-sanzijing`,
    kind: "sanzijing",
    emoji: "📜",
    title: "三字经 унших",
    titleZh: "读三字经",
    detail: day === 7 ? `${from}–${to} · 1–${SANZIJING_TOTAL_LINES}` : `${from}–${to}`,
    href: `/kids/path/sanzijing/${day}`,
    minutes: 3,
  };
}

function write(day: number, chars: string[]): KidTask {
  return {
    id: `d${day}-write`,
    kind: "write",
    emoji: "✍️",
    title: "Ханз бичих",
    titleZh: "写汉字",
    detail: chars.join(" "),
    href: "/writing",
    minutes: 4,
    chars,
    autoDone: charsWritten(chars),
  };
}

function game(day: number, kind: "match" | "arrange", level: number): KidTask {
  return {
    id: `d${day}-game`,
    kind: "game",
    emoji: "🎮",
    title: kind === "match" ? "Тоглоом: Холбох" : "Тоглоом: Эрэмбэлэх",
    titleZh: kind === "match" ? "游戏：连连看" : "游戏：排一排",
    detail: `Үе ${level}`,
    detailZh: `第 ${level} 关`,
    href: `/games/${kind}?level=${level}`,
    minutes: 3,
    autoDone: gameStars(kind, level),
  };
}

/* --------------------------------------------------------------------------
 * Төлөвлөгөө
 * ----------------------------------------------------------------------- */

export const KID_PATH: KidDay[] = [
  {
    day: 1,
    title: "Сайн уу!",
    titleZh: "你好！",
    sticker: DAY_STICKERS[0],
    tasks: [pinyinListen(1, "dan-egshig"), book(1, "gsb-zh-0008"), write(1, ["一", "二", "三"]), game(1, "match", 1)],
  },
  {
    day: 2,
    title: "Гал",
    titleZh: "火",
    sticker: DAY_STICKERS[1],
    tasks: [pinyinTest(2, "dan-egshig"), book(2, "gsb-zh-0302"), sanzijing(2), write(2, ["十", "人", "口"])],
  },
  {
    day: 3,
    title: "Матар",
    titleZh: "鳄鱼",
    sticker: DAY_STICKERS[2],
    tasks: [pinyinListen(3, "b-p-m-f"), book(3, "gsb-zh-0156"), sanzijing(3), write(3, ["大", "小"])],
  },
  {
    day: 4,
    title: "Ном",
    titleZh: "书",
    sticker: DAY_STICKERS[3],
    tasks: [pinyinTest(4, "b-p-m-f"), book(4, "gsb-zh-0087"), sanzijing(4), game(4, "arrange", 1)],
  },
  {
    day: 5,
    title: "Амьтад",
    titleZh: "动物",
    sticker: DAY_STICKERS[4],
    tasks: [pinyinListen(5, "d-t-n-l"), book(5, "gsb-zh-0327"), sanzijing(5), write(5, ["上", "下"])],
  },
  {
    day: 6,
    title: "Давтлага",
    titleZh: "复习",
    sticker: DAY_STICKERS[5],
    tasks: [
      pinyinTest(6, "d-t-n-l"),
      {
        id: "d6-book",
        kind: "book",
        emoji: "📖",
        title: "Дуртай номоо дахин унш",
        titleZh: "再读一遍最喜欢的书",
        href: "/library/books?level=1&audio=1",
        minutes: 4,
        autoDone: anyBookReread,
      },
      sanzijing(6),
      write(6, ["日", "月"]),
    ],
  },
  {
    day: 7,
    title: "Баяр!",
    titleZh: "庆祝！",
    sticker: DAY_STICKERS[6],
    tasks: [
      {
        id: "d7-daily",
        kind: "daily",
        emoji: "🔥",
        title: "Өдрийн аялгуу",
        titleZh: "每日声调",
        href: "/pronunciation/daily",
        minutes: 3,
        autoDone: dailyToday,
      },
      sanzijing(7),
      write(7, ["山", "水"]),
      game(7, "match", 2),
      {
        id: "d7-medal",
        kind: "medal",
        emoji: "🏅",
        title: "Медаль",
        titleZh: "奖章",
        href: "/kids/path?medal=1",
        minutes: 1,
        // Бусад 4 даалгавар (гараар ✓ эсвэл автоматаар) дууссан бол медаль авна
        autoDone: (ctx) => {
          const d = getKidDay(7);
          if (!d) return false;
          return d.tasks.filter((t) => t.kind !== "medal").every((t) => isKidTaskDone(t, 7, ctx));
        },
      },
    ],
  },
];

export const KID_PATH_TOTAL_TASKS = KID_PATH.reduce((n, d) => n + d.tasks.length, 0);

export function getKidDay(day: number): KidDay | undefined {
  return KID_PATH.find((d) => d.day === day);
}

/* --------------------------------------------------------------------------
 * Ахиц — localStorage["buunduu-kid-path-v1"]
 * ----------------------------------------------------------------------- */

export type KidDayState = { tasks: Record<string, true>; stickerAt?: number };
export type KidPathState = {
  startedAt: number;
  days: Record<number, KidDayState | undefined>;
  writingListId?: string;
};
export type KidPathStore = Record<string, KidPathState | undefined>;

export const KID_PATH_EVENT = "buunduu-kid-path";

export function readKidPathStore(): KidPathStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KID_PATH_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as KidPathStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeKidPathStore(store: KidPathStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KID_PATH_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota — үл тоох
  }
  try {
    window.dispatchEvent(new Event(KID_PATH_EVENT));
  } catch {
    // ignore
  }
}

export function emptyKidPathState(): KidPathState {
  return { startedAt: 0, days: {} };
}

export function getKidPathState(kidId: string): KidPathState {
  return readKidPathStore()[kidId] ?? emptyKidPathState();
}

export function updateKidPathState(kidId: string, patch: (prev: KidPathState) => KidPathState): KidPathState {
  const store = readKidPathStore();
  const prev = store[kidId] ?? emptyKidPathState();
  const next = patch(prev);
  if (next === prev && store[kidId]) return next;
  store[kidId] = next;
  writeKidPathStore(store);
  return next;
}

/** Замыг эхлүүлнэ (startedAt тавина) — аль хэдийн эхэлсэн бол хэвээр. */
export function ensureKidPathStarted(kidId: string): KidPathState {
  return updateKidPathState(kidId, (prev) => (prev.startedAt ? prev : { ...prev, startedAt: Date.now() }));
}

export function setKidTaskDone(kidId: string, day: number, taskId: string, done: boolean): KidPathState {
  return updateKidPathState(kidId, (prev) => {
    const d: KidDayState = { tasks: { ...(prev.days[day]?.tasks ?? {}) }, stickerAt: prev.days[day]?.stickerAt };
    if (done) d.tasks[taskId] = true;
    else delete d.tasks[taskId];
    return { ...prev, startedAt: prev.startedAt || Date.now(), days: { ...prev.days, [day]: d } };
  });
}

export function setKidDaySticker(kidId: string, day: number): KidPathState {
  return updateKidPathState(kidId, (prev) => {
    const cur = prev.days[day] ?? { tasks: {} };
    if (cur.stickerAt) return prev;
    return { ...prev, days: { ...prev.days, [day]: { ...cur, stickerAt: Date.now() } } };
  });
}

export function setKidWritingListId(kidId: string, listId: string): KidPathState {
  return updateKidPathState(kidId, (prev) => ({ ...prev, startedAt: prev.startedAt || Date.now(), writingListId: listId }));
}

/* --------------------------------------------------------------------------
 * Тооцоо: даалгавар/өдөр дууссан эсэх (гараар ✓ ∪ autoDone)
 * ----------------------------------------------------------------------- */

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/** Бусад модулиудын ахицыг localStorage-оос уншиж autoDone контекст бүрдүүлнэ. */
export function buildKidPathAutoCtx(
  path: KidPathState,
  writing: { list: WritingList | null; progress: WritingProgressMap }
): KidPathAutoCtx {
  const storyRaw = readJson<Record<string, unknown>>(STORY_PROGRESS_KEY, {});
  const storyPage: Record<string, number> = {};
  for (const [k, v] of Object.entries(storyRaw)) if (typeof v === "number") storyPage[k] = v;
  const finishedRaw = readJson<Record<string, unknown>>(STORY_FINISHED_KEY, {});
  const storyFinished: Record<string, number> = {};
  for (const [k, v] of Object.entries(finishedRaw)) if (typeof v === "number") storyFinished[k] = v;
  const daily = readJson<Partial<DailyToneStore>>(DAILY_TONE_STORAGE_KEY, {});
  return {
    pinyin: readJson<CourseProgress>(PINYIN_COURSE_STORAGE_KEY, {}),
    storyPage,
    storyFinished,
    writingList: writing.list,
    writingProgress: writing.progress,
    levels: readJson<AllLevelProgress>(LEVEL_STORAGE_KEY, {}),
    daily: { history: daily.history && typeof daily.history === "object" ? daily.history : {} },
    path,
  };
}

export function isKidTaskDone(task: KidTask, day: number, ctx: KidPathAutoCtx): boolean {
  if (ctx.path.days[day]?.tasks[task.id]) return true;
  try {
    return task.autoDone ? task.autoDone(ctx) : false;
  } catch {
    return false;
  }
}

export type KidDayStatus = { day: number; done: number; total: number; complete: boolean; tasks: Record<string, boolean> };

export function kidDayStatus(dayDef: KidDay, ctx: KidPathAutoCtx): KidDayStatus {
  const tasks: Record<string, boolean> = {};
  let done = 0;
  for (const t of dayDef.tasks) {
    const ok = isKidTaskDone(t, dayDef.day, ctx);
    tasks[t.id] = ok;
    if (ok) done += 1;
  }
  return { day: dayDef.day, done, total: dayDef.tasks.length, complete: done === dayDef.tasks.length, tasks };
}

export type KidPathSummary = {
  started: boolean;
  /** Өнөөдрийн өдөр = эхний дуусаагүй өдөр (бүгд дууссан бол 7) */
  currentDay: number;
  currentDone: number;
  currentTotal: number;
  doneTasks: number;
  totalTasks: number;
  allComplete: boolean;
  days: KidDayStatus[];
};

export function kidPathSummary(ctx: KidPathAutoCtx): KidPathSummary {
  const days = KID_PATH.map((d) => kidDayStatus(d, ctx));
  const firstOpen = days.find((d) => !d.complete);
  const current = firstOpen ?? days[days.length - 1];
  return {
    started: ctx.path.startedAt > 0,
    currentDay: current.day,
    currentDone: current.done,
    currentTotal: current.total,
    doneTasks: days.reduce((n, d) => n + d.done, 0),
    totalTasks: KID_PATH_TOTAL_TASKS,
    allComplete: days.every((d) => d.complete),
    days,
  };
}

/** Даалгаврын бодит холбоос (бичих даалгавар → дэвтрийн id + эхлэх ханз). */
export function kidTaskHref(task: KidTask, writingListId: string | undefined): string {
  if (task.kind === "write" && writingListId) {
    const start = task.chars?.[0];
    return `/writing/${writingListId}/practice${start ? `?start=${encodeURIComponent(start)}` : ""}`;
  }
  return task.href;
}
