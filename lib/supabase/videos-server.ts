import { normalizeSeriesCoverUrl } from "@/lib/bichleg/series-cover";
import { mapVideoSubtitleRow } from "@/lib/bichleg/map-subtitle";
import type {
  VideoEpisodeItem,
  VideoRow,
  VideoSeriesCard,
  VideoSeriesInfo,
  VideoSubtitleRow,
} from "@/lib/bichleg/types";
import {
  createAnonServerSupabaseClient,
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { CATALOG_REVALIDATE_SECONDS, CATALOG_TAG } from "@/lib/cache/catalog-cache";

function mapSeries(raw: Record<string, unknown> | null): VideoSeriesInfo | null {
  if (!raw) return null;
  return {
    id: String(raw.id),
    title_zh: raw.title_zh ? String(raw.title_zh) : null,
    title_mn: raw.title_mn ? String(raw.title_mn) : null,
    description_mn: raw.description_mn ? String(raw.description_mn) : null,
    cover_url: normalizeSeriesCoverUrl(
      raw.cover_url ? String(raw.cover_url) : null
    ),
    thumbnail_url: normalizeSeriesCoverUrl(
      raw.thumbnail_url ? String(raw.thumbnail_url) : null
    ),
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
  };
}

function readVideoCount(
  videos: { count: number }[] | { count: number } | null | undefined
): number {
  if (Array.isArray(videos)) return videos[0]?.count ?? 0;
  return videos?.count ?? 0;
}

function mapVideoEpisode(raw: Record<string, unknown>): VideoEpisodeItem {
  return {
    ...mapVideo(raw),
    subtitleCount: readVideoCount(
      raw.video_subtitles as { count: number }[] | { count: number } | null
    ),
  };
}

function mapVideo(raw: Record<string, unknown>): VideoRow {
  const seriesRaw = raw.video_series as Record<string, unknown> | null | undefined;
  return {
    id: String(raw.id),
    youtube_id: String(raw.youtube_id),
    title_zh: raw.title_zh ? String(raw.title_zh) : null,
    title_mn: raw.title_mn ? String(raw.title_mn) : null,
    source: raw.source ? String(raw.source) : null,
    source_url: raw.source_url ? String(raw.source_url) : null,
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
    duration_sec: raw.duration_sec != null ? Number(raw.duration_sec) : null,
    sync_offset_sec: Number(raw.sync_offset_sec ?? 0),
    subtitle_offset_sec: Number(
      raw.subtitle_offset_sec ?? raw.sync_offset_sec ?? 0
    ),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    series_id: raw.series_id ? String(raw.series_id) : null,
    episode_no: raw.episode_no != null ? Number(raw.episode_no) : null,
    series: mapSeries(seriesRaw ?? null),
    created_at: String(raw.created_at),
    kind: raw.kind === "song" ? "song" : raw.kind === "video" ? "video" : null,
    artist: raw.artist ? String(raw.artist) : null,
    year: raw.year != null && Number.isFinite(Number(raw.year)) ? Number(raw.year) : null,
  };
}

export { mapVideo as mapVideoRow };

const VIDEO_SERIES_SELECT =
  "id, title_zh, title_mn, description_mn, hsk_level, cover_url, thumbnail_url";
const VIDEO_SERIES_SELECT_CORE =
  "id, title_zh, title_mn, description_mn, hsk_level";

const VIDEO_ROW_SELECT =
  "*, video_series ( id, title_zh, title_mn, description_mn, hsk_level, cover_url, thumbnail_url )";
const VIDEO_ROW_SELECT_CORE =
  "*, video_series ( id, title_zh, title_mn, description_mn, hsk_level )";
const VIDEO_EPISODE_SELECT = `${VIDEO_ROW_SELECT}, video_subtitles(count)`;
const VIDEO_EPISODE_SELECT_CORE = `${VIDEO_ROW_SELECT_CORE}, video_subtitles(count)`;

function isMissingColumnSelectError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

export async function fetchVideoSeriesList(): Promise<VideoSeriesInfo[]> {
  const catalog = await fetchVideoSeriesCatalog();
  return catalog.map(({ videoCount: _count, ...series }) => series);
}

export async function fetchVideoSeriesCatalog(): Promise<VideoSeriesCard[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];
  return fetchVideoSeriesCatalogWith(client);
}

