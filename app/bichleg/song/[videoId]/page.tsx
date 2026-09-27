import { SongKaraokeClient } from "@/components/songs/song-karaoke-client";
import { buildDemoSong } from "@/lib/songs/demo";
import { fetchSongVideoById } from "@/lib/songs/supabase";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ demo?: string; yt?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { videoId } = await params;
  const found = await fetchSongVideoById(decodeURIComponent(videoId));
  const title = found?.video.title_zh ?? found?.video.title_mn;
  return { title: title ? `${title} — Дуу` : "Дуу — Бөөндөө Сурцгаая" };
}

/**
 * Karaoke: YouTube дуу + манай zh/pinyin/mn мөр хамт гүйнэ.
 * `?demo=1` → «两只老虎» demo (зохиомол цаг); `&yt=<11 тэмдэгт>` → demo-д бодит YouTube ID.
 */
export default async function SongKaraokePage({ params, searchParams }: Props) {
  const [{ videoId: rawVideoId }, { demo, yt }] = await Promise.all([params, searchParams]);
  const videoId = decodeURIComponent(rawVideoId);

  if (demo === "1") {
    const demoSong = buildDemoSong();
    const ytOverride = yt && /^[A-Za-z0-9_-]{11}$/.test(yt) ? yt : null;
    const video =
      demoSong && ytOverride
        ? { ...demoSong.video, youtube_id: ytOverride }
        : (demoSong?.video ?? null);
    return (
      <SongKaraokeClient
        video={video}
        subtitles={demoSong?.subtitles ?? []}
        isDemo
      />
    );
  }

  const found = await fetchSongVideoById(videoId);
  return (
    <SongKaraokeClient
      video={found?.video ?? null}
      subtitles={found?.subtitles ?? []}
    />
  );
}
