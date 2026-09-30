import { notFound } from "next/navigation";
import { IdiomDetail } from "@/components/library/idiom-detail";
import { IdiomKeyNav } from "@/components/library/idiom-key-nav";
import { IdiomListPane } from "@/components/library/idiom-list-pane";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getIdioms, type Idiom, type IdiomKind } from "@/lib/library/data";
import {
  IDIOM_PER_PAGE,
  filterIdioms,
  getSortedIdioms,
  idiomDetailHref,
  parseIdiomListParams,
  type IdiomListParams,
} from "@/lib/library/idiom-list";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Found = { kind: IdiomKind; item: Idiom };

async function findById(rawId: string): Promise<Found | null> {
  const id = decodeURIComponent(rawId);
  const kinds: IdiomKind[] = ["idioms", "proverbs", "xiehouyu"];
  for (const kind of kinds) {
    const items = await getIdioms(kind);
    const item = items.find((x) => x.id === id);
    if (item) return { kind, item };
  }
  return null;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const found = await findById(id);
  return { title: `${found?.item.zh ?? "成语"} — Бөөндөө Сурцгаая` };
}

/**
 * Утас: нэг хэлцийн дэлгэрэнгүй хуудас.
 * PC (≥920px): зүүн жагсаалт (шүүлтүүр URL-аас) + баруун дэлгэрэнгүй; ↑↓ товчоор солино.
 */
export default async function LibraryIdiomDetailPage({ params, searchParams }: Props) {
  const [{ id }, sp, locale] = await Promise.all([params, searchParams, getServerUiLocale()]);
  const found = await findById(id);
  if (!found) notFound();

  // Жагсаалтын шүүлтүүр: URL-д байхгүй бол тухайн хэлцийн төрлөөр
  const base = parseIdiomListParams(sp);
  const listParams: IdiomListParams = { ...base, kind: sp.kind ? base.kind : found.kind };
  const [all, filtered] = await Promise.all([
    getSortedIdioms(listParams.kind),
    filterIdioms(listParams),
  ]);
  const pos = filtered.findIndex((x) => x.id === found.item.id);
  // Хуудас URL-д заагаагүй бол тухайн хэлц байгаа хуудас руу
  if (!sp.page && pos >= 0) listParams.page = Math.floor(pos / IDIOM_PER_PAGE) + 1;
  const prev = pos > 0 ? filtered[pos - 1] : null;
  const next = pos >= 0 && pos < filtered.length - 1 ? filtered[pos + 1] : null;
  const hrefOf = (x: Idiom) =>
    idiomDetailHref(x.id, {
      ...listParams,
      page: Math.floor(filtered.indexOf(x) / IDIOM_PER_PAGE) + 1,
    });

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW} desktopWidth="wide">
      <div className="bs-lib-two bs-lib-two--detail">
        <div className="bs-desk-only">
          <IdiomListPane
            locale={locale}
            params={listParams}
            filtered={filtered}
            totalAll={all.length}
            selectedId={found.item.id}
          />
        </div>
        <div className="bs-lib-detail">
          <IdiomDetail item={found.item} kind={found.kind} locale={locale as UiLocale} />
        </div>
      </div>
      <IdiomKeyNav prevHref={prev ? hrefOf(prev) : null} nextHref={next ? hrefOf(next) : null} />
    </MobileAppShell>
  );
}
