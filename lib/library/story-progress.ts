/**
 * Зурагт номын уншлагын ахиц (localStorage, төхөөрөмж дотор).
 * - buunduu-story-progress-v1: { [storyId]: хадгалсан хуудас } — «үргэлжлүүлэх»-д
 * - buunduu-story-finished-v1: { [storyId]: дууссан цаг (ms) } — «уншиж дууссан» тэмдэг
 *   (уншигч дуусахад хуудсыг 0 болгодог тул тусдаа тэмдэг хэрэгтэй).
 */
export const STORY_PROGRESS_KEY = "buunduu-story-progress-v1";
export const STORY_FINISHED_KEY = "buunduu-story-finished-v1";

export function readStoryPage(id: string): number {
  try {
    const raw = localStorage.getItem(STORY_PROGRESS_KEY);
    if (!raw) return 0;
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const n = obj[id];
    return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function writeStoryPage(id: string, page: number): void {
  try {
    const raw = localStorage.getItem(STORY_PROGRESS_KEY);
    const obj = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    obj[id] = page;
    localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

export function markStoryFinished(id: string): void {
  try {
    const raw = localStorage.getItem(STORY_FINISHED_KEY);
    const obj = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    obj[id] = Date.now();
    localStorage.setItem(STORY_FINISHED_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

export function readStoryFinished(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORY_FINISHED_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) if (typeof v === "number") out[k] = v;
    return out;
  } catch {
    return {};
  }
}
