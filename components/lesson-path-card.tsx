"use client";

import Link from "next/link";
import { WatchLessonLink } from "@/components/watch-lesson-link";
import { lessonPreviewPath } from "@/lib/lesson-publish";

type Props = {
  lessonId: string;
  adminPreview?: boolean;
};

const stepLinkClass =
  "flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100";

export function LessonPathCard({ lessonId, adminPreview = false }: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900">Lesson path</h2>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <li className="flex-1">
          <WatchLessonLink
            lessonId={lessonId}
            adminPreview={adminPreview}
            className={stepLinkClass}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              1
            </span>
            Watch
          </WatchLessonLink>
        </li>
        <li className="flex-1">
          <Link
            href={lessonPreviewPath(lessonId, {
              adminPreview,
              subpath: "vocabulary",
            })}
            className={stepLinkClass}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              2
            </span>
            Vocabulary
          </Link>
        </li>
        <li className="flex-1">
          <Link
            href={lessonPreviewPath(lessonId, {
              adminPreview,
              subpath: "quiz",
            })}
            className={stepLinkClass}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              3
            </span>
            Quiz
          </Link>
        </li>
      </ol>
    </section>
  );
}
