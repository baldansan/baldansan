import Link from "next/link";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type {
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/admin/admin-activity-shared";

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
            Сүүлийн үйлдлүүд
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Хичээл, контент, ажлын үйлдлийн бүртгэл.
          </p>
        </div>
        <Link
          href="/admin/activity"
          className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Үйлдлийн бүртгэл харах
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminMetricCard label="Нийт бүртгэл" value={summary.total} />
        <AdminMetricCard label="Өнөөдөр" value={summary.today} accent="emerald" />
        <AdminMetricCard label="Контент" value={summary.contentActions} />
        <AdminMetricCard
          label="Буцаах боломжтой"
          value={summary.rollbackAvailable}
          accent="emerald"
        />
      </div>

      <AdminCard
        title="Үйлдлийн бүртгэл"
        description={`Өнөөдөр ${summary.today} · ажлын үйлдэл ${summary.taskActions}`}
        href="/admin/activity"
      />

      {recentRows.length > 0 ? (
        <ActivityLogList rows={recentRows} compact />
      ) : (
        <p className="text-sm text-slate-600">
          Одоогоор бүртгэл алга — үйлдэл хийсний дараа энд харагдана.
        </p>
      )}
    </section>
  );
}
