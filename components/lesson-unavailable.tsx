import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { coursePath } from "@/lib/content";
import { lessonPreviewPath } from "@/lib/lesson-publish";

type Props = {
  lessonId: string;
  courseId?: string;
  showAdminLink?: boolean;
  showAdminPreviewLink?: boolean;
  accessDenied?: boolean;
};

export function LessonUnavailable({
  lessonId,
  courseId = "hsk5",
  showAdminLink = false,
  showAdminPreviewLink = false,
  accessDenied = false,
}: Props) {
  return (
    <MobileAppShell activeTab="study" >
      <MobileCard className="mt-6 text-center !py-10">
        <p className="text-sm font-medium text-emerald-600">Хичээл</p>
        <h1 className="mt-2 text-xl font-bold text-[var(--app-text)]">
          {accessDenied
            ? "Хандах эрхгүй"
            : "Энэ хичээл одоогоор нийтлэгдээгүй байна"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
          {accessDenied
            ? "Энэ хичээлийг одоогоор үзэх боломжгүй."
            : "Удахгүй нээгдэх эсвэл өөр хичээл сонгоно уу."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/home" className="app-btn-primary inline-flex justify-center">
            Нүүр хуудас
          </Link>
          <Link
            href={coursePath(courseId)}
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800"
          >
            Курс руу буцах
          </Link>
          {showAdminPreviewLink ? (
            <Link
              href={lessonPreviewPath(lessonId, { adminPreview: true })}
              className="text-xs font-medium text-slate-500 hover:text-emerald-700"
            >
              Admin preview
            </Link>
          ) : null}
          {showAdminLink ? (
            <Link
              href={`/admin/lessons/${lessonId}/edit`}
              className="text-xs font-medium text-slate-500 hover:text-emerald-700"
            >
              Admin edit
            </Link>
          ) : null}
        </div>
      </MobileCard>
    </MobileAppShell>
  );
}
