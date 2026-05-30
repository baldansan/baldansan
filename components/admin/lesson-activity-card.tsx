"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";
import { fetchAdminActivityLogClient } from "@/lib/supabase/admin-activity-read";

type Props = {
  lessonId: string;
  limit?: number;
  /** Omit outer card chrome when nested inside another section. */
  bare?: boolean;
};

export function LessonActivityCard({ lessonId, limit = 10, bare = false }: Props) {
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchAdminActivityLogClient({ lessonId, limit });
      if (cancelled) return;
      setRows(result.rows);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, limit]);

  const body = (
    <>
      {!bare ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Lesson activity
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {loading
                ? "Activity log ачааллаж байна…"
                : rows.length === 0
                  ? "No activity recorded for this lesson yet."
                  : `Latest ${rows.length} admin action${rows.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <Link
            href={`/admin/activity?lessonId=${encodeURIComponent(lessonId)}`}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:text-sm"
          >
            Full activity log →
          </Link>
        </div>
      ) : (
        <div className="flex justify-end">
          <Link
            href={`/admin/activity?lessonId=${encodeURIComponent(lessonId)}`}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:text-sm"
          >
            Full activity log →
          </Link>
        </div>
      )}

      {!loading ? (
        <div className={bare ? "" : "mt-4"}>
          <ActivityLogList rows={rows} compact />
        </div>
      ) : bare ? (
        <p className="text-sm text-slate-600">Activity log ачааллаж байна…</p>
      ) : null}
    </>
  );

  if (bare) {
    return body;
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      {body}
    </section>
  );
}
