import Link from "next/link";
import { CoursesHsk5Progress } from "@/components/courses-hsk5-progress";
import { PublicPageShell } from "@/components/public-page-shell";
import { ctaPrimaryClass, ctaOutlineClass } from "@/components/ui/cta-button-row";
import { courses } from "@/data/courses";
import { getPublicLessonsByCourseId } from "@/lib/content";
import type { Course } from "@/types/course";

function statusLabel(status: Course["status"]) {
  return status === "available" ? "Бэлэн" : "Удахгүй";
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Хичээлүүд — Бөөндөө Сурцгаая",
  description: "Сурах чиглэлээ сонго — HSK4, HSK5, Taobao Chinese.",
};

export default async function CoursesPage() {
  const hsk5Lessons = await getPublicLessonsByCourseId("hsk5");
  const hsk5LessonIds = hsk5Lessons.map((lesson) => lesson.id);

  return (
    <PublicPageShell active="courses">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          Сурах чиглэлээ сонго
        </h1>
        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          HSK болон практик Хятад хэлийн курсууд
        </p>
      </section>

      {courses.length === 0 ? (
        <section className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200 sm:rounded-3xl">
          <p className="text-slate-600">Одоогоор курс байхгүй байна.</p>
          <Link href="/onboarding" className={`mt-4 ${ctaPrimaryClass}`}>
            App заавар үзэх
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
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
                  {course.id === "hsk5"
                    ? `${hsk5Lessons.length} хичээл`
                    : `${course.lessons} хичээл`}
                </span>
                <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                  {course.vocabulary} үг
                </span>
              </div>

              {course.id === "hsk5" ? (
                <CoursesHsk5Progress lessonIds={hsk5LessonIds} />
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
                  <Link href={course.href} className={ctaPrimaryClass}>
                    Хичээлүүд үзэх
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="min-h-[44px] cursor-not-allowed rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
                  >
                    Удахгүй
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:rounded-3xl">
        <h2 className="font-semibold text-slate-900">Анх удаа?</h2>
        <p className="mt-2 text-sm text-slate-600">
          App хэрхэн ажилладагийг заавраас үзнэ үү.
        </p>
        <Link href="/onboarding" className={`mt-3 ${ctaOutlineClass}`}>
          Заавар үзэх →
        </Link>
      </section>
    </PublicPageShell>
  );
}
