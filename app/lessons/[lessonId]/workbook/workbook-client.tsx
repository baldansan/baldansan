"use client";

import Link from "next/link";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { HSK_PLAYER } from "@/lib/lesson/hsk-player/hsk-player-theme";
import type { HskWorkbookSection } from "@/lib/lesson/hsk1-l01-v13/workbook";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  sections: HskWorkbookSection[];
  adminPreview?: boolean;
};

function WorkbookAudioPlayer({ section }: { section: HskWorkbookSection }) {
  const audio = section.audio;
  if (!audio?.url && !audio?.file) return null;

  const src = audio.url ?? audio.file;
  if (!src) return null;

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-xs font-semibold text-slate-600">🔊 Сонсох дасгал</p>
      <audio controls className="mt-2 w-full" src={src} preload="none">
        <track kind="captions" />
      </audio>
      {audio.note ? (
        <p className="mt-1 text-[11px] text-slate-500">{audio.note}</p>
      ) : null}
    </div>
  );
}

export function LessonWorkbookClient({ lesson, sections, adminPreview = false }: Props) {
  const watchHref = lessonPreviewPath(lesson.id, { adminPreview, subpath: "watch" });

  return (
    <MobileAppShell showBottomNav={false}>
      {adminPreview ? <AdminPreviewBanner /> : null}
      <div className="flex flex-col gap-4">
        <Link
          href={watchHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Хичээл рүү буцах
        </Link>
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {lesson.chineseTitle || lesson.title}
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Workbook дасгал</h1>
          <p className="mt-1 text-sm text-slate-600">
            Номын дасгал — {sections.length} хэсэг
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <article
              key={section.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: HSK_PLAYER.primary }}
                >
                  {section.sectionLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900">{section.titleMn}</h2>
                  {section.titleZh ? (
                    <p className="text-sm text-slate-500">{section.titleZh}</p>
                  ) : null}
                  {section.instructionsMn ? (
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {section.instructionsMn}
                    </p>
                  ) : null}
                </div>
              </div>

              {section.pageImageUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={section.pageImageUrl}
                    alt={`Workbook ${section.sectionLabel}`}
                    className="w-full object-contain"
                  />
                </div>
              ) : null}

              <WorkbookAudioPlayer section={section} />

              {adminPreview && section.answerKey ? (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                  <p className="text-xs font-semibold text-amber-800">Хариулт (админ)</p>
                  <p className="mt-1 text-sm text-amber-950">
                    {Array.isArray(section.answerKey)
                      ? section.answerKey.join(" · ")
                      : section.answerKey}
                  </p>
                  {section.sourceRef ? (
                    <p className="mt-1 text-[11px] text-amber-700">{section.sourceRef}</p>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <Link href={watchHref} className="app-btn-outline-green w-full text-center">
          Хичээл рүү буцах
        </Link>
      </div>
    </MobileAppShell>
  );
}
