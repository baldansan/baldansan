export type RawBichlegWord = {
  zh?: string;
  pinyin?: string;
  mn?: string;
  key?: boolean;
};

export type RawBichlegSlangNote = {
  term?: string;
  meaning?: string;
  usage?: string;
  register?: string;
};

export type RawBichlegSubtitle = {
  index?: number;
  idx?: number;
  start?: number;
  end?: number;
  start_sec?: number;
  end_sec?: number;
  speaker?: string;
  zh?: string;
  pinyin?: string;
  mn?: string;
  words?: RawBichlegWord[];
  slang_note?: RawBichlegSlangNote;
};

export type RawBichlegVideo = {
  video_id?: string;
  youtube_id?: string;
  title_zh?: string;
  title_mn?: string;
  source?: string;
  source_url?: string;
  hsk_level?: number;
  duration_sec?: number;
  sync_offset_sec?: number;
  tags?: string[];
  series_id?: string;
  episode_no?: number;
  /** 'video' | 'song' — дуу бол pinyin/mn/words заавал биш. */
  kind?: string;
  artist?: string;
  year?: number;
  /** Дуу: `[mm:ss.xx]歌词` мөрүүд — subtitles байхгүй үед эндээс үүсгэнэ. */
  lrc?: string;
  /** LRC-тэй хамт: мөр бүрд нэг пиньинь / монгол мөр. */
  pinyin_lines?: string[];
  mn_lines?: string[];
  subtitles?: RawBichlegSubtitle[];
};

export type RawBichlegSeries = {
  id?: string;
  title_zh?: string;
  title_mn?: string;
  description_mn?: string;
  cover_url?: string;
  hsk_level?: number;
  kind?: string;
};

export type BichlegSubtitleWord = {
  zh: string;
  pinyin: string;
  mn: string;
  key?: boolean;
};

export type BichlegSubtitleSlangNote = {
  term: string;
  meaning: string;
  usage: string;
  register: string;
};

export type BichlegSubtitlePayload = {
  idx: number;
  startSec: number;
  endSec: number;
  speaker: string | null;
  zh: string;
  pinyin: string;
  mn: string;
  words: BichlegSubtitleWord[];
  slangNote: BichlegSubtitleSlangNote | null;
};

export type BichlegVideoPayload = {
  videoId: string;
  youtubeId: string;
  titleZh: string | null;
  titleMn: string;
  source: string | null;
  sourceUrl: string | null;
  hskLevel: number | null;
  durationSec: number | null;
  syncOffsetSec: number;
  tags: string[];
  seriesId: string | null;
  episodeNo: number | null;
  /** 'video' (үндсэн) | 'song' */
  kind: "video" | "song";
  artist: string | null;
  year: number | null;
  subtitles: BichlegSubtitlePayload[];
};

export type BichlegSeriesPayload = {
  id: string;
  titleZh: string | null;
  titleMn: string;
  descriptionMn: string | null;
  coverUrl: string | null;
  hskLevel: number | null;
  kind?: "video" | "song";
};

export type BichlegFileKind = "video" | "series";

export type BichlegFileValidation = {
  fileName: string;
  kind: BichlegFileKind;
  ok: boolean;
  errors: string[];
  preview?: {
    videoId?: string;
    titleMn?: string;
    subtitleCount?: number;
    youtubeId?: string;
    seriesId?: string;
    episodeNo?: number | null;
    seriesTitleMn?: string;
  };
  payload?: BichlegVideoPayload;
  seriesPayload?: BichlegSeriesPayload;
};

export type BichlegImportFileResult = {
  fileName: string;
  ok: boolean;
  videoId?: string;
  seriesId?: string;
  subtitleCount?: number;
  message?: string;
  errors?: string[];
};

export type BichlegImportApiBody = {
  series?: BichlegSeriesPayload[];
  packages?: BichlegVideoPayload[];
  fileNames?: string[];
};

export type BichlegImportApiResult = {
  ok: boolean;
  results: BichlegImportFileResult[];
  errors?: string[];
};
