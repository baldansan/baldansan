import type { ActivityDayRow } from "@/lib/supabase/activity-time-analytics";

type Props = {
  days: ActivityDayRow[];
  title: string;
  emptyMessage: string;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 180;
const BASELINE = CHART_HEIGHT - 24;

function formatDayLabel(day: string): string {
  const parsed = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Inline SVG so the admin keeps its zero-dependency footprint — a charting
 * library would be a lot of JavaScript for one panel.
 */
export function AdminActivityChart({ days, title, emptyMessage }: Props) {
  const hasData = days.some((day) => day.totalMinutes > 0);

  if (!hasData) {
    return (
      <section className="admin-panel p-5">
        <h2 className="admin-section-title">{title}</h2>
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      </section>
    );
  }

  const peak = Math.max(...days.map((day) => day.totalMinutes), 1);
  const slot = CHART_WIDTH / days.length;
  const barWidth = Math.max(Math.min(slot - 4, 26), 3);
  const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);
  const firstDay = days[0]?.day;
  const lastDay = days[days.length - 1]?.day;

  return (
    <section className="admin-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="admin-section-title">{title}</h2>
        <p className="text-xs text-slate-500">
          {firstDay ? formatDayLabel(firstDay) : ""} —{" "}
          {lastDay ? formatDayLabel(lastDay) : ""} · нийт{" "}
          {new Intl.NumberFormat("mn-MN").format(totalMinutes)} минут
        </p>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`${title}: өдөр тутмын суралцсан минут`}
        className="mt-4 h-44 w-full"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1={BASELINE}
          x2={CHART_WIDTH}
          y2={BASELINE}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        {days.map((day, index) => {
          const height = Math.max((day.totalMinutes / peak) * (BASELINE - 8), 0);
          const x = index * slot + (slot - barWidth) / 2;
          return (
            <rect
              key={day.day}
              x={x}
              y={BASELINE - height}
              width={barWidth}
              height={height}
              rx="3"
              fill="#52c900"
              opacity={day.totalMinutes > 0 ? 0.9 : 0.15}
            >
              <title>
                {`${formatDayLabel(day.day)}: ${day.totalMinutes} минут · ${day.learners} суралцагч`}
              </title>
            </rect>
          );
        })}
      </svg>
    </section>
  );
}
