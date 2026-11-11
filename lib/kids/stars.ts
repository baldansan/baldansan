/**
 * Хүүхдийн од (⭐), дуусгасан хичээл, наалт.
 * - Утсан дээр: localStorage (хүүхдийн профайл бүрээр; kid mode байхгүй бол "default").
 * - Нэвтэрсэн бол: Supabase `kid_lesson_stars` (089) руу давхар хадгална — утас солиход алдагдахгүй,
 *   эцэг эх тайлангаас харна. Хүснэгт хараахан үүсээгүй бол чимээгүй алгасна.
 */
import { getKidModeChildId } from "@/lib/kids/client";
import { supabase } from "@/lib/supabase/client";

export const KID_STARS_KEY = "buunduu-kid-stars-v1";
export const KID_DONE_KEY = "buunduu-kid-done-v1";
export const KID_STARS_EVENT = "buunduu-kid-stars";

type Store = Record<string, Record<string, number>>; // kidId → lessonId → stars
type DoneStore = Record<string, Record<string, string>>; // kidId → lessonId → ISO date

function kidKey(): string {
  try {
    return getKidModeChildId() ?? "default";
  } catch {
    return "default";
  }
}

function readJson<T extends object>(key: string): T {
  if (typeof window === "undefined") return {} as T;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeJson(key: string, value: object) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(KID_STARS_EVENT));
  } catch {
    /* ignore */
  }
}

const read = () => readJson<Store>(KID_STARS_KEY);
const readDone = () => readJson<DoneStore>(KID_DONE_KEY);

export function getKidStars(kidId = kidKey()): number {
  const s = read()[kidId] ?? {};
  return Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0);
}

export function getKidLessonStars(lessonId: string, kidId = kidKey()): number {
  return read()[kidId]?.[lessonId] ?? 0;
}

export function getKidStarsMap(kidId = kidKey()): Record<string, number> {
  return { ...(read()[kidId] ?? {}) };
}

export function getKidDoneMap(kidId = kidKey()): Record<string, string> {
  return { ...(readDone()[kidId] ?? {}) };
}

export function isKidLessonDone(lessonId: string, kidId = kidKey()): boolean {
  return Boolean(readDone()[kidId]?.[lessonId]);
}

/** Од нэмээд нийт одыг буцаана. */
export function addKidStars(lessonId: string, n: number, kidId = kidKey()): number {
  const store = read();
  const kid = store[kidId] ?? {};
  kid[lessonId] = (kid[lessonId] ?? 0) + n;
  store[kidId] = kid;
  writeJson(KID_STARS_KEY, store);
  void pushKidLesson(lessonId, kidId);
  return getKidStars(kidId);
}

/** Хичээл дуусгасныг тэмдэглэнэ (наалт нээгдэнэ). */
export function markKidLessonDone(lessonId: string, kidId = kidKey()): void {
  const store = readDone();
  const kid = store[kidId] ?? {};
  if (!kid[lessonId]) {
    kid[lessonId] = new Date().toISOString();
    store[kidId] = kid;
    writeJson(KID_DONE_KEY, store);
  }
  void pushKidLesson(lessonId, kidId);
}

/* ───────────── наалт ───────────── */

export const KID_STICKERS = [
  "🐼", "🐯", "🐰", "🐘", "🦁", "🐬", "🦊", "🐨", "🐸", "🦄", "🐙", "🦋", "🐧", "🦉", "🐢", "🦒", "🐳", "🦜", "🐿️", "🦔",
  "🐞", "🦕", "🚀", "🌈", "🎈", "🍉", "🍓", "🏮", "🐉", "🥟", "🎏", "🪁", "🥮", "🧧", "🎋", "⛩️",
] as const;

