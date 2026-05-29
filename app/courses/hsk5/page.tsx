import Link from "next/link";
import { Hsk5ContinueLearning } from "@/components/hsk5-continue-learning";
import { Hsk5ExtendedProgress } from "@/components/hsk5-extended-progress";
import { Hsk5MobileExtras } from "@/components/hsk5-mobile-extras";
import { PublicPageShell } from "@/components/public-page-shell";
import { getCourseContentById, getPublicLessonsByCourseId } from "@/lib/content";
import { Hsk5LessonList } from "./hsk5-lesson-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK5 — Бөөндөө Сурцгаая",
  description: "HSK5 Short Drama Chinese — хичээлийн жагсаалт, ахиц.",
};

export default async function Hsk5CoursePage() {
  const course = await getCourseContentById("hsk5");
  const lessons = await getPublicLessonsByCourseId("hsk5");

  if (!course) {
    return null;
  }

  const totalLessons = lessons.length;
  const totalVocabulary = lessons.reduce(
    (sum, lesson) => sum + lesson.vocabularyCount,
    0
  );
  const totalQuizQuestions = lessons.reduce(
    (sum, lesson) => sum + lesson.quizCount,
    0
  );

  const lessonIds = lessons.map((lesson) => lesson.id);

  return (
    <PublicPageShell active="courses">
      <Link
        href="/courses"
        className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
      >
        ← Хичээлүүд рүү буцах
      </Link>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-medium text-emerald-600">HSK5</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-4xl">
          {course.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {course.subtitle}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
            {totalLessons} хичээл
          </span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
            {totalVocabulary} үг
          </span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
            {totalQuizQuestions} quiz асуулт
          </span>
        </div>
      </section>

      <Hsk5ContinueLearning lessonIds={lessonIds} />
      <Hsk5ExtendedProgress lessonIds={lessonIds} />
      <Hsk5MobileExtras lessonIds={lessonIds} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Хичээлийн жагсаалт</h2>
        <Hsk5LessonList lessons={lessons} />
      </section>
    </PublicPageShell>
  );
}
