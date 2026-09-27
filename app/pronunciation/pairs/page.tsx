import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { PairsGame } from "@/components/pronunciation/pairs-game";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getPinyinChart } from "@/lib/pronunciation/data";
import { resolvePairGroups } from "@/lib/pronunciation/minimal-pairs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "近音辨析 — Бөөндөө Сурцгаая",
};

export default async function PairsPage() {
  const [locale, chart] = await Promise.all([getServerUiLocale(), getPinyinChart()]);
  const groups = resolvePairGroups(chart);
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs items={[{ href: "/pronunciation", label: L(locale, "发音", "Дуудлага") }, { label: L(locale, "近音辨析", "Ойрхон дуу") }]} />
      <MobilePageHeader
        title={L(locale, "近音辨析", "Ойрхон дуу")}
        subtitle={L(locale, "听一个音节，选出听到的是哪一个。", "Нэг үе сонсоод алийг нь сонссоноо сонго.")}
        badge={`${groups.length}`}
      />
      <PairsGame groups={groups} />
    </MobileAppShell>
  );
}