/** Хичээл бүрт тогтмол нэг наалт (id-аас тооцно). */
export function stickerForLesson(lessonId: string): string {
  let h = 2166136261;
  for (const ch of lessonId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return KID_STICKERS[h % KID_STICKERS.length];
}

/* ───────────── сервер ───────────── */

let tableMissing = false;

async function sessionUserId(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function isMissingTable(message: string | undefined): boolean {
  return /kid_lesson_stars|schema cache|does not exist|PGRST205/i.test(message ?? "");
}

async function pushKidLesson(lessonId: string, kidId: string): Promise<void> {
  if (tableMissing || !supabase) return;
  const userId = await sessionUserId();
  if (!userId) return;
  // Хүүхдийн горимд сесс нь хүүхдийнх; өөр профайлын одыг буруу хэрэглэгч рүү бүү бич.
  if (kidId !== "default" && kidId !== userId) return;
  const stars = read()[kidId]?.[lessonId] ?? 0;
  const completedAt = readDone()[kidId]?.[lessonId] ?? null;
  const row: Record<string, unknown> = { user_id: userId, lesson_id: lessonId, stars, updated_at: new Date().toISOString() };
  if (completedAt) row.completed_at = completedAt;
  const { error } = await supabase.from("kid_lesson_stars").upsert(row, { onConflict: "user_id,lesson_id" });
  if (error && isMissingTable(error.message)) tableMissing = true;
}

/**
 * Серверийн од/дуусгасан хичээлийг утасны хадгалалттай нэгтгэнэ (их утгыг авна),
 * утсанд л байсан мөрийг сервер рүү илгээнэ. Нэгтгэсний дараах нийт одыг буцаана.
 */
export async function syncKidStars(kidId = kidKey()): Promise<number> {
  if (tableMissing || !supabase) return getKidStars(kidId);
  const userId = await sessionUserId();
  if (!userId || (kidId !== "default" && kidId !== userId)) return getKidStars(kidId);
  const { data, error } = await supabase
    .from("kid_lesson_stars")
    .select("lesson_id, stars, completed_at")
    .eq("user_id", userId);
  if (error) {
    if (isMissingTable(error.message)) tableMissing = true;
    return getKidStars(kidId);
  }
  const store = read();
  const done = readDone();
  const kid = store[kidId] ?? {};
  const kidDone = done[kidId] ?? {};
  const remote = new Map<string, { stars: number; completedAt: string | null }>();
  for (const r of (data ?? []) as { lesson_id: string; stars: number; completed_at: string | null }[]) {
    remote.set(r.lesson_id, { stars: Number(r.stars) || 0, completedAt: r.completed_at });
  }
  let changed = false;
  for (const [lessonId, r] of remote) {
    if ((kid[lessonId] ?? 0) < r.stars) {
      kid[lessonId] = r.stars;
      changed = true;
    }
    if (r.completedAt && !kidDone[lessonId]) {
      kidDone[lessonId] = r.completedAt;
      changed = true;
    }
  }
  if (changed) {
    store[kidId] = kid;
    done[kidId] = kidDone;
    writeJson(KID_STARS_KEY, store);
    writeJson(KID_DONE_KEY, done);
  }
  const toPush = new Set<string>();
  for (const lessonId of Object.keys(kid)) {
    const r = remote.get(lessonId);
    if (!r || r.stars < kid[lessonId]) toPush.add(lessonId);
  }
  for (const lessonId of Object.keys(kidDone)) {
    if (!remote.get(lessonId)?.completedAt) toPush.add(lessonId);
  }
  for (const lessonId of toPush) await pushKidLesson(lessonId, kidId);
  return getKidStars(kidId);
}

export type GuardianKidStarRow = {
  childUserId: string;
  lessonId: string;
  stars: number;
  completedAt: string | null;
  updatedAt: string;
};

/** Эцэг эх: өөрийн хүүхдүүдийн од. Хүснэгт/функц байхгүй бол null. */
export async function fetchGuardianKidStars(): Promise<GuardianKidStarRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("guardian_kid_stars");
  if (error || !Array.isArray(data)) return null;
  return (data as { child_user_id: string; lesson_id: string; stars: number; completed_at: string | null; updated_at: string }[]).map(
    (r) => ({
      childUserId: r.child_user_id,
      lessonId: r.lesson_id,
      stars: Number(r.stars) || 0,
      completedAt: r.completed_at,
      updatedAt: r.updated_at,
    })
  );
}
