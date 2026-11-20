"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { listAssignmentLists, listLists } from "@/lib/writing/store";
import type { WritingListSummary } from "@/lib/writing/types";
import "@/components/writing/writing.css";

function ListRow({
  list,
  locale,
}: {
  list: WritingListSummary;
  locale: ReturnType<typeof useUiLocale>;
}) {
  const done = list.cellsTotal > 0 && list.cellsDone >= list.cellsTotal;
  return (
    <li>
      <Link href={`/writing/${list.id}`} className="block">
        <MobileCard className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[var(--app-text)]" translate="no">
              {list.title}
            </p>
            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
              {list.charsTotal} {tr(locale, "ханз")} · {list.repsTrace}+{list.repsMemory}{" "}
              {tr(locale, "удаа")}
              {list.dueDate ? ` · ${tr(locale, "Хугацаа")}: ${list.dueDate}` : ""}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-emerald-400"}`}
                style={{ width: `${list.percent}%` }}
              />
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
              done ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {done ? "✓" : `${list.percent}%`}
          </span>
        </MobileCard>
      </Link>
    </li>
  );
}

export function WritingHomeClient() {
  const locale = useUiLocale();
  const [own, setOwn] = useState<WritingListSummary[] | null>(null);
  const [assigned, setAssigned] = useState<WritingListSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([listLists(), listAssignmentLists()]).then(([ownRes, asgRes]) => {
      if (!alive) return;
      if (ownRes.error) setError(ownRes.error);
      setOwn(ownRes.data ?? []);
      setAssigned(asgRes.data ?? []);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <MobileAppShell activeTab="study">
      <Link
        href="/review"
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        {tr(locale, "← Давтах руу буцах")}
      </Link>

      <MobilePageHeader
        title={`✍️ ${tr(locale, "Ханзны дэвтэр")}`}
        subtitle={tr(locale, "Ханзаа харж, дагаж, санаж бичээд цээжил")}
      />

      {/* Үргэлжлүүлэх: дуусаагүй хамгийн сүүлийн дэвтэр */}
      {(() => {
        const unfinished = [...assigned, ...(own ?? [])].find(
          (l) => l.cellsTotal > 0 && l.cellsDone < l.cellsTotal
        );
        return (
          <div className="app-course-card mb-4 p-4">
            {unfinished ? (
              <>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/85">
                  {tr(locale, "Үргэлжлүүлэх")}
                </p>
                <p className="mt-0.5 truncate text-lg font-black text-white" translate="no">
                  {unfinished.title}
                </p>
                <p className="text-xs font-semibold text-white/90">
                  {unfinished.charsDone}/{unfinished.charsTotal} {tr(locale, "ханз")} · {unfinished.percent}%
                </p>
                <Link
                  href={`/writing/${unfinished.id}/practice`}
                  className="mt-3 inline-flex rounded-full bg-white px-5 py-2 text-sm font-extrabold text-emerald-700"
                >
                  ▶ {tr(locale, "Бичиж үргэлжлүүлэх")}
                </Link>
              </>
            ) : (
              <>
                <p className="text-lg font-black text-white">{tr(locale, "Өнөөдөр хэдэн ханз бичих вэ?")}</p>
                <p className="mt-0.5 text-xs font-semibold text-white/90">
                  {tr(locale, "Ханзаа, хэдэн удаа бичихээ өөрөө сонгоно. 👀 Харна → ✍️ дагана → 🧠 санана.")}
                </p>
                <Link
                  href="/writing/new"
                  className="mt-3 inline-flex rounded-full bg-white px-5 py-2 text-sm font-extrabold text-emerald-700"
                >
                  + {tr(locale, "Шинэ дэвтэр эхлэх")}
                </Link>
              </>
            )}
          </div>
        );
      })()}

      <p className="mb-2 text-sm font-bold text-[var(--app-text)]">{tr(locale, "Ханзаа хаанаас авах вэ?")}</p>
      <div className="bs-hz-src mb-5">
        <Link href="/review/writing">
          <span className="text-2xl" aria-hidden>⭐</span>
          <b>{tr(locale, "Миний үгс")}</b>
          <small>{tr(locale, "Цээжилж буй үгсээ бичнэ")}</small>
        </Link>
        <Link href="/writing/new?source=lesson">
          <span className="text-2xl" aria-hidden>📖</span>
          <b>{tr(locale, "Хичээлээс")}</b>
          <small>{tr(locale, "Үзсэн хичээлийнхээ ханзыг")}</small>
        </Link>
        <Link href="/writing/new?source=hsk">
          <span className="text-2xl" aria-hidden>🀄</span>
          <b>{tr(locale, "HSK түвшнээс")}</b>
          <small>{tr(locale, "Түвшний ханзаас сонгоно")}</small>
        </Link>
        <Link href="/writing/new?source=own">
          <span className="text-2xl" aria-hidden>✏️</span>
          <b>{tr(locale, "Өөрөө оруулах")}</b>
          <small>{tr(locale, "Багшийн өгсөн ханз, үг")}</small>
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          {error}
        </p>
      ) : null}

      {assigned.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">
            🏫 {tr(locale, "Ангийн даалгавар")}
          </h2>
          <ul className="space-y-2">
            {assigned.map((l) => (
              <ListRow key={l.id} list={l} locale={locale} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--app-text)]">
            📓 {tr(locale, "Миний дэвтэр")}
          </h2>
          <Link href="/writing/new" className="text-xs font-bold text-emerald-700">
            + {tr(locale, "Шинэ дэвтэр")}
          </Link>
        </div>
        {own == null ? (
          <MobileCard>
            <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
          </MobileCard>
        ) : own.length === 0 ? (
          <MobileCard padding="lg">
            <p className="text-sm font-semibold text-[var(--app-text)]">
              {tr(locale, "Сургуулийн дэвтэр шиг бичиж сур")}
            </p>
            <ol className="mt-2 space-y-1.5 text-sm leading-6 text-[var(--app-muted)]">
              <li>
                1. {tr(locale, "Багшийн өгсөн ханз, үгээ оруулна — пиньинь, утга нь автоматаар олдоно.")}
              </li>
              <li>2. 👀 {tr(locale, "Зураасны дарааллыг үзээд")} ✍️ {tr(locale, "дагаж бичнэ")}.</li>
              <li>
                3. 🧠 {tr(locale, "Санаж бичнэ — алдсан ханз давталтад буцаж ирнэ.")}
              </li>
            </ol>
            <Link href="/writing/new" className="app-btn-primary mt-4 inline-flex">
              + {tr(locale, "Шинэ дэвтэр")}
            </Link>
          </MobileCard>
        ) : (
          <ul className="space-y-2">
            {own.map((l) => (
              <ListRow key={l.id} list={l} locale={locale} />
            ))}
          </ul>
        )}
      </section>

      {own != null && own.length > 0 ? (
        <Link href="/writing/new" className="mb-6 block">
          <MobileCard className="flex items-center justify-between gap-3 border-dashed">
            <p className="font-semibold text-emerald-700">+ {tr(locale, "Шинэ дэвтэр")}</p>
            <span className="text-lg text-[var(--app-muted)]">›</span>
          </MobileCard>
        </Link>
      ) : null}
    </MobileAppShell>
  );
}
