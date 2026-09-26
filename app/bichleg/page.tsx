import { BichlegSeriesPickerClient } from "@/components/bichleg/bichleg-series-picker-client";
import { MediaTabs } from "@/components/songs/media-tabs";
import { SongsClient } from "@/components/songs/songs-client";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import {
  fetchSeriesWatchProgressMap,
  isServerUserAuthenticated,
} from "@/lib/supabase/video-progress-server";
import {
  countOrphanVideos,
  fetchVideoSeriesCatalog,
} from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "歌曲与视频 — Бөөндөө Сурцгаая",
};

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function BichlegPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  if (tab === "songs") {
    const locale = await getServerUiLocale();
    return (
      <MobileAppShell activeTab="clips" mainClassName={SHELL_MAIN_NARROW}>
        <MobilePageHeader
          title={locale === "zh" ? "歌曲与视频" : "Дуу ба бичлэг"}
          subtitle={locale === "zh" ? "跟着歌曲学中文：2000–2026年热门歌曲与儿歌。" : "Дуугаар хятад хэл сур: 2000–2026 оны хит дуу, хүүхдийн дуу."}
        />
        <MediaTabs active="songs" />
        <SongsClient />
      </MobileAppShell>
    );
  }

  const [seriesList, orphanCount] = await Promise.all([
    fetchVideoSeriesCatalog(),
    countOrphanVideos(),
  ]);

  const isAuthenticated = await isServerUserAuthenticated();
  const totalsBySeriesId = Object.fromEntries(
    seriesList.map((s) => [s.id, s.videoCount])
  );
  const seriesProgress = isAuthenticated
    ? await fetchSeriesWatchProgressMap(
        seriesList.map((s) => s.id),
        totalsBySeriesId
      )
    : {};

  return (
    <BichlegSeriesPickerClient
      seriesList={seriesList}
      orphanCount={orphanCount}
      seriesProgress={seriesProgress}
    />
  );
}
