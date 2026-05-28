import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { getCourseContentById, getLessonsByCourseId } from "@/lib/content";
import { Hsk5CourseProgress } from "@/components/hsk5-course-progress";
import { Hsk5LessonList } from "./hsk5-lesson-list";

/** Fetch course and lessons from Supabase on each request when env is configured. */
export const dynamic = "force-dynamic";

export default async function Hsk5CoursePage() {
  const course = await getCourseContentById("hsk5");
  const lessons = await getLessonsByCourseId("hsk5");

  if (!course) {
    return null;
  }

  const totalLessons = lessons.length;
  const totalVocabulary = lessons.reduce((sum, lesson) => sum + lesson.vocabularyCount, 0);
  const totalQuizQuestions = lessons.reduce((sum, lesson) => sum + lesson.quizCount, 0);

  const courseStats = [
    { label: `${totalLessons} lessons` },
    { label: `${totalVocabulary} vocabulary` },
    { label: "Shadowing practice" },
    { label: `${totalQuizQuestions} quiz questions` },
  ];

  const lessonIds = lessons.map((lesson) => lesson.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="courses" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-2 sm:gap-8 sm:px-6 md:pb-10">
        <Link
          href="/courses"
          className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← Courses руу буцах
        </Link>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-medium text-emerald-600">HSK5</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {course.subtitle}
          </p>
        </section>

        <section className="rounded-2xl bg-emerald-50/70 p-5 ring-1 ring-emerald-200 sm:p-6">
          <p className="text-base leading-7 text-slate-800">
            Одоогоор {totalLessons} хичээл, {totalVocabulary} үг,{" "}
            {totalQuizQuestions} quiz асуулт бэлэн байна.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {courseStats.map((stat) => (
            <p
              key={stat.label}
              className="rounded-2xl bg-white px-3 py-3 text-center text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 sm:px-4"
            >
              {stat.label}
            </p>
          ))}
        </section>

        <Hsk5CourseProgress lessonIds={lessonIds} />

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Хичээлүүд</h2>
          <Hsk5LessonList lessons={lessons} />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
