/**
 * Karaoke demo (`/bichleg/song/<id>?demo=1`) — static catalog-оос «两只老虎»
 * (нийтийн өмч, уламжлалт 儿歌) + ЗӨВХӨН demo-д зориулсан зохиомол цаг.
 * Бодит дуунд цаг зохиохгүй — admin LRC-ээр оруулна.
 */
import type { VideoRow, VideoSubtitleRow } from "@/lib/bichleg/types";
import { SONGS } from "@/lib/songs/catalog";

export const DEMO_SONG_ID = "demo-liang-zhi-laohu";

/** Demo мөр бүрийн урт (с) — зохиомол. */
const DEMO_LINE_SEC = 3;

export function buildDemoSong(): {
  video: VideoRow;
  subtitles: VideoSubtitleRow[];
} | null {
  const song = SONGS.find((s) => s.id === "liang-zhi-laohu");
  if (!song?.lyrics?.length) return null;

  const video: VideoRow = {
    id: DEMO_SONG_ID,
    // Demo: YouTube ID зохиомол — тоглуулагч ачаалахгүй байж болно.
    youtube_id: "demo00000000".slice(0, 11),
    title_zh: song.titleZh,
    title_mn: song.noteMn ?? null,
    source: "demo",
    source_url: null,
    hsk_level: song.level ?? null,
    duration_sec: song.lyrics.length * DEMO_LINE_SEC,
    sync_offset_sec: 0,
    subtitle_offset_sec: 0,
    tags: ["song", "demo"],
    series_id: "songs-kids",
    episode_no: null,
    series: {
      id: "songs-kids",
      title_zh: "儿歌",
      title_mn: "Хүүхдийн дуу",
      description_mn: null,
      cover_url: null,
      thumbnail_url: null,
      hsk_level: 1,
    },
    created_at: new Date(0).toISOString(),
    kind: "song",
    artist: null,
    year: song.year,
  };

  const subtitles: VideoSubtitleRow[] = song.lyrics.map((line, i) => ({
    id: `${DEMO_SONG_ID}-${i + 1}`,
    video_id: DEMO_SONG_ID,
    idx: i + 1,
    start_sec: i * DEMO_LINE_SEC,
    end_sec: (i + 1) * DEMO_LINE_SEC,
    speaker: null,
    zh: line.zh,
    pinyin: line.pinyin ?? null,
    mn: line.mn ?? null,
    words: null,
    slang_note: null,
  }));

  return { video, subtitles };
}
