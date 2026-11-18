"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { readDailyListeningResult, todayKeyUB } from "@/lib/listen/daily-listening-local";
import { loadSrsHubStats } from "@/lib/review/srs-hub-stats";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  markTodayStepDone,
  readTodayPathDone,
  TODAY_PATH_EVENT,
  type TodayStepId,
} from "@/lib/today/today-path";

/**
 * Нүүрний «Өнөөдрийн 3 алхам»: үг → хичээлийн дараагийн үе → сонсгол.
 * Олон картын оронд өдөрт яг гурван жижиг даалгавар (~10 минут). Гурвууланг нь хийвэл өдрийн од.
 */
type Props = {
  /** Үргэлжлүүлэх хичээлийн холбоос ба нэр (сонгосон номоос). null бол хичээлийн алхам гарахгүй. */
  lessonHref: string | null;
  lessonTitle: string;
  /** Сонгосон номын HSK түвшин (байвал үг, сонсголын алхам энэ түвшнээр явна). */
  bookLevel?: number | null;
};

type Step = {
  id: TodayStepId;
  tone: "green" | "blue" | "violet";
  title: string;
  meta: string;
  href: string;
};

export function HomeTodayPath({ lessonHref, lessonTitle, bookLevel = null }: Props) {
  const locale = useUiLocale();
  const { level: globalLevel, hydrated } = useActiveHskLevel();
  const activeLevel = (bookLevel != null && bookLevel >= 1 && bookLevel <= 6 ? bookLevel : globalLevel) as typeof globalLevel;
  const [done, setDone] = useState<Partial<Record<TodayStepId, boolean>>>({});
  const [dueCards, setDueCards] = useState<number | null>(null);

  // Төхөөрөмж дээрх тэмдэглэл + өнөөдрийн сонсголын дүн.
  useEffect(() => {
    if (!hydrated) return;
    const sync = () => {
      const stored = readTodayPathDone();
      const listen = readDailyListeningResult(todayKeyUB(), Number(activeLevel));
      if (listen && !stored.listen) markTodayStepDone("listen");
      setDone({ ...stored, listen: Boolean(stored.listen || listen) });
    };
    sync();
    window.addEventListener(TODAY_PATH_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(TODAY_PATH_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, [hydrated, activeLevel]);

  // Давтах үг: өнөөдөр давтсан бол «үг» алхам хийгдсэнд тооцно.
  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    void (async () => {
      try {
        const { userId } = hasSupabaseConfig
          ? await getAuthenticatedUserId().catch(() => ({ userId: null }))
          : { userId: null };
        const stats = await loadSrsHubStats({ userId: userId ?? null, activeLevel });
        if (!alive) return;
        setDueCards(stats.dueCards);
        if (stats.dailyDone > 0) markTodayStepDone("words");
      } catch {
        if (alive) setDueCards(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, activeLevel]);

  const hasDue = (dueCards ?? 0) > 0;
  const steps: Step[] = [
    hasDue
      ? {
          id: "words",
          tone: "green",
          title: `${Math.min(dueCards ?? 0, 20)} ${tr(locale, "үг давтах")}`,
          meta: tr(locale, "Миний үгс · 2 мин"),
          href: "/review/daily",
        }
      : {
          id: "words",
          tone: "green",
          title: tr(locale, "Цээжлэх үгээ сонгох"),
          meta: `HSK ${activeLevel} · ${tr(locale, "♥ дарж нэмнэ")}`,
          href: `/dictionary/levels?level=${activeLevel}`,
        },
    ...(lessonHref
      ? [
          {
            id: "lesson" as const,
            tone: "blue" as const,
            title: lessonTitle,
            meta: tr(locale, "Хичээлийн дараагийн үе · 5 мин"),
            href: lessonHref,
          },
        ]
      : []),
    {
      id: "listen",
      tone: "violet",
      title: tr(locale, "Сонсголын богино сорил"),
      meta: tr(locale, "10 асуулт · 3 мин"),
      href: `/listen/daily?level=${activeLevel}`,
    },
  ];

  const doneCount = steps.filter((s) => done[s.id]).length;
  const allDone = doneCount >= steps.length;
  const current = steps.find((s) => !done[s.id]) ?? null;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <section className="bs-today" aria-label={tr(locale, "Өнөөдрийн зам")}>
      <div className={`bs-today-head${allDone ? " bs-today-head--done" : ""}`}>
        <div
          className="bs-today-ring"
          style={{ background: `conic-gradient(#fff 0 ${pct}%, rgba(255,255,255,.25) ${pct}% 100%)` }}
          aria-hidden
        >
          <span>{allDone ? "⭐" : `${doneCount}/${steps.length}`}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="bs-today-kicker">{tr(locale, "Өнөөдрийн зам")}</p>
          <p className="bs-today-title">
            {allDone
              ? tr(locale, "Өнөөдрийнхөө бүгдийг хийлээ! Маргааш уулзъя 👏")
              : doneCount === 0
                ? tr(locale, "3 жижиг алхам — 10 орчим минут")
                : `${tr(locale, "Дахиад")} ${steps.length - doneCount} ${tr(locale, "алхам үлдлээ")}`}
          </p>
        </div>
        {allDone ? (
          <Image src="/temee/v2/celebrate-sm.webp" alt="" width={56} height={56} className="bs-today-mascot" />
        ) : null}
      </div>

      <ol className="bs-today-steps">
        {steps.map((step, index) => {
          const isDone = Boolean(done[step.id]);
          const isCurrent = current?.id === step.id;
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={`bs-today-step${isDone ? " bs-today-step--done" : ""}${isCurrent ? " bs-today-step--on" : ""}`}
              >
                <span className={`bs-today-num bs-today-num--${step.tone}`} aria-hidden>
                  {isDone ? "✓" : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  {isCurrent ? <span className="bs-today-now">{tr(locale, "Одоо")}</span> : null}
                  <span className="bs-today-step-title" translate="no">
                    {step.title}
                  </span>
                  <span className="bs-today-step-meta">{isDone ? tr(locale, "Хийсэн ✓") : step.meta}</span>
                </span>
                {isCurrent ? (
                  <span className="bs-today-go">{tr(locale, "Эхлэх")}</span>
                ) : (
                  <span className="bs-today-chev" aria-hidden>
                    ›
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
