"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markLessonStartedSmart } from "@/lib/progress";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import {
  lessonPath,
  lessonQuizPath,
  lessonVocabularyPath,
} from "@/lib/content";
import type { LessonContent } from "@/types/lesson-content";
import type { SubtitleMode, TimedSubtitle } from "@/types/lesson";

const modes: { id: SubtitleMode; label: string }[] = [
  { id: "chinese", label: "Chinese" },
  { id: "mongolian", label: "Mongolian" },
  { id: "both", label: "Both" },
];

function SubtitleLines({
  line,
  mode,
}: {
  line: TimedSubtitle;
  mode: SubtitleMode;
}) {
  if (mode === "mongolian") {
    return <p className="text-sm leading-6 text-slate-700">{line.mongolian}</p>;
  }

  return (
    <>
      <p className="text-base font-medium leading-snug text-slate-900">
        {line.chinese}
      </p>
      {(mode === "chinese" || mode === "both") && (
        <p className="mt-1 text-sm text-emerald-700">{line.pinyin}</p>
      )}
      {mode === "both" && (
        <p className="mt-2 text-sm leading-6 text-slate-600">{line.mongolian}</p>
      )}
    </>
  );
}

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function LessonWatchClient({ lesson, adminPreview = false }: Props) {
  const [mode, setMode] = useState<SubtitleMode>("both");

  useEffect(() => {
    void markLessonStartedSmart(lesson.id);
  }, [lesson.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-2 sm:gap-8 sm:px-6 md:pb-10">
        {adminPreview ? <AdminPreviewBanner /> : null}
        <Link
          href={lessonPath(lesson.id)}
          className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← Lesson detail руу буцах
        </Link>

        <section>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Watch — {lesson.title} {lesson.chineseTitle}
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Subtitle mode сонгоод, сонсож уншаарай.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              {lesson.videoPlaceholder}
            </p>
          </div>
          <p className="mt-3 text-center text-sm font-medium text-slate-600">
            00:00 / {lesson.watchTotalTime}
          </p>
        </section>

        <section className="rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Practice tip
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Эхлээд Both mode-оор уншаад, дараа нь Chinese mode дээр shadowing
            хийгээрэй.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Subtitle mode</h2>
          <div className="mt-3 flex gap-2">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={
                  mode === item.id
                    ? "flex-1 rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                    : "flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          {lesson.timedSubtitles.map((line, index) => (
            <article
              key={`${line.start}-${line.chinese}`}
              className={
                index === 0
                  ? "rounded-2xl bg-emerald-50/80 p-4 ring-2 ring-emerald-300 sm:p-5"
                  : "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
              }
            >
              <p className="text-xs font-medium text-emerald-700">
                {line.start} – {line.end}
              </p>
              <div className="mt-3">
                <SubtitleLines line={line} mode={mode} />
              </div>
              <button
                type="button"
                className="mt-4 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
                aria-disabled="true"
              >
                Үг хадгалах
              </button>
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={lessonVocabularyPath(lesson.id)}
            className="flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            Vocabulary
          </Link>
          <Link
            href={lessonQuizPath(lesson.id)}
            className="flex-1 rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Quiz
          </Link>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
