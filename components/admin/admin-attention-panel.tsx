import Link from "next/link";

export type AttentionItem = {
  count: number;
  label: string;
  description: string;
  href: string;
};

type Props = {
  items: AttentionItem[];
};

/**
 * The "what needs a person" panel: every row carries its own count, so a zero
 * reads as "nothing to do here" rather than disappearing.
 */
export function AdminAttentionPanel({ items }: Props) {
  const outstanding = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="admin-panel p-5" aria-labelledby="attention-heading">
      <h2
        id="attention-heading"
        className="flex items-center gap-2 text-base font-bold text-slate-900"
      >
        <span aria-hidden>📋</span> Таны анхаарал хэрэгтэй
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {outstanding > 0
          ? `${new Intl.NumberFormat("mn-MN").format(outstanding)} зүйл хүн хүлээж байна.`
          : "Одоогоор хүлээгдэж буй зүйл алга."}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const idle = item.count === 0;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                idle
                  ? "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                  : "border-amber-200 bg-amber-50/70 hover:border-amber-300"
              }`}
            >
              <span
                className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-1.5 text-sm font-bold ${
                  idle
                    ? "bg-slate-200 text-slate-500"
                    : "bg-amber-200 text-amber-900"
                }`}
              >
                {item.count}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${idle ? "text-slate-500" : "text-slate-900"}`}
                >
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
