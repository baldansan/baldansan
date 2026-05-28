import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { coursePath } from "@/lib/content";

type Props = {
  lessonId: string;
  courseId?: string;
  showAdminLink?: boolean;
};

export function LessonUnavailable({
  lessonId,
  courseId = "hsk5",
  showAdminLink = false,
}: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 pb-24 pt-8 text-center sm:px-6 md:pb-10">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <p className="text-sm font-medium text-emerald-600">Хичээл</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Энэ хичээл одоогоор нийтлэгдээгүй байна
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Хичээл draft эсвэл archived төлөвтэй байж магадгүй.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={coursePath(courseId)}
              className="inline-flex justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Back to course
            </Link>
            {showAdminLink ? (
              <Link
                href={`/admin/lessons/${lessonId}/edit`}
                className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                Open in admin
              </Link>
            ) : null}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
