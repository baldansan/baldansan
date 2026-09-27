"use client";

/**
 * Дэвтрийн хуудас (田字格): ханз бүр нэг мөр — ханз, пиньинь, утга, нүднүүд.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { CellStrip } from "@/components/writing/cell-strip";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { deleteList, getList, getProgress } from "@/lib/writing/store";
import {
  isCharDone,
  summarizeProgress,
  type WritingList,
  type WritingProgressMap,
} from "@/lib/writing/types";
import "@/components/writing/writing.css";

type Props = { listId: string };

export function WritingNotebookClient({ listId }: Props) {
  const locale = useUiLocale();
  const router = useRouter();
  const [list, setList] = useState<WritingList | null>(null);
  const [progress, setProgress] = useState<WritingProgressMap>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await getList(listId);
      if (!alive) return;
      if (res.error || !res.data) {
        setError(res.error ?? "Дэвтэр олдсонгүй.");
        setLoading(false);
        return;
      }
      setList(res.data);
      setProgress(await getProgress(listId));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [listId]);

  async function remove() {
    if (!list || deleting) return;
    if (!window.confirm(tr(locale, "Энэ дэвтрийг устгах уу?"))) return;
    setDeleting(true);
    const res = await deleteList(list.id);
    setDeleting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/writing");
  }

  const summary = list ? summarizeProgress(list, progress) : null;
  const started = (summary?.cellsDone ?? 0) > 0;
  const allDone = summary != null && summary.cellsTotal > 0 && summary.cellsDone >= summary.cellsTotal;
  const isAssignment = list?.kind === "assignment";

  return (
    <MobileAppShell activeTab="study">
      <Link
        href="/writing"
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        {tr(locale, "← Бичих дэвтэр")}
      </Link>

      {loading ? (
        <MobileCard>
          <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
        </MobileCard>
      ) : !list || !summary ? (
        <MobileCard>
          <p className="text-sm text-red-700">{error ?? tr(locale, "Дэвтэр олдсонгүй.")}</p>
        </MobileCard>
      ) : (
        <>
          <MobilePageHeader
            title={list.title}
            subtitle={`${summary.charsTotal} ${tr(locale, "ханз")} · ${list.repsTrace} ${tr(locale, "дагаж")} + ${list.repsMemory} ${tr(locale, "санаж")}${
              list.dueDate ? ` · ${tr(locale, "Хугацаа")}: ${list.dueDate}` : ""
            }`}
            badge={allDone ? "✓ 100%" : `${summary.percent}%`}
          />

          {error ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}

          <MobileCard className="mb-4">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${summary.percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              {summary.cellsDone}/{summary.cellsTotal} {tr(locale, "нүд")} · {summary.charsDone}/
              {summary.charsTotal} {tr(locale, "ханз дууссан")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/writing/${list.id}/practice${allDone ? "?again=1" : ""}`}
                className="app-btn-primary flex-1 text-center"
              >
                {allDone
                  ? `🔁 ${tr(locale, "Дахин бичих")}`
                  : started
                    ? `▶ ${tr(locale, "Үргэлжлүүлэх")}`
                    : `▶ ${tr(locale, "Бичих")}`}
              </Link>
              <Link
                href={`/writing/${list.id}/print`}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                🖨 {tr(locale, "Хэвлэх")}
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
              {!isAssignment ? (
                <Link href={`/writing/${list.id}/edit`} className="text-emerald-700">
                  ✏️ {tr(locale, "Засах")}
                </Link>
              ) : null}
              {!isAssignment ? (
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={deleting}
                  className="text-red-600 disabled:opacity-50"
                >
                  🗑 {tr(locale, "Устгах")}
                </button>
              ) : null}
            </div>
          </MobileCard>

          <ul className="space-y-2 pb-8">
            {list.items.map((item) => {
              const p = progress[item.ch];
              const done = isCharDone(list, p);
              return (
                <li key={item.ch}>
                  <Link
                    href={`/writing/${list.id}/practice?start=${encodeURIComponent(item.ch)}`}
                    className="block"
                  >
                    <MobileCard padding="sm" className="flex items-center gap-3">
                      <span
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl font-semibold ${
                          done ? "bg-emerald-500 text-white" : "bg-slate-50 text-[var(--app-text)] ring-1 ring-slate-200"
                        }`}
                        translate="no"
                      >
                        {item.ch}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--app-text)]" translate="no">
                          <b>{item.pinyin ?? ""}</b>
                          {item.meaning_mn ? ` · ${item.meaning_mn}` : ""}
                          {item.word && item.word !== item.ch ? (
                            <span className="text-[var(--app-muted)]"> · {item.word}</span>
                          ) : null}
                        </p>
                        <div className="mt-1.5">
                          <CellStrip ch={item.ch} list={list} progress={p} />
                        </div>
                      </div>
                      {p && p.mistakes > 0 ? (
                        <span
                          className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                          title={tr(locale, "алдаа")}
                        >
                          ✗ {p.mistakes}
                        </span>
                      ) : null}
                    </MobileCard>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </MobileAppShell>
  );
}
