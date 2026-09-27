import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { TonePairsView } from "@/components/pronunciation/tone-pairs";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getTonePairs } from "@/lib/pronunciation/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "双音节声调 — Бөөндөө Сурцгаая",
};

export default async function TonePairsPage() {
  const [locale, pairs] = await Promise.all([getServerUiLocale(), getTonePairs()]);
  const total = Object.values(pairs).reduce((n, list) => n + list.length, 0);
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs items={[{ href: "/pronunciation", label: L(locale, "发音", "Дуудлага") }, { label: L(locale, "双音节声调", "Аялгуу хос") }]} />
      <MobilePageHeader
        title={L(locale, "双音节声调", "Аялгуу хос")}
        subtitle={L(locale, "HSK 1–3 双音节词，按声调组合听、跟读。", "HSK 1–3 хоёр үет үгс — аялгуугийн хэвээр сонс, дагаж хэл.")}
        badge={`${total}`}
      />
      <TonePairsView pairs={pairs} />
    </MobileAppShell>
  );
}