/**
 * Нийтийн цувралын каталог — anon клиент, Data Cache (tag: catalog:videos).
 * ХООСОН үр дүнг хэзээ ч кэшлэхгүй: DB түр алдаа өгөхөд «бичлэг алга» гэсэн хариу
 * кэшид үлдэж хэсэг бүхэлдээ алга болдог байсан. Хоосон/алдаа бол шууд (кэшгүй) уншина.
 */
const fetchVideoSeriesCatalogCachedInner = unstable_cache(
  async (): Promise<VideoSeriesCard[]> => {
    const client = createAnonServerSupabaseClient();
    if (!client) throw new Error("no supabase client");
    const rows = await fetchVideoSeriesCatalogWith(client);
    if (rows.length === 0) throw new Error("empty video series catalog — not caching");
    return rows;
  },
  ["public-video-series-catalog-v2"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.videos] }
);

export async function fetchVideoSeriesCatalogCached(): Promise<VideoSeriesCard[]> {
  if (!hasServerSupabaseConfig) return [];
  try {
    const cached = await fetchVideoSeriesCatalogCachedInner();
    if (cached.length > 0) return cached;
  } catch {
    // кэш хоосон/алдаатай — шууд уншина
  }
  const client = createAnonServerSupabaseClient();
  if (!client) return [];
  return fetchVideoSeriesCatalogWith(client);
}

async function fetchVideoSeriesCatalogWith(
  client: SupabaseClient
): Promise<VideoSeriesCard[]> {
  const primary = await client
    .from("video_series")
    .select(`${VIDEO_SERIES_SELECT}, videos(count)`)
    .order("title_mn", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("video_series")
      .select(`${VIDEO_SERIES_SELECT_CORE}, videos(count)`)
      .order("title_mn", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];

  // First episode per series — used as automatic YouTube thumbnail.
  const firstEpisodeBySeries = new Map<string, string>();
  const episodeRes = await client
    .from("videos")
    .select("series_id, youtube_id, episode_no")
    .not("series_id", "is", null)
    .order("episode_no", { ascending: true, nullsFirst: false });
  for (const ep of (episodeRes.data ?? []) as {
    series_id: string | null;
    youtube_id: string | null;
  }[]) {
    if (!ep.series_id || !ep.youtube_id) continue;
    if (!firstEpisodeBySeries.has(ep.series_id)) {
      firstEpisodeBySeries.set(ep.series_id, ep.youtube_id);
    }
  }

  return rows.map((row) => {
    const series = mapSeries(row as Record<string, unknown>)!;
    return {
      ...series,
      videoCount: readVideoCount(
        row.videos as { count: number }[] | { count: number } | null
      ),
      fallbackYoutubeId: firstEpisodeBySeries.get(series.id) ?? null,
    };
  });
}

async function fetchVideoSeriesByIdWith(
  client: SupabaseClient,
  seriesId: string
): Promise<VideoSeriesInfo | null> {

  const primary = await client
    .from("video_series")
    .select(VIDEO_SERIES_SELECT)
    .eq("id", seriesId)
    .maybeSingle();

  let row = primary.data as Record<string, unknown> | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("video_series")
      .select(VIDEO_SERIES_SELECT_CORE)
      .eq("id", seriesId)
      .maybeSingle();
    row = fallback.data as Record<string, unknown> | null;
    error = fallback.error;
  }

  if (error || !row) return null;
  return mapSeries(row);
}

/** Нийтийн агуулга — anon клиент, Data Cache (tag: catalog:videos); хоосон бол хэрэглэгчийн клиентээр. */
const fetchVideoSeriesByIdCached = unstable_cache(
  async (seriesId: string): Promise<VideoSeriesInfo | null> => {
    const client = createAnonServerSupabaseClient();
    if (!client) return null;
    return fetchVideoSeriesByIdWith(client, seriesId);
  },
  ["public-fetchVideoSeriesById"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.videos] }
);

