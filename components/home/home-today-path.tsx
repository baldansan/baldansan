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
  EVENING_CHECK_HOUR,
  hourUB,
  markTodayHanzi,
  markTodayStepDone,
  readTodayPlan,
  TODAY_PATH_EVENT,
  type PrevLessonDay,
  type TodayStepId,
} from "@/lib/today/today-path";

/**
 * Нүүрний «Өнөөдрийн төлөвлөгөө»: 1 бүтэн хичээл → ханзны дэвтэр → үг → сонсгол.
 * Дөрвүүланг нь хийвэл «өнөөдөр бүтэн оноо». Орой (18 цагаас) өнөөдрийн хичээлээ,
 * маргааш нь өчигдрийнхөө цээжилснийг шалгах мөр нэмэгдэнэ.
 */
type Props = {
  /** Үргэлжлүүлэх хичээлийн холбоос ба нэр (сонгосон номоос). null бол хичээлийн алхам гарахгүй. */
  lessonHref: string | null;
  lessonTitle: string;
  /** Үргэлжлүүлэх хичээлийн id — ханзны дэвтэр энэ хичээлийн ханзаар нээгдэнэ. */
  lessonId?: string | null;
  /** Сонгосон номын HSK түвшин (байвал үг, сонсголын алхам энэ түвшнээр явна). */
  bookLevel?: number | null;
};

type StepKey = TodayStepId | "prevCheck";

type Step = {
  id: StepKey;
  tone: "green" | "blue" | "violet";
  title: string;
  meta: string;
  doneMeta?: string;
  href: string;
  /** Бүтэн онооны 4 алхамд ордоггүй (шалгалт). */
  extra?: boolean;
  skippable?: boolean;
};

