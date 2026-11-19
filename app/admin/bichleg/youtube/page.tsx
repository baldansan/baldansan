import { BichlegYoutubeClient } from "@/components/admin/bichleg-youtube-client";
import { fetchAdminSeriesList } from "@/lib/admin/bichleg-admin-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "YouTube холбоосоор бичлэг нэмэх — Удирдлагын хэсэг",
};

export default async function AdminBichlegYoutubePage() {
  const series = await fetchAdminSeriesList();
  return (
    <BichlegYoutubeClient
      seriesOptions={series.map((s) => ({
        id: s.id,
        title: s.title_mn ?? s.title_zh ?? s.id,
        episodeCount: s.episode_count,
      }))}
    />
  );
}
