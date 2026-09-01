import type { TimedSubtitle } from "@/types/lesson";
import type { HskPackageTextSentence } from "@/types/hsk-lesson-package";

/**
 * 课文 audio ↔ sentence sync from subtitle_lines rows.
 *
 * subtitles.json rows carry start/end ("mm:ss", "mm:ss.t", "h:mm:ss" or plain
 * seconds) plus the sentence's chinese text. Sentences are matched to subtitle
 * rows by chinese text, so one flat subtitle list serves every 课文 in the
 * lesson without needing a per-audio mapping.
 */

/** "mm:ss", "mm:ss.t", "h:mm:ss(.t)" or plain seconds → seconds (null if unparseable). */
export function parseSubtitleTimeToSeconds(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;

  if (/^\d+(\.\d+)?$/.test(text)) {
    return Number(text);
  }

  const parts = text.split(":").map((part) => part.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((part) => part === "" || !/^\d+(\.\d+)?$/.test(part))) {
    return null;
  }

  const numbers = parts.map(Number);
  if (numbers.length === 2) {
    return numbers[0] * 60 + numbers[1];
  }
  return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
}

/** Normalize chinese text for matching: drop whitespace + common punctuation. */
function normalizeZhForMatch(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(/[，。！？；：、“”‘’「」『』（）,.!?;:'"()【】…·—–-]/g, "");
}

export type SentenceTimeWindow = {
  start: number;
  end: number;
};

/**
 * Per-sentence time windows for one 课文.
 * Returns null when fewer than 2 sentences match subtitle rows (not enough
 * signal to run highlight sync — the reader then behaves as before).
 */
export function buildSentenceTimeWindows(
  sentences: HskPackageTextSentence[],
  timedSubtitles: TimedSubtitle[]
): Array<SentenceTimeWindow | null> | null {
  if (sentences.length === 0 || timedSubtitles.length === 0) return null;

  const byZh = new Map<string, SentenceTimeWindow>();
  for (const row of timedSubtitles) {
    const start = parseSubtitleTimeToSeconds(row.start);
    const end = parseSubtitleTimeToSeconds(row.end);
    if (start == null || end == null || end < start) continue;
    const key = normalizeZhForMatch(row.chinese);
    if (!key || byZh.has(key)) continue;
    byZh.set(key, { start, end });
  }
  if (byZh.size === 0) return null;

  const windows = sentences.map(
    (sentence) => byZh.get(normalizeZhForMatch(sentence.zh)) ?? null
  );

  const matched = windows.filter(Boolean).length;
  if (matched < Math.min(2, sentences.length)) return null;
  return windows;
}

/**
 * Active sentence for the current playback time.
 * Falls back to the previous matched window when the time sits in a gap,
 * so the highlight doesn't flicker off between sentences.
 */
export function findActiveSentenceIndex(
  windows: Array<SentenceTimeWindow | null>,
  currentTime: number
): number | null {
  let lastStarted: number | null = null;
  for (let i = 0; i < windows.length; i += 1) {
    const window = windows[i];
    if (!window) continue;
    if (currentTime >= window.start && currentTime < window.end) {
      return i;
    }
    if (currentTime >= window.start) {
      lastStarted = i;
    }
  }
  return lastStarted;
}
