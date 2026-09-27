/**
 * Дуу — цэвэр туслахууд (client + server хоёуланд): бүлэглэх, он/decade шүүлт.
 */
import type { VideoRow } from "@/lib/bichleg/types";

export type SongGroup = {
  seriesId: string;
  titleZh: string | null;
  titleMn: string | null;
  hskLevel: number | null;
  songs: VideoRow[];
};

/** «Он» шүүлтүүрийн бүлэг: 儿歌 | 2000s | 2010s | 2020s */
export type SongDecade = "kids" | "2000s" | "2010s" | "2020s";

export function songDecade(video: Pick<VideoRow, "series_id" | "year">): SongDecade | null {
  if (video.series_id === "songs-kids") return "kids";
  const y = video.year ?? null;
  if (y == null) {
    const sid = video.series_id ?? "";
    if (sid === "songs-2000s") return "2000s";
    if (sid === "songs-2010s") return "2010s";
    if (sid === "songs-2020s") return "2020s";
    return null;
  }
  if (y < 2010) return "2000s";
  if (y < 2020) return "2010s";
  return "2020s";
}

/** Цуврал (songs-*) тус бүрээр бүлэглэнэ; цувралгүй дуу «Бусад» бүлэгт. */
export function groupSongsBySeries(songs: VideoRow[]): SongGroup[] {
  const map = new Map<string, SongGroup>();
  for (const song of songs) {
    const seriesId = song.series_id ?? "songs-other";
    let group = map.get(seriesId);
    if (!group) {
      group = {
        seriesId,
        titleZh: song.series?.title_zh ?? null,
        titleMn: song.series?.title_mn ?? null,
        hskLevel: song.series?.hsk_level ?? null,
        songs: [],
      };
      map.set(seriesId, group);
    }
    group.songs.push(song);
  }
  const order = ["songs-kids", "songs-2020s", "songs-2010s", "songs-2000s"];
  return Array.from(map.values()).sort((a, b) => {
    const ia = order.indexOf(a.seriesId);
    const ib = order.indexOf(b.seriesId);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

