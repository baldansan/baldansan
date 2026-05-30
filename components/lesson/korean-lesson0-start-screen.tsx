import Link from "next/link";
import { MobileCard } from "@/components/mobile/mobile-card";
import { lessonTrainingPath } from "@/lib/content";
import {
  isKoreanLesson0BeginnerFlow,
  KOREAN_LESSON0_DISPLAY_SUBTITLE,
  KOREAN_LESSON0_DISPLAY_TITLE,
  KOREAN_LESSON0_INTRO,
} from "@/lib/lesson/korean-lesson0-flow";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function KoreanLesson0StartScreen({ lesson, adminPreview = false }: Props) {
  if (!isKoreanLesson0BeginnerFlow(lesson)) {
    return null;
  }

  const trainingHref = lessonTrainingPath(lesson.id, { preview: adminPreview });
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  const vocabCount = lesson.vocabulary.length || lesson.vocabularyCount;
  const quizCount = lesson.quizQuestions.length || lesson.quizCount;
  const imageCount = lesson.teachingImages?.length ?? 0;

  return (
    <MobileCard padding="lg" className="overflow-hidden">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
        KR-Beginner · Үсэг сурах
      </p>
      <h1 className="mt-2 text-xl font-bold leading-snug text-[var(--app-text)]">
        {KOREAN_LESSON0_DISPLAY_TITLE}
      </h1>
      <p className="mt-1 text-base font-medium text-emerald-700">
        {KOREAN_LESSON0_DISPLAY_SUBTITLE}
      </p>
      <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
        {lesson.description?.trim() || KOREAN_LESSON0_INTRO}
      </p>

      <ul className="mt-5 grid grid-cols-3 gap-2 text-center">
        <li className="rounded-xl bg-slate-50 px-2 py-3 ring-1 ring-slate-200">
          <p className="text-lg font-bold text-slate-900">{vocabCount}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-600">
            үсэг/үг
          </p>
        </li>
        <li className="rounded-xl bg-slate-50 px-2 py-3 ring-1 ring-slate-200">
          <p className="text-lg font-bold text-slate-900">{quizCount}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-600">quiz</p>
        </li>
        <li className="rounded-xl bg-slate-50 px-2 py-3 ring-1 ring-slate-200">
          <p className="text-lg font-bold text-slate-900">{imageCount || 6}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-600">
            зурагтай
          </p>
        </li>
      </ul>

      <Link href={trainingHref} className="app-btn-primary mt-6 w-full">
        ▶ Хичээл эхлэх
      </Link>

      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-center">
        <Link
          href={vocabHref}
          className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline"
        >
          Үгийн сан харах
        </Link>
        <Link
          href={quizHref}
          className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline"
        >
          Quiz шууд өгөх
        </Link>
      </div>
    </MobileCard>
  );
}
