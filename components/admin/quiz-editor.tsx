"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  createQuizQuestion,
  deleteQuizQuestion,
  getQuizQuestionsByLessonId,
  type AdminQuizQuestion,
} from "@/lib/supabase/admin-content";

type Props = {
  lessonId: string;
  onCountsUpdated?: (actual: number, meta: number) => void;
};

const emptyForm = {
  type: "multiple_choice" as "multiple_choice" | "cloze",
  question: "",
  optionsText: "",
  correctAnswer: "",
  explanation: "",
  orderIndex: "",
};

export function QuizEditor({ lessonId, onCountsUpdated }: Props) {
  const [items, setItems] = useState<AdminQuizQuestion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getQuizQuestionsByLessonId(lessonId);
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
  }, [load]);

  useEffect(() => {
    if (items.length === 0) return;
    const next = Math.max(...items.map((r) => r.order_index)) + 1;
    setForm((f) => (f.orderIndex.trim() ? f : { ...f, orderIndex: String(next) }));
  }, [items]);

  function parseOptions(text: string): string[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function validate(): string | null {
    if (!form.question.trim()) return "Question заавал.";
    const options = parseOptions(form.optionsText);
    if (options.length < 2) return "Хамгийн багадаа 2 сонголт.";
    if (!form.correctAnswer.trim()) return "Correct answer заавал.";
    if (!options.includes(form.correctAnswer.trim())) {
      return "Correct answer нь сонголтуудын нэг байх ёстой.";
    }
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

    const options = parseOptions(form.optionsText);

    setSaving(true);
    const result = await createQuizQuestion({
      lessonId,
      type: form.type,
      question: form.question,
      options,
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation,
      orderIndex: form.orderIndex.trim()
        ? Number(form.orderIndex)
        : undefined,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess("Quiz question нэмэгдлээ. Lesson count шинэчлэгдлээ.");
    setForm({
      ...emptyForm,
      type: form.type,
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
    const result = await deleteQuizQuestion(id, lessonId);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess("Quiz устгагдлаа. Lesson count шинэчлэгдлээ.");
    await load();
  }

  return (
    <AdminEditorSection
      title={`Quiz editor (${items.length})`}
      description="One option per line in the options field."
    >
      <AdminAlert error={error} success={success} />

      <div className="grid gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Type
          <select
            className={adminInputClass}
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as "multiple_choice" | "cloze",
              })
            }
          >
            <option value="multiple_choice">multiple_choice</option>
            <option value="cloze">cloze</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Question
          <textarea
            className={`${adminInputClass} min-h-[72px]`}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            rows={2}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Options (one per line)
          <textarea
            className={`${adminInputClass} min-h-[88px]`}
            value={form.optionsText}
            onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
            rows={4}
            placeholder={"A\nB\nC\nD"}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Correct answer
          <input
            className={adminInputClass}
            value={form.correctAnswer}
            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Explanation
          <input
            className={adminInputClass}
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
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
        {saving ? "Saving..." : "Add quiz question"}
      </button>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Ачааллаж байна...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-amber-800">No quiz questions yet</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((q) => (
            <li
              key={q.id}
              className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:flex-row sm:justify-between"
            >
              <div className="text-sm">
                <span className="text-xs text-slate-500">
                  #{q.order_index} · {q.type} · {q.options.length} options
                </span>
                <p className="mt-1 font-medium text-slate-900">{q.question}</p>
                <p className="text-xs text-slate-500">
                  Answer: {q.correct_answer}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(q.id)}
                disabled={deletingId === q.id}
                className="shrink-0 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                {deletingId === q.id ? "…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminEditorSection>
  );
}
