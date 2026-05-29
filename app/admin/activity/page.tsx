import { AdminActivityCenter } from "@/components/admin/admin-activity-center";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin activity — Buunduu Surtsgaay",
};

type Props = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function AdminActivityPage({ searchParams }: Props) {
  const { lessonId } = await searchParams;

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

      <AdminActivityCenter initialLessonId={lessonId ?? ""} />
    </div>
  );
}
