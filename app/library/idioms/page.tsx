import { L } from "@/components/books/book-ui";
import { IdiomDetail } from "@/components/library/idiom-detail";
import { IdiomListPane } from "@/components/library/idiom-list-pane";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { paginate } from "@/lib/library/data";
import {
  IDIOM_PER_PAGE,
  filterIdioms,
  getSortedIdioms,
  parseIdiomListParams,
} from "@/lib/library/idiom-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "成语 · 谚语 · 歇后语 — Бөөндөө Сурцгаая",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Утас: жагсаалт (дарвал дэлгэрэнгүй хуудас руу).
 * PC (≥920px): зүүн жагсаалт + баруун дэлгэрэнгүй (эхний хэлц автоматаар).
 */
export default async function LibraryIdiomsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale: UiLocale = await getServerUiLocale();
  const params = parseIdiomListParams(sp);

  const [all, filtered] = await Promise.all([getSortedIdioms(params.kind), filterIdioms(params)]);
  const { items } = paginate(filtered, params.page, IDIOM_PER_PAGE);
  const first = items[0] ?? null;

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW} desktopWidth="wide">
      <div className="bs-lib-two">
        <IdiomListPane
          locale={locale}
          params={params}
          filtered={filtered}
          totalAll={all.length}
          selectedId={first?.id ?? null}
        />
        <div className="bs-lib-detail bs-desk-only">
          {first ? (
            <IdiomDetail item={first} kind={params.kind} locale={locale} showCrumbs={false} />
          ) : (
            <p className="app-card p-4 text-sm text-[var(--app-muted)]">
              {L(locale, "请从左侧选择一条。", "Зүүн талаас хэлц сонгоно уу.")}
            </p>
          )}
        </div>
      </div>
    </MobileAppShell>
  );
}
