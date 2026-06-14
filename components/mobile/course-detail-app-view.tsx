"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { CourseLessonList } from "@/app/courses/hsk5/hsk5-lesson-list";
import { courseCardAccentClass, courseChipBadge } from "@/lib/course-display";

type Props = {
  courseId: string;
  title: string;
  subtitle: string;
  lessons: import("@/types/lesson-content").LessonContent[];
  backHref?: string;
};

export function CourseDetailAppView({
  courseId,
  title,
  subtitle,
  lessons,
  backHref = "/courses",
}: Props) {
  const totalVocabulary = lessons.reduce(
    (sum, lesson) => sum + lesson.vocabularyCount,
    0
  );
  const totalQuizQuestions = lessons.reduce(
    (sum, lesson) => sum + lesson.quizCount,
    0
  );

  return (
    <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[390px]">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        ← Хичээлүүд рүү буцах
      </Link>

      <div
        className={`app-course-card app-course-card-premium mb-4 p-4 ${courseCardAccentClass(courseId)}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">
          {courseChipBadge(courseId)}
        </p>
        <h1 className="mt-0.5 text-lg font-bold leading-snug">{title}</h1>
        <p className="mt-1 text-xs leading-5 text-white/90">{subtitle}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {lessons.length} хичээл
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {totalVocabulary} үг
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {totalQuizQuestions} quiz
          </span>
        </div>
      </div>

      <section>
        <MobilePageHeader title="Хичээлийн жагсаалт" />
        {lessons.length === 0 ? (
          <MobileCard className="text-center">
            <p className="text-sm text-[var(--app-muted)]">
              Одоогоор хичээл алга. Import ZIP-ээр нэмнэ үү.
            </p>
          </MobileCard>
        ) : (
          <CourseLessonList lessons={lessons} />
        )}
      </section>
    </MobileAppShell>
  );
}
