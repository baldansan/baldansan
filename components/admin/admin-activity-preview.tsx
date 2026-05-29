import Link from "next/link";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type {
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/supabase/admin-activity-log";

type Props = {
  summary: AdminActivitySummary;
  recentRows: AdminActivityRow[];
};

export function AdminActivityPreview({ summary, recentRows }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Best-effort audit trail of admin lesson, content, and task actions.
          </p>
        </div>
        <Link
          href="/admin/activity"
          className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          View activity log
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminMetricCard label="Total logged" value={summary.total} />
        <AdminMetricCard label="Today" value={summary.today} accent="emerald" />
        <AdminMetricCard label="Content" value={summary.contentActions} />
        <AdminMetricCard
          label="Publish/release"
          value={summary.publishReleaseActions}
          accent="amber"
        />
      </div>

      <AdminCard
        title="Activity log"
        description={`${summary.today} today · ${summary.taskActions} task actions`}
        href="/admin/activity"
      />

      {recentRows.length > 0 ? (
        <ActivityLogList rows={recentRows} compact />
      ) : (
        <p className="text-sm text-slate-600">
          No activity logged yet — actions will appear after admin workflows run.
        </p>
      )}
    </section>
  );
}
