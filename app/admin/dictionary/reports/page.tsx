import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReportResolveButton } from "@/components/admin/dictionary/report-resolve-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Толь бичиг — буруу орчуулгын мэдэгдэл" };

type Row = {
  id: string;
  word_id: number | null;
  lexicon_id: number | null;
  simplified: string;
  current_mn: string | null;
  suggestion: string | null;
  created_at: string;
};

export default async function DictionaryReportsPage() {
  const client = await createServerSupabaseClient();
  const { data } = client
    ? await client
        .from("dictionary_reports")
        .select("id, word_id, lexicon_id, simplified, current_mn, suggestion, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: null };
  const rows = (data ?? []) as Row[];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Буруу орчуулгын мэдэгдэл"
        description="Сурагч, хэрэглэгчдийн «буруу орчуулга» гэж мэдэгдсэн үгс. Засчихаад «Шийдсэн» дарна."
        actions={
          <Link href="/admin/dictionary" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            ← Толь бичиг
          </Link>
        }
      />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Нээлттэй мэдэгдэл алга.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-slate-900">
                    {r.simplified}{" "}
                    <span className="text-xs font-medium text-slate-400">
                      {r.word_id ? `HSK үг #${r.word_id}` : `лексикон #${r.lexicon_id}`}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Одоогийн: {r.current_mn || "—"}</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-700">Санал: {r.suggestion || "(тайлбаргүй)"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.word_id ? (
                    <Link href={`/admin/dictionary/${r.word_id}`} className="text-xs font-semibold text-emerald-700 underline">
                      Засах
                    </Link>
                  ) : null}
                  <ReportResolveButton id={r.id} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
