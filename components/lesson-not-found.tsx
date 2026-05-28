import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { EmptyState } from "@/components/empty-state";
import { coursePath } from "@/lib/content";

export function LessonNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="courses" />

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-16 pb-24 sm:px-6 md:pb-16">
        <EmptyState
          title="Lesson not found"
          description="Энэ хичээл олдсонгүй эсвэл одоогоор бэлэн биш байна. HSK5 курс эсвэл Courses хуудас руу буцаж үзнэ үү."
          action={
            <>
              <Link
                href={coursePath("hsk5")}
                className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Back to HSK5 course
              </Link>
              <Link
                href="/courses"
                className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Back to Courses
              </Link>
            </>
          }
        />
      </main>

      <BottomNav />
    </div>
  );
}
