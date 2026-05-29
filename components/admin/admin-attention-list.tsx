import Link from "next/link";
import type { AttentionLesson } from "@/lib/supabase/admin-analytics";

type Props = {
  items: AttentionLesson[];
  emptyMessage?: string;
};

export function AdminAttentionList({
  items,
  emptyMessage = "All lessons look good — no urgent issues.",
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-50/60 px-4 py-6 text-sm text-emerald-800 ring-1 ring-emerald-100">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
      {items.map((item) => (
        <li
          key={item.lessonId}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium text-slate-900">
              <span className="font-mono text-xs text-slate-500">
                {item.lessonId}
              </span>{" "}
              · {item.title}
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {item.issues.join(" · ")}
            </p>
          </div>
          <Link
            href={`/admin/lessons/${item.lessonId}/edit`}
            className="shrink-0 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Edit →
          </Link>
        </li>
      ))}
    </ul>
  );
}
