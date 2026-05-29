"use client";

import { useEffect, useMemo, useState } from "react";
import { activityHasDiffPreview } from "@/lib/admin/admin-activity-diff";
import { summarizeActivityRows } from "@/lib/admin/admin-activity-summary";
import { activityRollbackAvailable } from "@/lib/admin/admin-rollback-eligibility";
import {
  ActivityFilterBar,
  filterActivityRowsClient,
  type ActivityActionFilter,
  type ActivityDateFilter,
  type ActivityDiffFilter,
  type ActivityEntityFilter,
  type ActivityRollbackFilter,
} from "@/components/admin/activity-filter-bar";
import { ActivityExportControls } from "@/components/admin/activity-export-controls";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import { ActivitySummaryCards } from "@/components/admin/activity-summary-cards";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";
import { fetchAdminActivityLogClient } from "@/lib/supabase/admin-activity-read";

type Props = {
  initialLessonId?: string;
};

export function AdminActivityCenter({ initialLessonId = "" }: Props) {
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState<ActivityActionFilter>("all");
  const [entityType, setEntityType] = useState<ActivityEntityFilter>("all");
  const [dateRange, setDateRange] = useState<ActivityDateFilter>("all");
  const [diffFilter, setDiffFilter] = useState<ActivityDiffFilter>("all");
  const [rollbackFilter, setRollbackFilter] =
    useState<ActivityRollbackFilter>("all");
  const [lessonId, setLessonId] = useState(initialLessonId);
  const [actor, setActor] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchAdminActivityLogClient({ limit: 300 });
      if (cancelled) return;
      setRows(result.rows);
      setWarnings(result.warnings);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const actionOptions = useMemo(
    () => [...new Set(rows.map((row) => row.action))].sort(),
    [rows]
  );
  const entityOptions = useMemo(
    () => [...new Set(rows.map((row) => row.entityType))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    let list = rows;
    if (lessonId.trim()) {
      list = list.filter((row) => row.lessonId === lessonId.trim());
    }
    if (dateRange === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      list = list.filter((row) => new Date(row.createdAt) >= start);
    } else if (dateRange === "7d") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      list = list.filter((row) => new Date(row.createdAt) >= start);
    } else if (dateRange === "30d") {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      list = list.filter((row) => new Date(row.createdAt) >= start);
    }
    return filterActivityRowsClient(list, { action, entityType, actor, search }).filter(
      (row) => {
        if (diffFilter === "has_diff") return activityHasDiffPreview(row);
        if (diffFilter === "no_diff") return !activityHasDiffPreview(row);
        if (rollbackFilter === "available") return activityRollbackAvailable(row);
        if (rollbackFilter === "unsupported") {
          return !activityRollbackAvailable(row);
        }
        return true;
      }
    );
  }, [
    rows,
    lessonId,
    dateRange,
    action,
    entityType,
    actor,
    search,
    diffFilter,
    rollbackFilter,
  ]);

  const loadedSummary = useMemo(() => summarizeActivityRows(rows), [rows]);
  const displaySummary = useMemo(
    () => summarizeActivityRows(filteredRows),
    [filteredRows]
  );

  return (
    <div className="flex flex-col gap-6">
      {warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Activity log notes</p>
          <ul className="mt-2 list-inside list-disc">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
          Activity log ачааллаж байна…
        </p>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <div className="mt-3">
          <ActivitySummaryCards summary={loadedSummary} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Loaded {loadedSummary.total} total · showing {displaySummary.total}{" "}
          after filters.
        </p>
      </section>

      {!loading ? <ActivityExportControls rows={filteredRows} /> : null}

      <ActivityFilterBar
        action={action}
        entityType={entityType}
        dateRange={dateRange}
        diffFilter={diffFilter}
        rollbackFilter={rollbackFilter}
        lessonId={lessonId}
        actor={actor}
        search={search}
        actionOptions={actionOptions}
        entityOptions={entityOptions}
        onActionChange={setAction}
        onEntityTypeChange={setEntityType}
        onDateRangeChange={setDateRange}
        onDiffFilterChange={setDiffFilter}
        onRollbackFilterChange={setRollbackFilter}
        onLessonIdChange={setLessonId}
        onActorChange={setActor}
        onSearchChange={setSearch}
        resultCount={loading ? 0 : filteredRows.length}
      />

      {!loading ? <ActivityLogList rows={filteredRows} /> : null}
    </div>
  );
}
