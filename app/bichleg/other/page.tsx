import { BichlegFeedClient } from "@/components/bichleg/bichleg-feed-client";
import { fetchOrphanVideos } from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Бусад бичлэг — Бөөндөө Сурцгаая",
};

export default async function BichlegOtherFeedPage() {
  const videos = await fetchOrphanVideos();

  return (
    <BichlegFeedClient
      videos={videos}
      backHref="/bichleg"
      feedTitle="Бусад бичлэг"
    />
  );
}
