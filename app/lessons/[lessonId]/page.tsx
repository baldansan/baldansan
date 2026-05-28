import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllLessonIdsSync,
  getLessonById,
  lessonQuizPath,
  lessonVocabularyPath,
  lessonWatchPath,
  coursePath,
} from "@/lib/content";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export function generateStaticParams() {
  return getAllLessonIdsSync().map((lessonId) => ({ lessonId }));
}

export default async function LessonDetailPage({ params }: PageProps) {
  const { lessonId } = await params;
  console.log("[supabase-debug] LessonDetailPage request", { lessonId });

  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  console.log("[supabase-debug] LessonDetailPage rendering", {
    lessonId,
    subtitle: lesson.subtitle,
    subtitlePreviewCount: lesson.subtitlePreview.length,
    timedSubtitlesCount: lesson.timedSubtitles.length,
  });

  const vocabularyPreview = lesson.vocabulary.slice(0, 3);

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
          <Link href="/courses" className="text-slate-600 transition-colors hover:text-emerald-600">
            Courses
          </Link>
          <Link
            href="/lessons/1"
            className={
              lessonId === "1"
                ? "font-medium text-emerald-600"
                : "text-slate-600 transition-colors hover:text-emerald-600"
            }
          >
            Demo
          </Link>
          <a href="#" className="text-slate-600 transition-colors hover:text-emerald-600">
            Profile
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-2 sm:gap-8 sm:px-6">
        <Link
          href={coursePath(lesson.courseId)}
          className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← HSK5 Course руу буцах
        </Link>

        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {lesson.title} — {lesson.chineseTitle}
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600 sm:text-lg">
            {lesson.subtitle}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              {lesson.videoPlaceholder}
            </p>
          </div>
          <div className="mt-4 flex justify-center sm:justify-start">
            <Link
              href={lessonWatchPath(lesson.id)}
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Watch lesson
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Subtitle preview</h2>
          <div className="mt-4 flex flex-col gap-4">
            {lesson.subtitlePreview.map((line) => (
              <div
                key={line.chinese}
                className="rounded-xl bg-emerald-50/50 p-4 ring-1 ring-emerald-100"
              >
                <p className="text-base font-medium text-slate-900">
                  {line.chinese}
                </p>
                <p className="mt-1 text-sm text-emerald-700">{line.pinyin}</p>
                <p className="mt-2 text-sm text-slate-600">{line.mongolian}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Vocabulary preview
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {vocabularyPreview.map((word) => (
              <li
                key={word.id}
                className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-semibold text-slate-900">
                    {word.chinese}{" "}
                    <span className="font-normal text-emerald-700">
                      / {word.pinyin}
                    </span>
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {word.hskLevel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{word.mongolian}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Link
              href={lessonVocabularyPath(lesson.id)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Бүх үгс харах
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Quiz preview</h2>
          <p className="mt-2 text-sm text-slate-600">
            {lesson.quizCount} quiz questions
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {lesson.quizTypes.map((type) => (
              <li
                key={type}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
              >
                {type}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Link
              href={lessonQuizPath(lesson.id)}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Quiz эхлэх
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Таны ахиц</h2>
          <p className="mt-1 text-sm text-slate-600">Lesson status: Not started</p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: "0%" }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-700">Progress: 0%</p>
        </section>
      </main>
    </div>
  );
}
