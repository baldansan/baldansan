"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  createSubtitleLine,
  deleteSubtitleLine,
  getSubtitleLinesByLessonId,
  type AdminSubtitleLine,
} from "@/lib/supabase/admin-content";

type Props = {
  lessonId: string;
  onSubtitleCountChange?: (count: number) => void;
};

const emptyForm = {
  startTime: "",
  endTime: "",
  chinese: "",
  pinyin: "",
  mongolian: "",
  orderIndex: "",
};

export function SubtitleEditor({ lessonId, onSubtitleCountChange }: Props) {
  const [items, setItems] = useState<AdminSubtitleLine[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getSubtitleLinesByLessonId(lessonId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const list = result.data ?? [];
    setItems(list);
    onSubtitleCountChange?.(list.length);
  }, [lessonId, onSubtitleCountChange]);

  useEffect(() => {
    if (items.length === 0) return;
    const next = Math.max(...items.map((r) => r.order_index)) + 1;
    setForm((f) => (f.orderIndex.trim() ? f : { ...f, orderIndex: String(next) }));
  }, [items]);

  useEffect(() => {
    load();
  }, [load]);

  function validate(): string | null {
    if (!form.startTime.trim() || !form.endTime.trim()) {
      return "Start/end time заавал.";
    }
    if (!form.chinese.trim()) return "Chinese заавал.";
    if (!form.mongolian.trim()) return "Mongolian заавал.";
    if (form.orderIndex.trim()) {
      const n = Number(form.orderIndex);
      if (!Number.isFinite(n) || n < 1) return "Order index тоо байх ёстой.";
    }
    return null;
  }

  async function handleAdd() {
    setError(null);
    setSuccess(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const result = await createSubtitleLine({
      lessonId,
      startTime: form.startTime,
      endTime: form.endTime,
      chinese: form.chinese,
      pinyin: form.pinyin,
      mongolian: form.mongolian,
      orderIndex: form.orderIndex.trim()
        ? Number(form.orderIndex)
        : undefined,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess("Subtitle нэмэгдлээ.");
    setForm({
      ...emptyForm,
      orderIndex: form.orderIndex.trim()
        ? String(Number(form.orderIndex) + 1)
        : "",
    });
    await load();
  }

  async function handleDelete(id: number) {
    setError(null);
    setSuccess(null);
    setDeletingId(id);
    const result = await deleteSubtitleLine(id);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess("Subtitle устгагдлаа.");
    await load();
  }

  return (
    <AdminEditorSection
      title={`Subtitle editor (${items.length})`}
      description="Timed lines for the watch page."
    >
      <AdminAlert error={error} success={success} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Start time
          <input
            className={adminInputClass}
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            placeholder="00:00:05"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          End time
          <input
            className={adminInputClass}
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            placeholder="00:00:12"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Chinese
          <input
            className={adminInputClass}
            value={form.chinese}
            onChange={(e) => setForm({ ...form, chinese: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Pinyin
          <input
            className={adminInputClass}
            value={form.pinyin}
            onChange={(e) => setForm({ ...form, pinyin: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Mongolian
          <input
            className={adminInputClass}
            value={form.mongolian}
            onChange={(e) => setForm({ ...form, mongolian: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Order index
          <input
            className={adminInputClass}
            type="number"
            min={1}
            value={form.orderIndex}
            onChange={(e) => setForm({ ...form, orderIndex: e.target.value })}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={saving}
        className="mt-4 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Add subtitle line"}
      </button>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Ачааллаж байна...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-amber-800">No subtitles yet</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((line) => (
            <li
              key={line.id}
              className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-mono text-xs text-slate-500">
                  #{line.order_index} · {line.start_time} – {line.end_time}
                </span>
                <p className="mt-1 font-medium text-slate-900">{line.chinese}</p>
                {line.pinyin ? (
                  <p className="text-slate-500">{line.pinyin}</p>
                ) : null}
                <p className="text-slate-600">{line.mongolian}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(line.id)}
                disabled={deletingId === line.id}
                className="shrink-0 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === line.id ? "…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminEditorSection>
  );
}
