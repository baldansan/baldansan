export type SubtitleWord = {
  zh: string;
  pinyin?: string;
  mn?: string;
  key?: boolean;
};

export type SubtitleSlangNote = {
  term: string;
  meaning: string;
  usage: string;
  register: string;
};

export type VideoSeriesInfo = {
  id: string;
  title_zh: string | null;
  title_mn: string | null;
  description_mn: string | null;
  cover_url: string | null;
  hsk_level: number | null;
};

export type VideoSeriesCard = VideoSeriesInfo & {
  videoCount: number;
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
  series_id: string | null;
  episode_no: number | null;
  series: VideoSeriesInfo | null;
  created_at: string;
};

export type VideoEpisodeItem = VideoRow & {
  subtitleCount: number;
};

export type VideoSubtitleRow = {
  id: string;
  video_id: string;
  idx: number;
  start_sec: number;
  end_sec: number;
  speaker: string | null;
  zh: string | null;
  pinyin: string | null;
  mn: string | null;
  words: SubtitleWord[] | null;
  slang_note: SubtitleSlangNote | null;
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

export function formatEpisodeLabel(episodeNo: number | null): string | null {
  if (episodeNo == null || !Number.isFinite(episodeNo)) return null;
  return `${episodeNo}-р анги`;
}

export type UserVideoProgress = {
  video_id: string;
  watched_sec: number;
  completed: boolean;
  last_watched_at: string;
};

export type SeriesWatchProgress = {
  watchedCount: number;
  totalCount: number;
};

export type BichlegContinueTarget = {
  href: string;
  title: string;
  subtitle: string;
};

export function formatSeriesEpisodeBadge(
  seriesTitleMn: string | null,
  episodeNo: number | null,
  options?: { completed?: boolean }
): string | null {
  const ep = formatEpisodeLabel(episodeNo);
  if (!seriesTitleMn && !ep) return null;
  let label: string;
  if (seriesTitleMn && ep) label = `${seriesTitleMn} · ${ep}`;
  else label = seriesTitleMn ?? ep ?? "";
  if (options?.completed) label = `${label} ✓`;
  return label;
}
