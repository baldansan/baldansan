"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { loadSrsHubStats } from "@/lib/review/srs-hub-stats";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import type { BichlegContinueTarget } from "@/lib/bichleg/types";
import type { BichlegSuggestion } from "@/lib/mobile-home-data";

/**
 * Нүүрний «Өнөөдөр» хэсэг — hero-ийн доор 3 том карт:
 *  (а) Багшийн даалгавар — ангитай, даалгавартай бол (дуусаагүй тоо)
 *  (б) Давтах — өнөөдөр хүлээж буй карт (/review hub-тай нэг эх сурвалж)
 *  (в) Өнөөдрийн бичлэг — үргэлжлүүлэх бичлэг, байхгүй бол санал
 */

type Props = {
  loggedIn: boolean;
  /** null = ачаалж байна / нэвтрээгүй */
  bichlegContinue: BichlegContinueTarget | null;
  bichlegSuggestion: BichlegSuggestion | null;
};

type AssignmentCount = { pending: number; total: number } | null;

export function HomeTodaySection({ loggedIn, bichlegContinue, bichlegSuggestion }: Props) {
  const locale = useUiLocale();
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [assignments, setAssignments] = useState<AssignmentCount>(null);
  const [dueCards, setDueCards] = useState<number | null>(null);

  // (б) Хүлээж буй карт — нэвтрээгүй ч localStorage SRS-ээс тоолно.
  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    void (async () => {
      try {
        const { userId } = hasSupabaseConfig
          ? await getAuthenticatedUserId().catch(() => ({ userId: null }))
          : { userId: null };
        const stats = await loadSrsHubStats({ userId: userId ?? null, activeLevel });
        if (alive) setDueCards(stats.dueCards);
      } catch {
        if (alive) setDueCards(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, activeLevel]);

  // (а) Багшийн даалгавар — зөвхөн нэвтэрсэн; ангигүй бол [] → карт нуугдана.
  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    void (async () => {
      try {
        const { getStudentAssignments } = await import("@/lib/supabase/classrooms");
        const { data } = await getStudentAssignments();
        if (!alive) return;
        const rows = (data ?? []).filter((a) => !a.isCurriculum);
        if (rows.length === 0) {
          setAssignments(null);
          return;
        }
        setAssignments({
          total: rows.length,
          pending: rows.filter((a) => a.resultStatus !== "completed").length,
        });
      } catch {
        if (alive) setAssignments(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loggedIn]);

  const bichlegHref = bichlegContinue?.href ?? bichlegSuggestion?.href ?? "/bichleg";
  const bichlegTitle = bichlegContinue?.title ?? bichlegSuggestion?.title ?? null;
  const bichlegKicker = bichlegContinue
    ? tr(locale, "Бичлэг үргэлжлүүлэх")
    : tr(locale, "Өнөөдрийн бичлэг");

  return (
    <section className="mb-4" aria-label={tr(locale, "Өнөөдөр")}>
      <p className="bs-tm-sec">{tr(locale, "Өнөөдөр")}</p>
      <div className="bs-home-today">
        {loggedIn && assignments ? (
          <Link href="/my-assignments" className="bs-home-today-card bs-home-today-card--amber">
            <span className="bs-home-today-ic" aria-hidden>
              📌
            </span>
            <span className="bs-home-today-n">
              {assignments.pending > 0 ? assignments.pending : "✓"}
            </span>
            <span className="bs-home-today-l">
              {assignments.pending > 0
                ? tr(locale, "Багшийн даалгавар")
                : tr(locale, "Даалгавар бүгд дууссан")}
            </span>
          </Link>
        ) : null}

        <Link href="/review/daily" className="bs-home-today-card bs-home-today-card--green">
          <span className="bs-home-today-ic" aria-hidden>
            🔁
          </span>
          <span className="bs-home-today-n">
            {dueCards == null ? "…" : dueCards}
          </span>
          <span className="bs-home-today-l">
            {dueCards === 0 ? tr(locale, "Давтах карт алга") : tr(locale, "Давтах карт")}
          </span>
        </Link>

        <Link href={bichlegHref} className="bs-home-today-card bs-home-today-card--blue">
          <span className="bs-home-today-ic" aria-hidden>
            📺
          </span>
          <span className="bs-home-today-t" translate="no">
            {bichlegTitle ?? tr(locale, "Бичлэг үзэх")}
          </span>
          <span className="bs-home-today-l">{bichlegKicker}</span>
        </Link>
      </div>
    </section>
  );
}
