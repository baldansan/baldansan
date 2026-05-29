import Link from "next/link";
import { ActivityDiffViewer } from "@/components/admin/activity-diff-viewer";
import {
  ActivityBadge,
  EntityTypeBadge,
  formatActivityTime,
} from "@/components/admin/activity-badge";
import { JsonSnapshotViewer } from "@/components/admin/json-snapshot-viewer";
import { RollbackExecutionCard } from "@/components/admin/rollback-execution-card";
import { formatActivityActor } from "@/lib/admin/admin-activity-shared";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

type Props = {
  activity: AdminActivityRow;
};

export function ActivityDetailView({ activity }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <ActivityBadge action={activity.action} />
          <EntityTypeBadge entityType={activity.entityType} />
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {activity.title}
        </h1>
        {activity.description ? (
          <p className="mt-2 text-sm text-slate-600">{activity.description}</p>
        ) : null}

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Actor</dt>
            <dd className="text-slate-900">{formatActivityActor(activity)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Timestamp</dt>
            <dd className="text-slate-900">
              {formatActivityTime(activity.createdAt)}
            </dd>
          </div>
          {activity.entityId ? (
            <div>
              <dt className="text-slate-500">Entity ID</dt>
              <dd className="font-mono text-slate-900">{activity.entityId}</dd>
            </div>
          ) : null}
          {activity.lessonId ? (
            <div>
              <dt className="text-slate-500">Lesson ID</dt>
              <dd className="font-mono text-slate-900">{activity.lessonId}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <JsonSnapshotViewer
        title="Activity metadata"
        data={
          Object.keys(activity.metadata).length > 0 ? activity.metadata : null
        }
        emptyLabel="No metadata recorded."
      />

      <JsonSnapshotViewer
        title="Before snapshot"
        data={activity.beforeSnapshot}
      />
      <JsonSnapshotViewer title="After snapshot" data={activity.afterSnapshot} />

      <ActivityDiffViewer activity={activity} />
      <RollbackExecutionCard activity={activity} />

      <section className="flex flex-wrap gap-2">
        <Link
          href="/admin/activity"
          className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          ← Back to activity log
        </Link>
        {activity.lessonId ? (
          <Link
            href={`/admin/lessons/${activity.lessonId}/edit`}
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Open lesson edit
          </Link>
        ) : null}
        <Link
          href="/admin"
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          Admin dashboard
        </Link>
      </section>
    </div>
  );
}
