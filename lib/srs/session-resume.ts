/**
 * Цээжлэх session-ий "дундаас нь үргэлжлүүлэх" бичлэг.
 * localStorage-д багц бүрээр (resumeKey) хадгална.
 */

const PREFIX = "buunduu-srs-resume-v1";

export type SessionResumeRecord = {
  /** Багцын үгсийн ID-гийн гарын үсэг — багц өөрчлөгдвөл хүчингүй. */
  sig: string;
  /** Дараагийн харах картын индекс. */
  index: number;
  /** Энэ session-д үнэлсэн тоо (progress bar сэргээхэд). */
  done: number;
  savedAt: number;
};

function storageKey(resumeKey: string): string {
  return `${PREFIX}:${resumeKey}`;
}

export function queueSignature(ids: (number | null | undefined)[]): string {
  return ids.map((id) => id ?? "x").join(",");
}

export function readSessionResume(
  resumeKey: string
): SessionResumeRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(resumeKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionResumeRecord;
    if (
      typeof parsed?.index !== "number" ||
      typeof parsed?.sig !== "string" ||
      parsed.index <= 0
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionResume(
  resumeKey: string,
  record: Omit<SessionResumeRecord, "savedAt">
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(resumeKey),
      JSON.stringify({ ...record, savedAt: Date.now() })
    );
  } catch {
    // quota — resume бол nice-to-have
  }
}

export function clearSessionResume(resumeKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(resumeKey));
  } catch {
    // ignore
  }
}

/** Багцад хагас дутуу гарсан session байгаа эсэх (зураглал дээр тэмдэглэхэд). */
export function hasSessionResume(resumeKey: string): boolean {
  return readSessionResume(resumeKey) !== null;
}
