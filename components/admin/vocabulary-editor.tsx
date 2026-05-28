"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  createVocabularyWord,
  deleteVocabularyWord,
  getVocabularyWordsByLessonId,
  type AdminVocabularyWord,
} from "@/lib/supabase/admin-content";

const HSK_LEVELS = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"] as const;

type Props = {
  lessonId: string;
  onCountsUpdated?: (actual: number, meta: number) => void;
  reloadToken?: number;
};

const emptyForm = {
  chinese: "",
  pinyin: "",
  mongolian: "",
  hskLevel: "HSK5",
  exampleChinese: "",
  exampleMongolian: "",
  orderIndex: "",
};

export function VocabularyEditor({
  lessonId,
  onCountsUpdated,
  reloadToken = 0,
}: Props) {
  const [items, setItems] = useState<AdminVocabularyWord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getVocabularyWordsByLessonId(lessonId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const list = result.data ?? [];
    setItems(list);
    onCountsUpdated?.(list.length, list.length);
  }, [lessonId, onCountsUpdated]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  useEffect(() => {
    if (items.length === 0) return;
    const next = Math.max(...items.map((r) => r.order_index)) + 1;
    setForm((f) => (f.orderIndex.trim() ? f : { ...f, orderIndex: String(next) }));
  }, [items]);

  function validate(): string | null {
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
    const result = await createVocabularyWord({
      lessonId,
      chinese: form.chinese,
      pinyin: form.pinyin,
      mongolian: form.mongolian,
      hskLevel: form.hskLevel,
      exampleChinese: form.exampleChinese,
      exampleMongolian: form.exampleMongolian,
      orderIndex: form.orderIndex.trim()
        ? Number(form.orderIndex)
        : undefined,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess("Vocabulary нэмэгдлээ. Lesson count шинэчлэгдлээ.");
    setForm({
      ...emptyForm,
      hskLevel: form.hskLevel,
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
    const result = await deleteVocabularyWord(id, lessonId);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess("Vocabulary устгагдлаа. Lesson count шинэчлэгдлээ.");
    await load();
  }

  return (
    <AdminEditorSection
      title={`Vocabulary editor (${items.length})`}
      description="Words for vocabulary page and progress dbId mapping."
    >
      <AdminAlert error={error} success={success} />

      <div className="grid gap-3 sm:grid-cols-2">
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
          HSK level
          <select
            className={adminInputClass}
            value={form.hskLevel}
            onChange={(e) => setForm({ ...form, hskLevel: e.target.value })}
          >
            {HSK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
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
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Example Chinese
          <input
            className={adminInputClass}
            value={form.exampleChinese}
            onChange={(e) =>
              setForm({ ...form, exampleChinese: e.target.value })
            }
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Example Mongolian
          <input
            className={adminInputClass}
            value={form.exampleMongolian}
            onChange={(e) =>
              setForm({ ...form, exampleMongolian: e.target.value })
            }
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={saving}
        className="mt-4 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Add vocabulary word"}
      </button>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Ачааллаж байна...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-amber-800">No vocabulary yet</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((word) => (
            <li
              key={word.id}
              className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:flex-row sm:justify-between"
            >
              <div className="text-sm">
                <span className="text-xs text-slate-500">#{word.order_index}</span>
                <p className="font-medium text-slate-900">
                  {word.chinese}
                  {word.hsk_level ? (
                    <span className="ml-2 text-xs text-emerald-700">
                      {word.hsk_level}
                    </span>
                  ) : null}
                </p>
                {word.pinyin ? (
                  <p className="text-slate-500">{word.pinyin}</p>
                ) : null}
                <p className="text-slate-600">{word.mongolian}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(word.id)}
                disabled={deletingId === word.id}
                className="shrink-0 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                {deletingId === word.id ? "…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminEditorSection>
  );
}