export function HomeTodayPath({ lessonHref, lessonTitle, lessonId = null, bookLevel = null }: Props) {
  const locale = useUiLocale();
  const { level: globalLevel, hydrated } = useActiveHskLevel();
  const activeLevel = (bookLevel != null && bookLevel >= 1 && bookLevel <= 6 ? bookLevel : globalLevel) as typeof globalLevel;
  const [done, setDone] = useState<Partial<Record<TodayStepId, boolean>>>({});
  const [todayLessonId, setTodayLessonId] = useState<string | null>(null);
  const [hanziSkipped, setHanziSkipped] = useState(false);
  const [prev, setPrev] = useState<PrevLessonDay | null>(null);
  const [evening, setEvening] = useState(false);
  const [dueCards, setDueCards] = useState<number | null>(null);

  // Төхөөрөмж дээрх тэмдэглэл + өнөөдрийн сонсголын дүн.
  useEffect(() => {
    if (!hydrated) return;
    const sync = () => {
      const plan = readTodayPlan();
      const listen = readDailyListeningResult(todayKeyUB(), Number(activeLevel));
      if (listen && !plan.done.listen) markTodayStepDone("listen");
      setDone({ ...plan.done, listen: Boolean(plan.done.listen || listen) });
      setTodayLessonId(plan.lessonId ?? null);
      setHanziSkipped(Boolean(plan.hanziSkipped));
      setPrev(plan.prev);
      setEvening(hourUB() >= EVENING_CHECK_HOUR);
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
  const lessonFull = Boolean(done.lessonFull);
  /** Ханзны дэвтэр: өнөөдөр дуусгасан хичээлийнх, үгүй бол одоо үзэж буй хичээлийнх. */
  const hanziLessonId = todayLessonId ?? lessonId;
  const steps: Step[] = [
    // Өчигдрийн (сүүлд дуусгасан) хичээлийн шалгалт — шинэ хичээлийн өмнө.
    ...(prev && !prev.checked
      ? [
          {
            id: "prevCheck" as const,
            tone: "violet" as const,
            title: tr(locale, "Өчигдрийнхөө шалгалт"),
            meta: tr(locale, "Өмнөх хичээлийн үг · 2 мин"),
            href: `/today/check?lesson=${encodeURIComponent(prev.lessonId)}&when=prev`,
            extra: true,
          },
        ]
      : []),
    ...(lessonHref
      ? [
          {
            id: "lessonFull" as const,
            tone: "blue" as const,
            title: lessonFull ? tr(locale, "Өнөөдрийн хичээл") : lessonTitle,
            meta: done.lesson
              ? tr(locale, "Эхэлсэн — бүх үеийг нь дуусгаарай")
              : tr(locale, "1 бүтэн хичээл · бүх даалгавартай нь"),
            doneMeta: tr(locale, "Бүтэн дуусгасан ✓"),
            href: lessonHref,
          },
        ]
      : []),
    ...(lessonHref && hanziLessonId
      ? [
          {
            id: "hanzi" as const,
            tone: "green" as const,
            title: tr(locale, "Ханзаа дэвтэрт бичих"),
            meta: tr(locale, "Хичээлийн ханз · 2, 2-оор"),
            doneMeta: hanziSkipped ? tr(locale, "Мэднэ — алгассан ✓") : tr(locale, "Бичсэн ✓"),
            href: `/writing/lesson/${encodeURIComponent(hanziLessonId)}`,
            skippable: true,
          },
        ]
      : []),
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
    {
      id: "listen",
      tone: "violet",
      title: tr(locale, "Сонсголын богино сорил"),
      meta: tr(locale, "10 асуулт · 3 мин"),
      href: `/listen/daily?level=${activeLevel}`,
    },
    // Оройн шалгалт — өнөөдөр хичээлээ дуусгасан хүнд 18 цагаас.
    ...(lessonFull && todayLessonId && (evening || done.check)
      ? [
          {
            id: "check" as const,
            tone: "violet" as const,
            title: tr(locale, "Оройн шалгалт"),
            meta: tr(locale, "Өнөөдрийн хичээлийн үг · 2 мин"),
            doneMeta: tr(locale, "Шалгасан ✓"),
            href: `/today/check?lesson=${encodeURIComponent(todayLessonId)}&when=today`,
            extra: true,
          },
        ]
      : []),
  ];

  const isStepDone = (s: Step) => (s.id === "prevCheck" ? false : Boolean(done[s.id]));
  const core = steps.filter((s) => !s.extra);
  const doneCount = core.filter(isStepDone).length;
  const allDone = doneCount >= core.length;
  const current = steps.find((s) => !isStepDone(s)) ?? null;
  const pct = Math.round((doneCount / core.length) * 100);

  return (
    <section className="bs-today" aria-label={tr(locale, "Өнөөдрийн төлөвлөгөө")}>
      <div className={`bs-today-head${allDone ? " bs-today-head--done" : ""}`}>
        <div
          className="bs-today-ring"
          style={{ background: `conic-gradient(#fff 0 ${pct}%, rgba(255,255,255,.25) ${pct}% 100%)` }}
          aria-hidden
        >
          <span>{allDone ? "⭐" : `${doneCount}/${core.length}`}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="bs-today-kicker">{tr(locale, "Өнөөдрийн төлөвлөгөө")}</p>
          <p className="bs-today-title">
            {allDone
              ? tr(locale, "Өнөөдөр бүтэн оноо авлаа! 👏")
              : doneCount === 0
                ? tr(locale, "Бүгдийг хийвэл өнөөдөр бүтэн оноо")
                : `${tr(locale, "Бүтэн оноонд")} ${core.length - doneCount} ${tr(locale, "алхам үлдлээ")}`}
          </p>
        </div>
        {allDone ? (
          <Image src="/temee/v2/celebrate-sm.webp" alt="" width={56} height={56} className="bs-today-mascot" />
        ) : null}
      </div>

      <ol className="bs-today-steps">
        {steps.map((step) => {
          const isDone = isStepDone(step);
          const isCurrent = current?.id === step.id;
          return (
            <li key={step.id} className="bs-today-li">
              <Link
                href={step.href}
                className={`bs-today-step${isDone ? " bs-today-step--done" : ""}${isCurrent ? " bs-today-step--on" : ""}`}
              >
                <span className={`bs-today-num bs-today-num--${step.tone}`} aria-hidden>
                  {isDone ? "✓" : step.extra ? "?" : core.indexOf(step) + 1}
                </span>
                <span className="min-w-0 flex-1">
                  {isCurrent ? <span className="bs-today-now">{tr(locale, "Одоо")}</span> : null}
                  <span className="bs-today-step-title" translate="no">
                    {step.title}
                  </span>
                  <span className="bs-today-step-meta">{isDone ? (step.doneMeta ?? tr(locale, "Хийсэн ✓")) : step.meta}</span>
                </span>
                {isCurrent ? (
                  <span className="bs-today-go">{tr(locale, "Эхлэх")}</span>
                ) : (
                  <span className="bs-today-chev" aria-hidden>
                    ›
                  </span>
                )}
              </Link>
              {step.skippable && !isDone ? (
                <button type="button" className="bs-today-skip" onClick={() => markTodayHanzi("skipped")}>
                  {tr(locale, "Эдгээр ханзыг мэднэ — алгасах")}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
