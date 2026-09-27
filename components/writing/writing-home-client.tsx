"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { countDueLocalWriting } from "@/lib/srs/writing-srs";
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
  const [due, setDue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([listLists(), listAssignmentLists()]).then(([ownRes, asgRes]) => {
      if (!alive) return;
      setDue(countDueLocalWriting());
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
        href="/study"
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        {tr(locale, "← Давтах руу буцах")}
      </Link>

      <MobilePageHeader
        title={`✍️ ${tr(locale, "Бичих дэвтэр")}`}
        subtitle={tr(locale, "Даалгаврын ханзаа оруулаад бичиж сур")}
      />

      <div className="app-course-card mb-5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {tr(locale, "Өнөөдөр давтах ханз")}
        </p>
        <p className="mt-1 text-2xl font-bold">{due}</p>
        <p className="text-sm text-white/90">
          {due > 0
            ? tr(locale, "Алдсан ханзууд бичих давталтад хүлээж байна.")
            : tr(locale, "Давтах ханз алга — шинэ дэвтэр нээгээд бичээрэй.")}
        </p>
        <Link
          href="/review/writing"
          className="mt-3 inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-bold text-emerald-700"
        >
          {tr(locale, "Давтах")} →
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
