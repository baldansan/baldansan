import Link from "next/link";
import { notFound } from "next/navigation";
import { DictionaryEditor } from "@/components/admin/dictionary/dictionary-editor";
import type { DictStatus } from "@/lib/dictionary/types";
import { getDictionaryWordFull, getNextDictionaryWordId } from "@/lib/supabase/dictionary-admin";

export const dynamic = "force-dynamic";

export default async function AdminDictionaryWordPage({
  params,
  searchParams,
}: {
  params: Promise<{ wordId: string }>;
  searchParams: Promise<{ level?: string; status?: string }>;
}) {
  const { wordId: raw } = await params;
  const sp = await searchParams;
  const wordId = Number(raw);
  if (!Number.isFinite(wordId)) notFound();

  const full = await getDictionaryWordFull(wordId);
  if (!full) notFound();

  const level = sp.level ?? full.word.hsk_level;
  const status = (sp.status ?? "draft") as DictStatus | "none";
  const nextId = await getNextDictionaryWordId(level, wordId, status === ("all" as never) ? "draft" : status);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <Link href={`/admin/dictionary?level=${level}&status=${status}`} className="text-slate-500 hover:text-slate-900">
          ← Дараалал (HSK {level})
        </Link>
        {nextId ? (
          <Link
            href={`/admin/dictionary/${nextId}?level=${level}&status=${status}`}
            className="text-slate-500 hover:text-slate-900"
          >
            Дараагийн үг →
          </Link>
        ) : null}
      </div>
      <DictionaryEditor
        data={full}
        nextHref={nextId ? `/admin/dictionary/${nextId}?level=${level}&status=${status}` : null}
      />
    </div>
  );
}
