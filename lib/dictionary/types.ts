/** Толь бичиг v2 — hsk_words дээрх баялаг утга давхаргын төрлүүд (DB ↔ UI). */

export type DictStatus = "draft" | "reviewed" | "approved" | "rejected";

export const DICT_STATUS_LABEL: Record<DictStatus, string> = {
  draft: "Ноорог",
  reviewed: "Хянасан",
  approved: "Батлагдсан",
  rejected: "Буцаасан",
};

export type DictCollocation = { zh: string; pinyin?: string | null; mn: string };

export type DictExample = {
  id?: number;
  zh: string;
  pinyin: string | null;
  mn: string;
};

export type DictSense = {
  id?: number;
  sense_no: number;
  pos: string | null;
  gloss_zh: string | null;
  meaning_mn: string;
  synonyms_mn: string[];
  meaning_en: string | null;
  note_mn: string | null;
  examples: DictExample[];
};

export type DictEntry = {
  word_id: number;
  status: DictStatus;
  usage_note_mn: string | null;
  measure_words: string[];
  collocations: DictCollocation[];
  confusable_with: string[];
  register: string | null;
  source: string;
  reviewed_at: string | null;
};

export type DictWordHead = {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  pos: string[] | null;
  hsk_level: string;
  frequency: number | null;
  meaning_en: string | null;
  meaning_mn: string | null;
  example_zh: string | null;
  example_mn: string | null;
};

export type DictWordFull = {
  word: DictWordHead;
  entry: DictEntry | null;
  senses: DictSense[];
};

/** Admin save payload (POST /api/admin/dictionary/save). */
export type DictSavePayload = {
  wordId: number;
  status: DictStatus;
  entry: Omit<DictEntry, "word_id" | "status" | "source" | "reviewed_at">;
  senses: Omit<DictSense, "id">[];
};

export const POS_OPTIONS: { v: string; mn: string }[] = [
  { v: "n", mn: "нэр үг" },
  { v: "v", mn: "үйл үг" },
  { v: "a", mn: "тэмдэг нэр" },
  { v: "d", mn: "дайвар үг" },
  { v: "prep", mn: "угтвар үг" },
  { v: "conj", mn: "холбоос" },
  { v: "m", mn: "тооны нэр" },
  { v: "u", mn: "туслах үг" },
  { v: "pron", mn: "төлөөний үг" },
  { v: "num", mn: "тоо" },
  { v: "int", mn: "аялга" },
  { v: "phr", mn: "хэллэг" },
];
