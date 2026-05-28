import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { coursePath } from "@/lib/content";

export function LessonNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="courses" />

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
