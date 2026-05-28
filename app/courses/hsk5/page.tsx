import Link from "next/link";
import { getCourseContentById, getLessonsByCourseId, lessonPath } from "@/lib/content";
import type { LessonContentStatus } from "@/types/lesson-content";

function lessonButtonLabel(status: LessonContentStatus) {
  return status === "available" ? "Start" : "Locked";
}

export default async function Hsk5CoursePage() {
  const course = await getCourseContentById("hsk5");
  const lessons = await getLessonsByCourseId("hsk5");

  if (!course) {
    return null;
  }

  const { completed, total } = course.progress;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base"
        >
          Buunduu Surtsgaay
        </Link>
        <nav className="flex items-center gap-3 text-xs sm:gap-5 sm:text-sm">
          <Link href="/courses" className="font-medium text-emerald-600">
            Courses
          </Link>
          <Link href="/lessons/1" className="text-slate-600 transition-colors hover:text-emerald-600">
            Demo
          </Link>
          <a href="#" className="text-slate-600 transition-colors hover:text-emerald-600">
            Profile
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-2 sm:gap-8 sm:px-6">
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

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {course.stats.map((stat) => (
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
            {completed} / {total} lessons completed
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
          {lessons.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {lesson.title} — {lesson.chineseTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {lesson.description}
              </p>

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
          ))}
        </section>
      </main>
    </div>
  );
}
