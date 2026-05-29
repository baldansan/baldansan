"use client";

import { useMemo, useState } from "react";
import {
  ActivityFilterBar,
  filterActivityRowsClient,
  type ActivityActionFilter,
  type ActivityDateFilter,
  type ActivityEntityFilter,
} from "@/components/admin/activity-filter-bar";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import { ActivitySummaryCards } from "@/components/admin/activity-summary-cards";
import type {
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/admin/admin-activity-shared";

type Props = {
  rows: AdminActivityRow[];
  summary: AdminActivitySummary;
  warnings: string[];
  initialLessonId?: string;
};

export function AdminActivityCenter({
  rows,
  summary,
  warnings,
  initialLessonId = "",
}: Props) {
  const [action, setAction] = useState<ActivityActionFilter>("all");
  const [entityType, setEntityType] = useState<ActivityEntityFilter>("all");
  const [dateRange, setDateRange] = useState<ActivityDateFilter>("all");
  const [lessonId, setLessonId] = useState(initialLessonId);
  const [actor, setActor] = useState("");
  const [search, setSearch] = useState("");

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
    return filterActivityRowsClient(list, { action, entityType, actor, search });
  }, [rows, lessonId, dateRange, action, entityType, actor, search]);

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

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <div className="mt-3">
          <ActivitySummaryCards summary={summary} />
        </div>
      </section>

      <ActivityFilterBar
        action={action}
        entityType={entityType}
        dateRange={dateRange}
        lessonId={lessonId}
        actor={actor}
        search={search}
        actionOptions={actionOptions}
        entityOptions={entityOptions}
        onActionChange={setAction}
        onEntityTypeChange={setEntityType}
        onDateRangeChange={setDateRange}
        onLessonIdChange={setLessonId}
        onActorChange={setActor}
        onSearchChange={setSearch}
        resultCount={filteredRows.length}
      />

      <ActivityLogList rows={filteredRows} />
    </div>
  );
}
