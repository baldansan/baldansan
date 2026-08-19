import type { HskQuizKind } from "@/lib/games/hsk-quiz-builders";

const VALID_KINDS: HskQuizKind[] = [
  "meaning",
  "word-recall",
  "pinyin",
  "example-cloze",
  "radical-pick",
  "listening",
];

export function parseQuizTypesParam(raw: string | null): HskQuizKind[] | null {
  if (!raw?.trim()) return null;
  const parsed = raw
    .split(",")
    .map((s) => s.trim())
    .filter((k): k is HskQuizKind =>
      (VALID_KINDS as string[]).includes(k)
    );
  return parsed.length > 0 ? [...new Set(parsed)] : null;
}

/** Хуучин standalone route → vocab quiz preset. */
export const LEGACY_GAME_TYPE_PRESETS: Record<string, HskQuizKind[]> = {
  meaning: ["meaning"],
  "word-recall": ["word-recall"],
  pinyin: ["pinyin"],
  "example-cloze": ["example-cloze"],
  "radical-pick": ["radical-pick"],
  listening: ["listening"],
};

export function presetTitleForKinds(kinds: HskQuizKind[] | null): string | null {
  if (!kinds || kinds.length !== 1) return null;
  const titles: Record<HskQuizKind, string> = {
    meaning: "Утга сонгох",
    "word-recall": "Үг сорих",
    pinyin: "Пиньинь сонгох",
    "example-cloze": "Жишээ бөглөх",
    "radical-pick": "Радикал таних",
    listening: "Сонсоод олох",
  };
  return titles[kinds[0]];
}
