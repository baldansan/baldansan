import Link from "next/link";
import { lesson1Detail } from "@/data/lessons";

export default function Lesson1Page() {
  const lesson = lesson1Detail;

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
          <Link href="/lessons/1" className="font-medium text-emerald-600">
            Demo
          </Link>
          <a href="#" className="text-slate-600 transition-colors hover:text-emerald-600">
            Profile
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-2 sm:gap-8 sm:px-6">
        <Link
          href={lesson.backHref}
          className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← HSK5 Course руу буцах
        </Link>

        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {lesson.title}
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
              href={lesson.watchHref}
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Watch lesson
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Subtitle preview</h2>
          <div className="mt-4 flex flex-col gap-4">
            {lesson.subtitles.map((line, index) => (
              <div
                key={index}
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
            {lesson.vocabulary.map((word) => (
              <li
                key={word.chinese}
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
                    {word.level}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{word.mongolian}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Link
              href={lesson.vocabularyHref}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Бүх үгс харах
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Quiz preview</h2>
          <p className="mt-2 text-sm text-slate-600">
            {lesson.quiz.questionCount} quiz questions
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {lesson.quiz.types.map((type) => (
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
              href={lesson.quizHref}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Quiz эхлэх
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Таны ахиц</h2>
          <p className="mt-1 text-sm text-slate-600">
            Lesson status: {lesson.progress.status}
          </p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${lesson.progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-700">
            Progress: {lesson.progress.percent}%
          </p>
        </section>
      </main>
    </div>
  );
}
