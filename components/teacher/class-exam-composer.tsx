"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CLASSROOM_EXAM_STATUSES,
  CLASSROOM_EXAM_STATUS_LABELS,
  type ClassroomExamStatus,
} from "@/lib/classroom/exam-types";
import {
  createClassroomExam,
  getExamTestOptions,
} from "@/lib/supabase/class-mock-exams";
import type { ExamTestOption } from "@/lib/classroom/exam-types";

type Props = {
  classroomId: string;
  onCreated?: () => void;
};

export function ClassExamComposer({ classroomId, onCreated }: Props) {
  const [tests, setTests] = useState<ExamTestOption[]>([]);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [testId, setTestId] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ClassroomExamStatus>("scheduled");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: loadError } = await getExamTestOptions();
      if (cancelled) return;
      if (loadError) {
        setTestsError(loadError);
        return;
      }
      const list = data ?? [];
      setTests(list);
      setTestId((prev) => prev || list[0]?.id || "");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedTests = useMemo(() => {
    const groups = new Map<number, ExamTestOption[]>();
    for (const test of tests) {
      const list = groups.get(test.hskLevel);
      if (list) list.push(test);
      else groups.set(test.hskLevel, [test]);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [tests]);

  const selectedTest = useMemo(
    () => tests.find((test) => test.id === testId) ?? null,
    [tests, testId]
  );

  // Багш гарчгаа гараар бичээгүй бол сонгосон шалгалтаар нь санал болгоно.
  const effectiveTitle =
    titleTouched || !selectedTest ? title : `${selectedTest.title} — ангийн шалгалт`;

  async function handleSubmit() {
    if (!testId) {
      setError("Шалгалт сонгоно уу.");
      return;
    }
    if (dueDate && scheduledFor && dueDate < scheduledFor) {
      setError("Дуусах огноо нь товлосон огнооноос өмнө байж болохгүй.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: createError } = await createClassroomExam({
      classroomId,
      testId,
      title: effectiveTitle,
      scheduledFor: scheduledFor || undefined,
      dueDate: dueDate || undefined,
      status,
    });

    setSaving(false);
    if (createError || !data) {
      setError(createError ?? "Шалгалт товлож чадсангүй.");
      return;
    }

    setNotice(`«${data.title ?? data.testId}» шалгалтыг ангид товлолоо.`);
    setTitle("");
    setTitleTouched(false);
    setScheduledFor("");
    setDueDate("");
    onCreated?.();
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      {testsError ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {testsError}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Загвар шалгалт сонгох</span>
        <select
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          required
          className="rounded-lg border border-slate-200 px-3 py-2"
        >
          {tests.length === 0 ? (
            <option value="">Шалгалт олдсонгүй</option>
          ) : null}
          {groupedTests.map(([level, items]) => (
            <optgroup key={level} label={`HSK ${level}`}>
              {items.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title} ({test.id})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedTest ? (
          <span className="text-xs text-slate-500">
            {selectedTest.totalQuestions} асуулт ·{" "}
            {selectedTest.timeLimitMin} минут
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Гарчиг</span>
        <input
          value={effectiveTitle}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleTouched(true);
          }}
          placeholder="Жишээ: Намрын улирлын HSK 4 шалгалт"
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Шалгалтын өдөр</span>
          <input
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
          <span className="text-xs text-slate-500">
            Энэ өдрөөс хойш өгсөн оролдлогыг ангийн дүнд тооцно.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            Дуусах хугацаа (заавал биш)
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Төлөв</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ClassroomExamStatus)}
          className="rounded-lg border border-slate-200 px-3 py-2"
        >
          {CLASSROOM_EXAM_STATUSES.map((value) => (
            <option key={value} value={value}>
              {CLASSROOM_EXAM_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {saving ? "Товлож байна…" : "Ангид шалгалт товлох"}
      </button>

      <p className="text-xs text-slate-500">
        Нэг шалгалтыг нэг ангид нэг өдөрт давхар товлохгүй. Дахин товлох бол
        өдрөө өөрчилнө үү.
      </p>
    </form>
  );
}
