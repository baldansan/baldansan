import Link from "next/link";
import { ActivityDetailView } from "@/components/admin/activity-detail-view";
import { EmptyState } from "@/components/empty-state";
import { getAdminActivityById } from "@/lib/supabase/admin-activity-log";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ activityId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { activityId } = await params;
  return { title: `Activity ${activityId} — Admin` };
}

export default async function AdminActivityDetailPage({ params }: Props) {
  const { activityId } = await params;
  const result = await getAdminActivityById(activityId);

  if (result.warnings.length > 0 && !result.row) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {result.warnings.join(" · ")}
        </div>
        <Link
          href="/admin/activity"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Back to activity log
        </Link>
      </div>
    );
  }

  if (!result.row) {
    return (
      <EmptyState
        title="Activity not found"
        description={`No activity log entry with id "${activityId}".`}
        action={
          <Link
            href="/admin/activity"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Back to activity log
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Activity detail
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Before/after snapshots and field-level diff preview.
        </p>
      </section>
      <ActivityDetailView activity={result.row} />
    </div>
  );
}
