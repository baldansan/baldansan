"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityDetailView } from "@/components/admin/activity-detail-view";
import { EmptyState } from "@/components/empty-state";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";
import { fetchAdminActivityByIdClient } from "@/lib/supabase/admin-activity-read";

type Props = {
  activityId: string;
};

export function ActivityDetailLoader({ activityId }: Props) {
  const [activity, setActivity] = useState<AdminActivityRow | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchAdminActivityByIdClient(activityId);
      if (cancelled) return;
      setActivity(result.row);
      setWarnings(result.warnings);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (loading) {
    return (
      <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
        Activity detail ачааллаж байна…
      </p>
    );
  }

  if (warnings.length > 0 && !activity) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {warnings.join(" · ")}
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

  if (!activity) {
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

  return <ActivityDetailView activity={activity} />;
}
