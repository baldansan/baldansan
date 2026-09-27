"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { DAILY_TONE_STORAGE_KEY, EMPTY_DAILY, computeStreak, type DailyToneStore } from "@/lib/pronunciation/daily-tone";
import { PINYIN_COURSE, PINYIN_COURSE_STORAGE_KEY, type CourseProgress } from "@/lib/pronunciation/pinyin-course";
import { useStoredJson } from "@/lib/pronunciation/use-stored-json";

const EMPTY: CourseProgress = {};

/** Курсын зураглал — нэгжүүд босоо зам (цээжлэх зураглалын хэв маяг) */
export function PinyinCourseMap() {
  const locale = useUiLocale();
  const progress = useStoredJson<CourseProgress>(PINYIN_COURSE_STORAGE_KEY, EMPTY);
  const daily = useStoredJson<Partial<DailyToneStore>>(DAILY_TONE_STORAGE_KEY, EMPTY_DAILY);
  const dailyStreak = computeStreak(daily.history ?? {});

  const doneCount = PINYIN_COURSE.filter((u) => progress[u.id]?.done).length;
  const anyStarted = PINYIN_COURSE.some((u) => {
    const p = progress[u.id];
    return p && (p.done || p.listened.length > 0 || p.testScore != null);
  });
  const firstOpen = PINYIN_COURSE.findIndex((u) => !progress[u.id]?.done);
  const currentIdx = firstOpen === -1 ? PINYIN_COURSE.length - 1 : firstOpen;
  const current = PINYIN_COURSE[currentIdx];

  return (
    <div>
      <div className="app-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {doneCount}/{PINYIN_COURSE.length} {tr(locale, "дууссан")}
          </p>
          <Link
            href="/pronunciation/daily"
            className="ml-auto rounded-full bg-orange-50 px-2.5 py-1 text-xs font-extrabold text-orange-700 ring-1 ring-orange-200"
            title={tr(locale, "Өдрийн аялгуу")}
          >
            🔥 {dailyStreak}
          </Link>
          <span className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full bg-emerald-500"
              style={{ width: `${Math.round((100 * doneCount) / PINYIN_COURSE.length)}%` }}
            />
          </span>
        </div>
        <Link
          href={`/pronunciation/basics/${current.id}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xl font-extrabold text-white active:bg-emerald-700"
        >
          ▶ {anyStarted ? tr(locale, "Үргэлжлүүлэх") : tr(locale, "Эхлэх")}
          <span className="text-base font-bold opacity-80" translate="no">
            · {current.order}. {locale === "zh" ? current.titleZh : current.title}
          </span>
        </Link>
      </div>

      <ol className="bs-mem-map" style={{ marginTop: 18 }}>
        {PINYIN_COURSE.map((u, i) => {
          const p = progress[u.id];
          const isDone = !!p?.done;
          const isCurrent = i === currentIdx;
          const isErrors = u.kind === "errors";
          const total = isErrors ? (u.sections?.length ?? 0) : u.items.length || (u.rules?.length ?? 0);
          const seen = Math.min(total, isErrors ? Object.keys(p?.sections ?? {}).length : (p?.listened.length ?? 0));
          const pct = isDone ? 100 : total > 0 ? Math.round((100 * seen) / total) : 0;
          const state = isDone ? "done" : isCurrent ? "current" : seen > 0 ? "started" : "todo";
          return (
            <li key={u.id} className={`bs-mem-map-node bs-mem-map-${state}`} data-pos={i % 4}>
              <Link href={`/pronunciation/basics/${u.id}`} className="bs-mem-map-btn">
                {isCurrent ? (
                  <span className="bs-mem-map-here">{anyStarted ? `▶ ${tr(locale, "Үргэлжлүүлэх")}` : `▶ ${tr(locale, "Эхлэх")}`}</span>
                ) : null}
                <span className="bs-mem-map-ring" style={{ background: `conic-gradient(#10b981 ${pct}%, #e2e8f0 0)` }}>
                  <span className="bs-mem-map-circle" aria-hidden>
                    {isDone ? "⭐" : u.emoji}
                  </span>
                </span>
                <span className="bs-mem-map-title" translate="no">
                  {isErrors ? (
                    <span className="mr-1 inline-block rounded-full bg-rose-50 px-1.5 text-[10px] font-extrabold text-rose-700 ring-1 ring-rose-200">🇲🇳</span>
                  ) : (
                    `${u.order}. `
                  )}
                  {locale === "zh" ? u.titleZh : u.title}
                  {locale !== "zh" && u.titleZh !== u.title && !isErrors ? <span className="block text-[10px] font-semibold text-slate-400">{u.titleZh}</span> : null}
                </span>
                <span className="bs-mem-map-count">
                  {isDone
                    ? `${tr(locale, "дууссан")}${p?.testScore != null && !isErrors ? ` · ${p.testScore}/8` : ""}`
                    : `${seen}/${total}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