export async function fetchVideoSeriesById(seriesId: string): Promise<VideoSeriesInfo | null> {
  if (!hasServerSupabaseConfig) return null;
  try {
    const cached = await fetchVideoSeriesByIdCached(seriesId);
    if (cached) return cached;
  } catch {
    // кэш ажиллахгүй бол шууд уншина
  }
  const client = await createServerSupabaseClient();
  if (!client) return null;
  return fetchVideoSeriesByIdWith(client, seriesId);
}

async function countOrphanVideosWith(client: SupabaseClient): Promise<number> {
  const { count, error } = await client
    .from("videos")
    .select("id", { count: "exact", head: true })
    .is("series_id", null);

  if (error) return 0;
  return count ?? 0;
}

export async function countOrphanVideos(): Promise<number> {
  if (!hasServerSupabaseConfig) return 0;
  const client = await createServerSupabaseClient();
  if (!client) return 0;
  return countOrphanVideosWith(client);
}

/** Цувралгүй бичлэгийн тоо (нийтийн) — Data Cache 120с (tag: catalog:videos). */
export const countOrphanVideosCached = unstable_cache(
  async (): Promise<number> => {
    const client = createAnonServerSupabaseClient();
    if (!client) return 0;
    return countOrphanVideosWith(client);
  },
  ["public-orphan-video-count"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.videos] }
);

async function fetchSeriesEpisodesWith(
  client: SupabaseClient,
  seriesId: string
): Promise<VideoEpisodeItem[]> {

  const primary = await client
    .from("videos")
    .select(VIDEO_EPISODE_SELECT)
    .eq("series_id", seriesId)
    .order("episode_no", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_EPISODE_SELECT_CORE)
      .eq("series_id", seriesId)
      .order("episode_no", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error) {
    console.error("[bichleg] fetchSeriesEpisodes failed", {
      seriesId,
      message: error.message,
    });
    return [];
  }
  if (!rows) return [];

  return rows.map((row) => mapVideoEpisode(row));
}

/** Нийтийн агуулга — anon клиент, Data Cache (tag: catalog:videos); хоосон бол хэрэглэгчийн клиентээр. */
const fetchSeriesEpisodesCached = unstable_cache(
  async (seriesId: string): Promise<VideoEpisodeItem[]> => {
    const client = createAnonServerSupabaseClient();
    if (!client) return [];
    return fetchSeriesEpisodesWith(client, seriesId);
  },
  ["public-fetchSeriesEpisodes"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.videos] }
);

export async function fetchSeriesEpisodes(seriesId: string): Promise<VideoEpisodeItem[]> {
  if (!hasServerSupabaseConfig) return [];
  try {
    const cached = await fetchSeriesEpisodesCached(seriesId);
    if (cached.length > 0) return cached;
  } catch {
    // кэш ажиллахгүй бол шууд уншина
  }
  const client = await createServerSupabaseClient();
  if (!client) return [];
  return fetchSeriesEpisodesWith(client, seriesId);
}

export async function fetchOrphanEpisodes(): Promise<VideoEpisodeItem[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_EPISODE_SELECT)
    .is("series_id", null)
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_EPISODE_SELECT_CORE)
      .is("series_id", null)
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error) {
    console.error("[bichleg] fetchOrphanEpisodes failed", { message: error.message });
    return [];
  }
  if (!rows) return [];

  return rows.map((row) => mapVideoEpisode(row));
}

async function fetchVideosBySeriesIdWith(
  client: SupabaseClient,
  seriesId: string
): Promise<VideoRow[]> {

  const primary = await client
    .from("videos")
    .select(VIDEO_ROW_SELECT)
    .eq("series_id", seriesId)
    .order("episode_no", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_ROW_SELECT_CORE)
      .eq("series_id", seriesId)
      .order("episode_no", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];
  return rows.map((row) => mapVideo(row));
}

