import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { CoursesHsk5Progress } from "@/components/courses-hsk5-progress";
import { courses } from "@/data/courses";
import { getLessonsByCourseId } from "@/lib/content";
import type { Course } from "@/types/course";

function statusLabel(status: Course["status"]) {
  return status === "available" ? "Available" : "Coming soon";
}

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const hsk5Lessons = await getLessonsByCourseId("hsk5");
  const hsk5LessonIds = hsk5Lessons.map((lesson) => lesson.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="courses" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-2 sm:gap-8 sm:px-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Courses</h1>
          <p className="mt-2 text-base text-slate-600 sm:text-lg">
            Сурах чиглэлээ сонго
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold leading-snug text-slate-900">
                  {course.title}
                </h2>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  {course.level}
                </span>
              </div>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                {course.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                  {course.lessons} lessons
                </span>
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                  {course.vocabulary} vocabulary
                </span>
              </div>

              {course.id === "hsk5" ? (
                <CoursesHsk5Progress lessonIds={hsk5LessonIds} />
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={
                    course.status === "available"
                      ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                      : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                  }
                >
                  {statusLabel(course.status)}
                </span>

                {course.status === "available" && course.href ? (
                  <Link
                    href={course.href}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    Хичээлүүд үзэх
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
                  >
                    Хичээлүүд үзэх
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
