"use client";

import { useCallback, useEffect, useState } from "react";

import { formatMongoliaDateTime } from "@/lib/datetime/mongolia-time";
import {
  assignWeakLessonToStudent,
  getClassroomWeakSpots,
  weakLessonLabel,
  weakLessonReason,
} from "@/lib/supabase/teacher-weak-spots";
import type {
  ClassroomWeakSpots,
  StudentWeakLesson,
  StudentWeakSpots,
} from "@/lib/teacher/analytics-types";

type Props = {
  classroomId: string;
  /** Даалгавар үүсгэсний дараа ангийн хуудсыг шинэчлэх. */
  onAssigned?: () => void;
};

const STAGE_LABELS: Record<string, string> = {
  quiz: "Дасгал",
  grammar: "Дүрэм",
  grammar_exercise: "Дүрмийн дасгал",
  word_practice: "Үгийн дасгал",
  mock_exam: "Мок шалгалт",
  order: "Дараалал",
  subject: "Өгүүлэгдэхүүн",
  predicate: "Өгүүлэхүүн",
  mistake_review: "Алдааны давталт",
};

const SOURCE_LABELS: Record<string, string> = {
  question_attempts: "Асуулт бүрийн оролдлогоос",
  quiz_attempts: "Дасгалын оноогоор",
  both: "Оролдлого ба дасгалын оноогоор",
};

function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

function WeakLessonRow({
  student,
  lesson,
  busy,
  onAssign,
}: {
  student: StudentWeakSpots;
  lesson: StudentWeakLesson;
  busy: boolean;
  onAssign: (lesson: StudentWeakLesson) => void;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{weakLessonLabel(lesson)}</p>
        <p className="mt-0.5 text-sm text-amber-800">
          {weakLessonReason(lesson)}
        </p>
        {lesson.stages.length > 0 ? (
          <p className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-600">
            {lesson.stages.slice(0, 4).map((s) => (
              <span
                key={s.stage}
                className="rounded-full bg-slate-100 px-2 py-0.5"
              >
                {stageLabel(s.stage)}: {s.wrongCount} алдаа ·{" "}
                {s.accuracyPercent}%
              </span>
            ))}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">
          {SOURCE_LABELS[lesson.source] ?? lesson.source}
          {lesson.lastAttemptAt
            ? ` · сүүлд ${formatMongoliaDateTime(lesson.lastAttemptAt, "date")}`
            : ""}
        </p>
      </div>
      <button
        type="button"
        disabled={busy || !student.studentUserId}
        onClick={() => onAssign(lesson)}
        className="shrink-0 self-start rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
      >
        {busy ? "Өгч байна…" : "Энэ хичээлийг давтуулах"}
      </button>
    </li>
  );
}

export function StudentWeakSpotsSection({ classroomId, onAssigned }: Props) {
  const [data, setData] = useState<ClassroomWeakSpots | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getClassroomWeakSpots(classroomId);
      if (cancelled) return;
      setLoading(false);
      setWarnings(res.warnings);
      if (res.error) {
        setError(res.error);
        return;
      }
      setError(null);
      setData(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [classroomId, reloadToken]);

  async function handleAssign(
    student: StudentWeakSpots,
    lesson: StudentWeakLesson
  ) {
    if (!student.studentUserId) return;
    const key = `${student.studentRowId}|${lesson.lessonId}`;
    setBusyKey(key);
    setNotice(null);
    const { data: created, error: assignError } = await assignWeakLessonToStudent({
      classroomId,
      studentUserId: student.studentUserId,
      studentName: student.displayName,
      lesson,
      dueDate: dueDate || undefined,
    });
    setBusyKey(null);
    if (assignError || !created) {
      setError(assignError ?? "Даалгавар үүсгэж чадсангүй.");
      return;
    }
    setError(null);
    setNotice(`«${created.title}» даалгавар үүслээ.`);
    reload();
    onAssigned?.();
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-600">Сул талыг тооцож байна…</p>
    );
  }

  if (error && !data) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  }

  const students = data?.students ?? [];
  const linkedStudents = students.filter((s) => s.studentUserId);
  // RLS нь эрхгүй мөрийг алдаа заалгүй нууна. Тиймээс холбогдсон сурагч байгаа
  // атлаа бүгд хоосон бол «оролдлого байхгүй» гэж дүгнэхгүй, багшид сануулна.
  const allEmpty =
    linkedStudents.length > 0 && linkedStudents.every((s) => !s.hasData);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        Бүх тоо сурагчийн бодит оролдлогоос гарсан. Оролдлого бүртгэгдээгүй бол
        энд тоо харагдахгүй.
      </p>

      {warnings.map((w) => (
        <p
          key={w}
          className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200"
        >
          {w}
        </p>
      ))}

      {allEmpty ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Бүх сурагч дээр мэдээлэл хоосон байна. Сурагчид үнэхээр дасгал
          хийгээгүй байж болно, эсвэл багшид харуулах эрх нээгдээгүй байж
          болзошгүй — Supabase дээр 055_teacher_reads_student_attempts.sql
          засварыг ажиллуулсан эсэхийг шалгана уу.
        </p>
      ) : null}

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

      <label className="flex max-w-xs flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">
          Давталтын дуусах хугацаа (заавал биш)
        </span>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      {students.length === 0 ? (
        <p className="text-sm text-slate-600">
          Энэ ангид сурагч бүртгэгдээгүй.
        </p>
      ) : (
        students.map((student) => (
          <section
            key={student.studentRowId}
            className="overflow-hidden rounded-2xl ring-1 ring-slate-200"
          >
            <header className="flex flex-wrap items-baseline justify-between gap-2 bg-slate-50 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {student.displayName}
                </h3>
                {student.email ? (
                  <p className="text-xs text-slate-500">{student.email}</p>
                ) : null}
              </div>
              {student.hasData ? (
                <p className="text-xs text-slate-600">
                  {student.totalAttempts} оролдлого · {student.totalWrong} алдаа
                  {student.overallAccuracyPercent != null
                    ? ` · зөв хариултын хувь ${student.overallAccuracyPercent}%`
                    : ""}
                </p>
              ) : null}
            </header>

            <div className="bg-white px-4 py-3">
              {!student.hasData ? (
                <p className="text-sm text-slate-600">
                  {student.noDataReason ?? "Мэдээлэл алга."}
                </p>
              ) : student.weakLessons.length === 0 ? (
                <p className="text-sm text-emerald-800">
                  Бүртгэгдсэн оролдлогод алдаа алга — давтуулах хичээл одоогоор
                  байхгүй.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {student.weakLessons.map((lesson) => (
                    <WeakLessonRow
                      key={lesson.lessonId}
                      student={student}
                      lesson={lesson}
                      busy={
                        busyKey === `${student.studentRowId}|${lesson.lessonId}`
                      }
                      onAssign={(l) => void handleAssign(student, l)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
