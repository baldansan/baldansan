import { getActivityDiff } from "@/lib/admin/admin-activity-diff";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

type Props = {
  activity: AdminActivityRow;
};

export function RollbackPreviewCard({ activity }: Props) {
  const diff = getActivityDiff(activity);
  const rollbackFields = [
    ...diff.changed.map((row) => row.field),
    ...diff.removed.map((row) => row.field),
  ];

  return (
    <section className="rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-200 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">Rollback preview</h3>
      <p className="mt-2 text-sm text-slate-700">
        Rollback execution хараахан идэвхгүй. Энэ хэсэг rollback хийхэд ямар
        өгөгдөл сэргээгдэхийг урьдчилж харуулна.
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Entity</dt>
          <dd className="font-medium text-slate-900">
            {activity.entityType}
            {activity.entityId ? ` · ${activity.entityId}` : ""}
          </dd>
        </div>
        {activity.lessonId ? (
          <div>
            <dt className="text-slate-500">Lesson</dt>
            <dd className="font-mono text-slate-900">{activity.lessonId}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Fields that would be restored</dt>
          <dd className="mt-1 text-slate-900">
            {rollbackFields.length > 0
              ? rollbackFields.join(", ")
              : "No rollback fields identified from snapshots."}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500"
        >
          Rollback — coming soon
        </button>
      </div>
    </section>
  );
}
