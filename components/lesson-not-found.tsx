import Link from "next/link";
import { coursePath } from "@/lib/content";

export function LessonNotFound() {
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
          <Link
            href="/lessons/1"
            className="text-slate-600 transition-colors hover:text-emerald-600"
          >
            Demo
          </Link>
          <a href="#" className="text-slate-600 transition-colors hover:text-emerald-600">
            Profile
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900">Lesson not found</h1>
          <p className="mt-3 text-sm text-slate-600">
            Энэ хичээл олдсонгүй. Courses хуудас руу буцаж үзнэ үү.
          </p>
          <Link
            href={coursePath("hsk5")}
            className="mt-6 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Back to HSK5 course
          </Link>
        </section>
      </main>
    </div>
  );
}
