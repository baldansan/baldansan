import { BichlegFeedClient } from "@/components/bichleg/bichleg-feed-client";
import { fetchVideos } from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Бичлэг — Бөөндөө Сурцгаая",
};

export default async function BichlegPage() {
  const videos = await fetchVideos();
  return <BichlegFeedClient videos={videos} />;
}
