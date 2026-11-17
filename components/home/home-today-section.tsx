"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { readDailyListeningResult, todayKeyUB } from "@/lib/listen/daily-listening-local";
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
  const [listenDone, setListenDone] = useState<{ correct: number; total: number } | null>(null);

  // (г) Өнөөдрийн сонсгол — өнөөдөр энэ түвшинд хийсэн бол «✓ 8/10».
  useEffect(() => {
    if (!hydrated) return;
    const r = readDailyListeningResult(todayKeyUB(), Number(activeLevel));
    setListenDone(r ? { correct: r.correct, total: r.total } : null);
  }, [hydrated, activeLevel]);

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

  // Нүүр хуудсыг энгийн байлгана: өмнө нь энд 4 өнгөт хавтан («Давтах» хуудастай бараг ижил) байсан нь
  // хүмүүсийг төөрөгдүүлж байв. Одоо зөвхөн хийх зүйл байвал нэг мөр гарна; бусад нь «Давтах» таб дотор.
  void listenDone;
  void bichlegHref;
  void bichlegTitle;
  void bichlegKicker;
  // Багшийн даалгаврыг дээд талын TeacherAssignmentBanner харуулдаг тул энд давтахгүй.
  const hasAssignments = false;
  const hasDue = dueCards != null && dueCards > 0;
  if (!hasAssignments && !hasDue) return null;

  return (
    <section className="mb-3" aria-label={tr(locale, "Өнөөдөр")}>
      {hasAssignments ? (
        <Link href="/my-assignments" className="bs-home-chat">
          <span className="bs-mss-prompt-ico" aria-hidden>
            📌
          </span>
          <span className="bs-mss-prompt-body">
            <span className="bs-home-chat-title">
              {tr(locale, "Багшийн даалгавар")} · {assignments?.pending}
            </span>
            <span className="bs-mss-prompt-sub">{tr(locale, "Хийж дуусгаагүй даалгавар байна")}</span>
          </span>
          <span aria-hidden className="bs-mss-prompt-arrow">
            ›
          </span>
        </Link>
      ) : null}
      {hasDue ? (
        <Link href="/review/daily" className="bs-home-chat">
          <span className="bs-mss-prompt-ico" aria-hidden>
            🔁
          </span>
          <span className="bs-mss-prompt-body">
            <span className="bs-home-chat-title">
              {tr(locale, "Өнөөдөр давтах")} {dueCards} {tr(locale, "үг байна")}
            </span>
            <span className="bs-mss-prompt-sub">{tr(locale, "Мартахаас өмнө 2–3 минут давтчих")}</span>
          </span>
          <span aria-hidden className="bs-mss-prompt-arrow">
            ›
          </span>
        </Link>
      ) : null}
    </section>
  );
}
