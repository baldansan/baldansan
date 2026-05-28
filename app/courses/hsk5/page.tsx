import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { getCourseContentById, getLessonsByCourseId, lessonPath } from "@/lib/content";
import type { LessonContentStatus } from "@/types/lesson-content";

function lessonButtonLabel(status: LessonContentStatus) {
  return status === "available" ? "Start" : "Locked";
}

function statusBadgeLabel(status: LessonContentStatus) {
  return status === "available" ? "Available" : "Locked";
}

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

  const { completed } = course.progress;
  const progressTotal = totalLessons > 0 ? totalLessons : course.progress.total;
  const progressPercent =
    progressTotal > 0 ? Math.round((completed / progressTotal) * 100) : 0;

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

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Таны ахиц</h2>
          <p className="mt-1 text-sm text-slate-600">
            {completed} / {progressTotal} lessons completed
          </p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-700">
            {progressPercent}%
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Хичээлүүд</h2>
          {lessons.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              Хичээл одоогоор байхгүй байна.
            </p>
          ) : (
            lessons.map((lesson) => (
              <article
                key={lesson.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {lesson.title} — {lesson.chineseTitle}
                  </h3>
                  <span
                    className={
                      lesson.status === "available"
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                        : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200"
                    }
                  >
                    {statusBadgeLabel(lesson.status)}
                  </span>
                </div>

                {lesson.subtitle ? (
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {lesson.subtitle}
                  </p>
                ) : null}

                {lesson.description && lesson.description !== lesson.subtitle ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lesson.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                    {lesson.duration}
                  </span>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                    {lesson.vocabularyCount} vocabulary
                  </span>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                    {lesson.quizCount} quiz questions
                  </span>
                </div>

                <div className="mt-4 flex justify-end">
                  {lesson.status === "available" ? (
                    <Link
                      href={lessonPath(lesson.id)}
                      className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                      {lessonButtonLabel(lesson.status)}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-400"
                    >
                      {lessonButtonLabel(lesson.status)}
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
