import Link from "next/link";
import { AdminActivityCenter } from "@/components/admin/admin-activity-center";
import { getAdminActivityLog } from "@/lib/supabase/admin-activity-log";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin activity — Buunduu Surtsgaay",
};

type Props = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function AdminActivityPage({ searchParams }: Props) {
  const { lessonId } = await searchParams;
  const data = await getAdminActivityLog({
    lessonId: lessonId?.trim() || undefined,
    limit: 300,
  });

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Admin activity
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Admin хэрэглэгчдийн хийсэн lesson, content, publish, task
          өөрчлөлтийн түүх.
        </p>
        {lessonId ? (
          <p className="mt-2 text-xs font-medium text-emerald-800">
            Filtered for lesson {lessonId}
          </p>
        ) : null}
      </section>

      <AdminActivityCenter
        rows={data.rows}
        summary={data.summary}
        warnings={data.warnings}
        initialLessonId={lessonId ?? ""}
      />
    </div>
  );
}
