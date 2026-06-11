export type SubtitleWord = {
  zh: string;
  pinyin?: string;
  mn?: string;
  key?: boolean;
};

export type VideoRow = {
  id: string;
  youtube_id: string;
  title_zh: string | null;
  title_mn: string | null;
  source: string | null;
  source_url: string | null;
  hsk_level: number | null;
  duration_sec: number | null;
  sync_offset_sec: number;
  tags: string[];
  created_at: string;
};

export type VideoSubtitleRow = {
  id: string;
  video_id: string;
  idx: number;
  start_sec: number;
  end_sec: number;
  zh: string | null;
  pinyin: string | null;
  mn: string | null;
  words: SubtitleWord[] | null;
};

export type SubtitleDisplayMode =
  | "all"
  | "study"
  | "zh"
  | "mn"
  | "off";

export const SUBTITLE_MODE_LABELS: Record<SubtitleDisplayMode, string> = {
  all: "Бүгд",
  study: "Судлах",
  zh: "Хятад",
  mn: "Монгол",
  off: "Унтраах",
};

export const SUBTITLE_MODE_CYCLE: SubtitleDisplayMode[] = [
  "all",
  "study",
  "zh",
  "mn",
  "off",
];
