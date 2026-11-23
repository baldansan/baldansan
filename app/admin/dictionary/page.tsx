import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DICT_STATUS_LABEL, type DictStatus } from "@/lib/dictionary/types";
import { getDictionaryCounts, getDictionaryQueue } from "@/lib/supabase/dictionary-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Толь бичиг — хянах самбар",
};

const LEVELS = ["1", "2", "3", "4", "5", "6", "7-9"];
const STATUS_FILTERS: { v: DictStatus | "none" | "all"; mn: string }[] = [
  { v: "draft", mn: "Ноорог (AI)" },
  { v: "reviewed", mn: "Хянасан" },
  { v: "approved", mn: "Батлагдсан" },
  { v: "none", mn: "Бичилтгүй" },
  { v: "all", mn: "Бүгд" },
];

type SP = { level?: string; status?: string; q?: string };

function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0;
}

export default async function AdminDictionaryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const level = LEVELS.includes(sp.level ?? "") ? (sp.level as string) : "1";
  const status = (STATUS_FILTERS.some((s) => s.v === sp.status) ? sp.status : "draft") as
    | DictStatus
    | "none"
    | "all";
  const q = sp.q ?? "";

  const [counts, queue] = await Promise.all([
    getDictionaryCounts(),
    getDictionaryQueue({ level, status, q, limit: 150 }),
  ]);
  const cur = counts.find((c) => c.hsk_level === level);

  const href = (patch: Partial<SP>) => {
    const p = new URLSearchParams({ level, status, ...(q ? { q } : {}), ...patch } as Record<string, string>);
    return `/admin/dictionary?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Толь бичиг — хянах самбар"
        description="Нэг үг = нэг дэлгэц. AI ноорог → редактор хянана → ерөнхий редактор батална. Сурагчид зөвхөн батлагдсан утгыг хардаг."
      actions={
          <Link href="/admin/dictionary/reports" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            ⚑ Буруу орчуулгын мэдэгдэл
          </Link>
        }
      />

      {/* Түвшний ахиц */}
      <section className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {LEVELS.map((lv) => {
          const c = counts.find((x) => x.hsk_level === lv);
          const total = c?.total ?? 0;
          const approved = c?.approved ?? 0;
          const active = lv === level;
          return (
            <Link
              key={lv}
              href={href({ level: lv })}
              className={`rounded-xl border px-3 py-2 text-left shadow-sm transition ${
                active ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <div className="text-xs font-semibold text-slate-500">HSK {lv}</div>
              <div className="text-lg font-bold text-slate-900">
                {approved}
                <span className="text-xs font-medium text-slate-400"> / {total}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-slate-100">
                <div className="h-full bg-emerald-500" style={{ width: `${pct(approved, total)}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                ноорог {c?.draft ?? 0} · хянасан {c?.reviewed ?? 0}
              </div>
            </Link>
          );
        })}
      </section>

      {/* Шүүлт */}
      <section className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s.v}
            href={href({ status: s.v })}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              s.v === status
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-400"
            }`}
          >
            {s.mn}
            {cur && s.v !== "all" ? (
              <span className="ml-1 opacity-70">{cur[s.v as keyof typeof cur] as number}</span>
            ) : null}
          </Link>
        ))}
        <form action="/admin/dictionary" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="level" value={level} />
          <input type="hidden" name="status" value="all" />
          <input
            name="q"
            defaultValue={q}
            placeholder="ханз / пиньинь / монгол"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
            Хайх
          </button>
        </form>
      </section>

      {/* Дараалал */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {queue.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Энэ шүүлтэд үг алга.{" "}
            {status === "draft" ? "AI ноорог оруулахын тулд scripts/dictionary/draft_senses.py ажиллуул." : null}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Үг</th>
                <th className="px-4 py-2">Одоогийн утга (хуучин)</th>
                <th className="px-4 py-2">Утга</th>
                <th className="px-4 py-2">Төлөв</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <span className="hanzi text-lg font-semibold text-slate-900">{w.simplified}</span>
                    <span className="ml-2 text-xs text-slate-500">{w.pinyin}</span>
                  </td>
                  <td className="max-w-md truncate px-4 py-2 text-slate-600">{w.meaning_mn ?? w.meaning_en}</td>
                  <td className="px-4 py-2 text-slate-600">{w.sense_count || "—"}</td>
                  <td className="px-4 py-2">
                    <StatusPill status={w.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/dictionary/${w.id}?level=${level}&status=${status}`}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      {w.status ? "Хянах" : "Бичих"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: DictStatus | null }) {
  if (!status) return <span className="text-xs text-slate-400">бичилтгүй</span>;
  const cls: Record<DictStatus, string> = {
    draft: "bg-amber-50 text-amber-700 ring-amber-200",
    reviewed: "bg-sky-50 text-sky-700 ring-sky-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls[status]}`}>
      {DICT_STATUS_LABEL[status]}
    </span>
  );
}
