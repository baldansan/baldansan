"use client";

/**
 * Багшийн ангийн хуудас: «✍️ Бичих даалгавар өгөх» маягт + энэ ангийн бичих
 * даалгаврууд, сурагч бүрийн ахицтай (RPC writing_list_progress).
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WritingItemsTable } from "@/components/writing/writing-list-form";
import { formatMongoliaDateTimeOrFallback } from "@/lib/datetime/mongolia-time";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  createWritingHomework,
  deleteWritingHomework,
  getClassroomWritingLists,
  getWritingListProgress,
  type WritingListProgressRow,
} from "@/lib/writing/classroom";
import {
  defaultListTitle,
  REPS_MEMORY_DEFAULT,
  REPS_MEMORY_MAX,
  REPS_MEMORY_MIN,
  REPS_TRACE_DEFAULT,
  REPS_TRACE_MAX,
  REPS_TRACE_MIN,
  type WritingItem,
  type WritingList,
} from "@/lib/writing/types";
import "@/components/writing/writing.css";

type Props = {
  classroomId: string;
  onCreated?: () => void;
};

export function ClassWritingHomework({ classroomId, onCreated }: Props) {
  const locale = useUiLocale();
  const [lists, setLists] = useState<WritingList[]>([]);
  const [progress, setProgress] = useState<Record<string, WritingListProgressRow[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [items, setItems] = useState<WritingItem[]>([]);
  const [title, setTitle] = useState("");
  const [repsTrace, setRepsTrace] = useState(REPS_TRACE_DEFAULT);
  const [repsMemory, setRepsMemory] = useState(REPS_MEMORY_DEFAULT);
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const placeholderTitle = defaultListTitle(tr(locale, "Бичих даалгавар"));

  const apply = useCallback((res: Awaited<ReturnType<typeof getClassroomWritingLists>>) => {
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setError(null);
    setLists(res.data ?? []);
  }, []);

  const load = useCallback(async () => apply(await getClassroomWritingLists(classroomId)), [apply, classroomId]);

  useEffect(() => {
    let alive = true;
    getClassroomWritingLists(classroomId).then((res) => {
      if (alive) apply(res);
    });
    return () => {
      alive = false;
    };
  }, [classroomId, apply]);

  async function toggleProgress(listId: string) {
    if (openId === listId) {
      setOpenId(null);
      return;
    }
    setOpenId(listId);
    if (!progress[listId]) {
      const res = await getWritingListProgress(listId);
      if (res.error) setError(res.error);
      setProgress((prev) => ({ ...prev, [listId]: res.data ?? [] }));
    }
  }

  async function recognize() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/writing/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as { items?: WritingItem[] };
      const found = json.items ?? [];
      if (found.length === 0) setError(tr(locale, "Ханз олдсонгүй — хятад ханз оруулна уу."));
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.ch));
        return [...prev, ...found.filter((i) => !seen.has(i.ch))];
      });
    } catch {
      setError(tr(locale, "Таньж чадсангүй. Дахин оролдоно уу."));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (items.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    const res = await createWritingHomework({
      classroomId,
      title: title.trim() || placeholderTitle,
      items,
      repsTrace,
      repsMemory,
      dueDate: dueDate || null,
      instructions: text.trim() || undefined,
    });
    setSaving(false);
    if (res.error || !res.data) {
      setError(res.error ?? tr(locale, "Хадгалж чадсангүй."));
      return;
    }
    setNotice(`${tr(locale, "Даалгавар өгөгдлөө")} ✓ · ${res.data.items.length} ${tr(locale, "ханз")}`);
    setItems([]);
    setText("");
    setTitle("");
    setDueDate("");
    await load();
    onCreated?.();
  }

  async function remove(list: WritingList) {
    if (!window.confirm(tr(locale, "Энэ бичих даалгаврыг устгах уу? Сурагчдын ахиц устана."))) return;
    const res = await deleteWritingHomework(list);
    if (res.error) {
      setError(res.error);
      return;
    }
    setLists((prev) => prev.filter((l) => l.id !== list.id));
    onCreated?.();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      ) : null}

      <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-slate-900">✍️ {tr(locale, "Бичих даалгавар өгөх")}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="学 生 老师 今天…"
          translate="no"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg leading-8"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void recognize()}
            disabled={!text.trim() || busy}
            className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
          >
            {busy ? tr(locale, "Таньж байна…") : `🔍 ${tr(locale, "Таних")}`}
          </button>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => setItems([])}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500"
            >
              {tr(locale, "Бүгдийг арилгах")}
            </button>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-600">
              {items.length} {tr(locale, "ханз")}
            </p>
            <WritingItemsTable items={items} onChange={setItems} compact />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            {tr(locale, "Гарчиг")}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={placeholderTitle}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            {tr(locale, "Хугацаа")}
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            ✍️ {tr(locale, "Дагаж бичих")} ({REPS_TRACE_MIN}–{REPS_TRACE_MAX})
            <input
              type="number"
              min={REPS_TRACE_MIN}
              max={REPS_TRACE_MAX}
              value={repsTrace}
              onChange={(e) =>
                setRepsTrace(Math.min(REPS_TRACE_MAX, Math.max(REPS_TRACE_MIN, Number(e.target.value) || REPS_TRACE_MIN)))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            🧠 {tr(locale, "Санаж бичих")} ({REPS_MEMORY_MIN}–{REPS_MEMORY_MAX})
            <input
              type="number"
              min={REPS_MEMORY_MIN}
              max={REPS_MEMORY_MAX}
              value={repsMemory}
              onChange={(e) =>
                setRepsMemory(Math.min(REPS_MEMORY_MAX, Math.max(REPS_MEMORY_MIN, Number(e.target.value) || REPS_MEMORY_MIN)))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={items.length === 0 || saving}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? tr(locale, "Хадгалж байна…") : `${tr(locale, "Даалгавар өгөх")} · ${items.length} ${tr(locale, "ханз")}`}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">{tr(locale, "Ангийн бичих даалгаврууд")}</h3>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">{tr(locale, "Ачааллаж байна…")}</p>
        ) : lists.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{tr(locale, "Бичих даалгавар хараахан алга.")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {lists.map((list) => {
              const rows = progress[list.id];
              const open = openId === list.id;
              return (
                <li key={list.id} className="rounded-xl bg-white ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900" translate="no">
                        {list.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span translate="no">{list.items.map((i) => i.ch).join(" ")}</span>
                        {" · "}
                        {list.items.length} {tr(locale, "ханз")} · {list.repsTrace}+{list.repsMemory}
                        {list.dueDate ? ` · ${tr(locale, "Хугацаа")}: ${list.dueDate}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => void toggleProgress(list.id)}
                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800 ring-1 ring-emerald-200"
                      >
                        {open ? tr(locale, "Хаах") : tr(locale, "Сурагчдын ахиц")}
                      </button>
                      <Link
                        href={`/writing/${list.id}/print`}
                        className="rounded-full px-3 py-1.5 text-slate-700 ring-1 ring-slate-200"
                      >
                        🖨 {tr(locale, "Хэвлэх")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => void remove(list)}
                        className="rounded-full px-3 py-1.5 text-red-600 ring-1 ring-red-100"
                      >
                        {tr(locale, "Устгах")}
                      </button>
                    </div>
                  </div>
                  {open ? (
                    <div className="border-t border-slate-100 px-2 py-2">
                      {!rows ? (
                        <p className="px-2 py-1 text-sm text-slate-500">{tr(locale, "Ачааллаж байна…")}</p>
                      ) : rows.length === 0 ? (
                        <p className="px-2 py-1 text-sm text-slate-500">
                          {tr(locale, "Апп дээр бүртгэлтэй сурагч хараахан алга.")}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[420px] text-left text-sm">
                            <thead className="text-xs text-slate-500">
                              <tr>
                                <th className="px-2 py-1 font-semibold">{tr(locale, "Сурагч")}</th>
                                <th className="px-2 py-1 font-semibold">{tr(locale, "Ханз")}</th>
                                <th className="px-2 py-1 font-semibold">{tr(locale, "Гүйцэтгэл")}</th>
                                <th className="px-2 py-1 font-semibold">{tr(locale, "Сүүлийн үйлдэл")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rows.map((r) => (
                                <tr key={r.studentUserId}>
                                  <td className="px-2 py-1.5 font-medium text-slate-900" translate="no">
                                    {r.displayName}
                                  </td>
                                  <td className="px-2 py-1.5 text-slate-700">
                                    {r.charsDone}/{r.charsTotal}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                          className="h-full rounded-full bg-emerald-500"
                                          style={{ width: `${r.percent}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-slate-700">{r.percent}%</span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5 text-xs text-slate-500">
                                    {formatMongoliaDateTimeOrFallback(r.lastAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
