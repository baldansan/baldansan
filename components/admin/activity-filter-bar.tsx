"use client";

export type ActivityActionFilter = "all" | string;
export type ActivityEntityFilter = "all" | string;
export type ActivityDateFilter = "all" | "today" | "7d" | "30d";
export type ActivityDiffFilter = "all" | "has_diff" | "no_diff";
export type ActivityRollbackFilter = "all" | "available" | "unsupported";

type Props = {
  action: ActivityActionFilter;
  entityType: ActivityEntityFilter;
  dateRange: ActivityDateFilter;
  diffFilter: ActivityDiffFilter;
  rollbackFilter: ActivityRollbackFilter;
  lessonId: string;
  actor: string;
  search: string;
  actionOptions: string[];
  entityOptions: string[];
  onActionChange: (value: ActivityActionFilter) => void;
  onEntityTypeChange: (value: ActivityEntityFilter) => void;
  onDateRangeChange: (value: ActivityDateFilter) => void;
  onDiffFilterChange: (value: ActivityDiffFilter) => void;
  onRollbackFilterChange: (value: ActivityRollbackFilter) => void;
  onLessonIdChange: (value: string) => void;
  onActorChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  resultCount: number;
};

export function ActivityFilterBar({
  action,
  entityType,
  dateRange,
  diffFilter,
  rollbackFilter,
  lessonId,
  actor,
  search,
  actionOptions,
  entityOptions,
  onActionChange,
  onEntityTypeChange,
  onDateRangeChange,
  onDiffFilterChange,
  onRollbackFilterChange,
  onLessonIdChange,
  onActorChange,
  onSearchChange,
  resultCount,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="activity-search"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Search
          </label>
          <input
            id="activity-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Title, description, action…"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="activity-action"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Action
            </label>
            <select
              id="activity-action"
              value={action}
              onChange={(e) => onActionChange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              {actionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-entity"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Entity type
            </label>
            <select
              id="activity-entity"
              value={entityType}
              onChange={(e) => onEntityTypeChange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              {entityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-date"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Date range
            </label>
            <select
              id="activity-date"
              value={dateRange}
              onChange={(e) =>
                onDateRangeChange(e.target.value as ActivityDateFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-diff"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Diff
            </label>
            <select
              id="activity-diff"
              value={diffFilter}
              onChange={(e) =>
                onDiffFilterChange(e.target.value as ActivityDiffFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="has_diff">Has diff</option>
              <option value="no_diff">No diff</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-rollback"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Rollback
            </label>
            <select
              id="activity-rollback"
              value={rollbackFilter}
              onChange={(e) =>
                onRollbackFilterChange(e.target.value as ActivityRollbackFilter)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="available">Rollback available</option>
              <option value="unsupported">Unsupported</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-lesson"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Lesson ID
            </label>
            <input
              id="activity-lesson"
              value={lessonId}
              onChange={(e) => onLessonIdChange(e.target.value)}
              placeholder="e.g. 5"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="activity-actor"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Actor (email contains)
            </label>
            <input
              id="activity-actor"
              value={actor}
              onChange={(e) => onActorChange(e.target.value)}
              placeholder="admin@…"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Showing {resultCount} event{resultCount === 1 ? "" : "s"}
        </p>
      </div>
    </section>
  );
}

export function filterActivityRowsClient<
  T extends {
    action: string;
    entityType: string;
    lessonId: string | null;
    actorEmail: string | null;
    title: string;
    description: string | null;
  },
>(
  rows: T[],
  options: {
    action: ActivityActionFilter;
    entityType: ActivityEntityFilter;
    actor: string;
    search: string;
  }
): T[] {
  const actorQuery = options.actor.trim().toLowerCase();
  const searchQuery = options.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (options.action !== "all" && row.action !== options.action) return false;
    if (options.entityType !== "all" && row.entityType !== options.entityType) {
      return false;
    }
    if (actorQuery && !(row.actorEmail ?? "").toLowerCase().includes(actorQuery)) {
      return false;
    }
    if (!searchQuery) return true;
    const haystack = [row.title, row.description ?? "", row.action]
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchQuery);
  });
}