/** Нийтийн агуулга — anon клиент, Data Cache (tag: catalog:videos); хоосон бол хэрэглэгчийн клиентээр. */
const fetchVideosBySeriesIdCached = unstable_cache(
  async (seriesId: string): Promise<VideoRow[]> => {
    const client = createAnonServerSupabaseClient();
    if (!client) return [];
    return fetchVideosBySeriesIdWith(client, seriesId);
  },
  ["public-fetchVideosBySeriesId"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.videos] }
);

export async function fetchVideosBySeriesId(seriesId: string): Promise<VideoRow[]> {
  if (!hasServerSupabaseConfig) return [];
  try {
    const cached = await fetchVideosBySeriesIdCached(seriesId);
    if (cached.length > 0) return cached;
  } catch {
    // кэш ажиллахгүй бол шууд уншина
  }
  const client = await createServerSupabaseClient();
  if (!client) return [];
  return fetchVideosBySeriesIdWith(client, seriesId);
}

export async function fetchOrphanVideos(): Promise<VideoRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_ROW_SELECT)
    .is("series_id", null)
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_ROW_SELECT_CORE)
      .is("series_id", null)
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];
  return rows.map((row) => mapVideo(row));
}

/** @deprecated Use fetchVideosBySeriesId or fetchOrphanVideos */
export async function fetchVideos(seriesId?: string | null): Promise<VideoRow[]> {
  if (seriesId) return fetchVideosBySeriesId(seriesId);
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_ROW_SELECT)
    .order("series_id", { ascending: true, nullsFirst: false })
    .order("episode_no", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_ROW_SELECT_CORE)
      .order("series_id", { ascending: true, nullsFirst: false })
      .order("episode_no", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];
  return rows.map((row) => mapVideo(row));
}

/**
 * Цуврал дотор `videoId`-ийн ДАРААГИЙН анги (episode_no → created_at дараалал).
 * `seriesId === "other"` бол цувралгүй бичлэгүүдийн дараалал.
 *
 * Хямд: нэг select (video_series join-той, subtitle count-гүй). Тоглуулагч auto-next
 * хийхдээ сервер талаас дуудаж болно; клиент талд `videos` массив байгаа бол
 * `getNextEpisodeInList` (lib/bichleg/episode-progress.ts) query-гүй хийнэ.
 * Сүүлийн анги / олдохгүй бол null.
 */
export async function getNextVideoInSeries(
  seriesId: string,
  videoId: string
): Promise<VideoRow | null> {
  const list =
    seriesId === "other"
      ? await fetchOrphanVideos()
      : await fetchVideosBySeriesId(seriesId);
  const idx = list.findIndex((v) => v.id === videoId);
  if (idx < 0 || idx + 1 >= list.length) return null;
  return list[idx + 1] ?? null;
}

async function fetchVideoSubtitlesWith(
  client: SupabaseClient,
  videoId: string
): Promise<VideoSubtitleRow[]> {

  const { data, error } = await client
    .from("video_subtitles")
    .select("*")
    .eq("video_id", videoId)
    .order("idx", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapVideoSubtitleRow(row as Record<string, unknown>));
}

/** Нийтийн агуулга — anon клиент, Data Cache (tag: catalog:videos); хоосон бол хэрэглэгчийн клиентээр. */
const fetchVideoSubtitlesCached = unstable_cache(
  async (videoId: string): Promise<VideoSubtitleRow[]> => {
    const client = createAnonServerSupabaseClient();
    if (!client) return [];
    return fetchVideoSubtitlesWith(client, videoId);
  },
  ["public-fetchVideoSubtitles"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG.videos] }
);

export async function fetchVideoSubtitles(videoId: string): Promise<VideoSubtitleRow[]> {
  if (!hasServerSupabaseConfig) return [];
  try {
    const cached = await fetchVideoSubtitlesCached(videoId);
    if (cached.length > 0) return cached;
  } catch {
    // кэш ажиллахгүй бол шууд уншина
  }
  const client = await createServerSupabaseClient();
  if (!client) return [];
  return fetchVideoSubtitlesWith(client, videoId);
}
