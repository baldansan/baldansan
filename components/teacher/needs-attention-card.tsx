import type { NeedsAttentionItem } from "@/lib/teacher/analytics-types";

type Props = {
  items: NeedsAttentionItem[];
};

export function NeedsAttentionCard({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
        No urgent items — class is on track.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li
          key={`${item.kind}-${item.label}-${i}`}
          className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-medium">{item.label}</span>
          {item.detail ? (
            <span className="text-amber-800"> — {item.detail}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
