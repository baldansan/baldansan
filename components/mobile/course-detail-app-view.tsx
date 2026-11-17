"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { CourseLessonList } from "@/app/courses/hsk5/hsk5-lesson-list";
import { courseCardAccentClass } from "@/lib/course-display";
import { Hsk1PronunciationIntroCard } from "@/components/mobile/hsk1-pronunciation-intro-card";

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
  return (
    <MobileAppShell activeTab="books">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        ← Ном
      </Link>

      <div
        className={`app-course-card app-course-card-premium mb-4 p-4 ${courseCardAccentClass(courseId)}`}
      >
        <h1 className="text-xl font-extrabold leading-snug">{title}</h1>
        <p className="mt-1 text-sm leading-5 text-white/90">{subtitle}</p>
        <p className="mt-2 text-sm font-bold text-white/95">
          {lessons.length} хичээл · {totalVocabulary} үг
        </p>
      </div>

      {courseId === "hsk1" ? <Hsk1PronunciationIntroCard /> : null}

      <section>
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
