import type { SubtitleSlangNote, SubtitleWord, VideoSubtitleRow } from "@/lib/bichleg/types";

export function mapSlangNote(raw: unknown): SubtitleSlangNote | null {
  if (!raw || typeof raw !== "object") return null;
  const note = raw as Record<string, unknown>;
  const term = String(note.term ?? "").trim();
  const meaning = String(note.meaning ?? "").trim();
  const usage = String(note.usage ?? "").trim();
  const register = String(note.register ?? "").trim();

  if (!term && !meaning && !usage && !register) return null;

  return {
    term,
    meaning,
    usage,
    register,
  };
}

export function mapVideoSubtitleRow(raw: Record<string, unknown>): VideoSubtitleRow {
  let words: SubtitleWord[] | null = null;
  if (raw.words != null && Array.isArray(raw.words)) {
    words = raw.words.map((w) => {
      const word = w as Record<string, unknown>;
      return {
        zh: String(word.zh ?? ""),
        pinyin: word.pinyin ? String(word.pinyin) : undefined,
        mn: word.mn ? String(word.mn) : undefined,
        key: Boolean(word.key),
      };
    });
  }

  return {
    id: String(raw.id),
    video_id: String(raw.video_id),
    idx: Number(raw.idx),
    start_sec: Number(raw.start_sec),
    end_sec: Number(raw.end_sec),
    speaker: raw.speaker ? String(raw.speaker) : null,
    zh: raw.zh ? String(raw.zh) : null,
    pinyin: raw.pinyin ? String(raw.pinyin) : null,
    mn: raw.mn ? String(raw.mn) : null,
    words,
    slang_note: mapSlangNote(raw.slang_note),
  };
}
