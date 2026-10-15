"use client";

import { useEffect, useMemo, useState } from "react";

import { AssignmentAttachmentPicker } from "@/components/teacher/assignment-attachment-picker";
import { ASSIGNMENT_TYPES } from "@/lib/classroom/types";
import type { ClassroomStudent } from "@/lib/classroom/types";
import {
  createAssignment,
  getClassroomStudents,
} from "@/lib/supabase/classrooms";
import {
  getSupabaseAssignableLessons,
  type AssignableLesson,
} from "@/lib/supabase/content";

/** Самбараас (сул тал, алдсан асуулт) даалгаврыг урьдчилан бөглөх зорилготой. */
export type ComposerPrefill = {
  /** Өөрчлөгдөх бүрт composer дахин бөглөгдөнө. */
  key: number;
  studentUserIds: string[];
  lessonId?: string | null;
  assignmentType?: string;
  title?: string;
  instructions?: string;
};

type Props = {
  classroomId: string;
  onCreated?: () => void;
  prefill?: ComposerPrefill | null;
  /** Өгвөл зөвхөн эдгээр сурагчид онилно (сурагчийн дэлгэрэнгүй хуудас). */
  lockedStudentIds?: string[];
  lockedLabel?: string;
};

type Mode = "lesson" | "custom";

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  full_lesson: "Бүтэн хичээл",
  watch: "Бичлэг үзэх",
  vocabulary: "Үгсийн сан",
  quiz: "Дасгал",
  review: "Давталт",
};

export function ClassAssignmentComposer({
  classroomId,
  onCreated,
  prefill = null,
  lockedStudentIds,
  lockedLabel,
}: Props) {
  const [mode, setMode] = useState<Mode>("lesson");
  const [lessons, setLessons] = useState<AssignableLesson[]>([]);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [assignmentType, setAssignmentType] = useState("full_lesson");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  // Хоосон = бүх анги. Утгатай = сонгосон сурагч бүрт тусдаа даалгавар үүснэ.
  const [targetIds, setTargetIds] = useState<string[]>(lockedStudentIds ?? []);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  // Даалгавар амжилттай үүссэний дараа file input-ыг цэвэрлэхэд ашиглана.
  const [attachmentResetKey, setAttachmentResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await getSupabaseAssignableLessons();
        if (cancelled) return;
        setLessons(list);
        setLessonId((prev) => prev || list[0]?.id || "");
      } catch (err) {
        if (cancelled) return;
        setLessonsError(
          err instanceof Error
            ? err.message
            : "Хичээлийн жагсаалтыг татаж чадсангүй."
        );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await getClassroomStudents(classroomId);
      if (cancelled) return;
      // Зөвхөн апп дээрх бүртгэлтэй холбогдсон сурагчийг онилж болно.
      setStudents((data ?? []).filter((s) => s.studentUserId));
    })();
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  useEffect(() => {
    if (!prefill) return;
    setTargetIds(prefill.studentUserIds);
    if (prefill.lessonId) {
      setMode("lesson");
      setLessonId(prefill.lessonId);
    } else {
      setMode("custom");
    }
    if (prefill.assignmentType) setAssignmentType(prefill.assignmentType);
    if (prefill.title != null) {
      setTitle(prefill.title);
      setTitleTouched(true);
    }
    if (prefill.instructions != null) setInstructions(prefill.instructions);
    setNotice(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.key]);

  const groupedLessons = useMemo(() => {
    const groups = new Map<string, AssignableLesson[]>();
    for (const lesson of lessons) {
      const key = lesson.courseTitle ?? lesson.courseId ?? "—";
      const list = groups.get(key);
      if (list) list.push(lesson);
      else groups.set(key, [lesson]);
    }
    return [...groups.entries()];
  }, [lessons]);

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === lessonId) ?? null,
    [lessons, lessonId]
  );

  const targetLabel = useMemo(() => {
    if (lockedStudentIds && lockedLabel) return lockedLabel;
    if (targetIds.length === 0) return "";
    const names = targetIds.map((id) => {
      const found = students.find((s) => s.studentUserId === id);
      return found?.displayName ?? found?.email ?? "сурагч";
    });
    return names.length <= 3
      ? names.join(", ")
      : `${names.slice(0, 3).join(", ")} болон бусад ${names.length - 3}`;
  }, [students, targetIds, lockedStudentIds, lockedLabel]);

  function toggleTarget(id: string) {
    setTargetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Багш гарчгаа гараар бичээгүй байвал сонгосон хичээлээр санал болгоно.
  const effectiveTitle =
    titleTouched || mode !== "lesson" || !selectedLesson
      ? title
      : `${selectedLesson.title} — даалгавар`;

  async function handleSubmit() {
    if (!effectiveTitle.trim()) return;
    if (mode === "lesson" && !lessonId) {
      setError("Хичээл сонгоно уу.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);

    const recipients: (string | null)[] =
      targetIds.length > 0 ? targetIds : [null];
    let created = 0;
    let firstTitle = effectiveTitle.trim();
    let failure: string | null = null;
    let attachmentWarning: string | null = null;

    // Сурагч бүрт тусдаа мөр (target_student_user_id) — бусад сурагчид харагдахгүй.
    for (const target of recipients) {
      const { data, error: createError } = await createAssignment({
        classroomId,
        // Хичээл хавсраагүй даалгаварт NULL бичнэ — хиймэл 'custom' утга хэрэггүй.
        lessonId: mode === "lesson" ? lessonId : null,
        assignmentType: mode === "lesson" ? assignmentType : "review",
        title: effectiveTitle,
        instructions,
        dueDate: dueDate || undefined,
        targetStudentUserId: target,
        attachment,
      });
      if (!data) {
        failure = createError ?? "Даалгавар үүсгэж чадсангүй.";
        break;
      }
      created += 1;
      firstTitle = data.title;
      if (createError) attachmentWarning = createError;
    }

    setSaving(false);
    if (created === 0) {
      setError(failure ?? "Даалгавар үүсгэж чадсангүй.");
      return;
    }
    if (failure) {
      setError(`${created} сурагчид өгсөн ч үлдсэнд алдаа гарлаа: ${failure}`);
    } else if (attachmentWarning) {
      // Даалгавар үүссэн ч хавсралт байршуулахад алдаа гарсан тохиолдол.
      setError(`Даалгавар үүссэн ч файл хавсаргаж чадсангүй: ${attachmentWarning}`);
    } else {
      setError(null);
    }

    setNotice(
      targetIds.length > 0
        ? `«${firstTitle}» даалгаврыг ${targetLabel} (${created} сурагч)-д өглөө. Ангийн бусад сурагчид харагдахгүй.`
        : `«${firstTitle}» даалгаврыг ангид өглөө.`
    );
    setTitle("");
    setTitleTouched(false);
    setInstructions("");
    setDueDate("");
    setAttachment(null);
    setAttachmentResetKey((k) => k + 1);
    setTargetIds(lockedStudentIds ?? []);
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("lesson")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            mode === "lesson"
              ? "bg-emerald-500 text-white"
              : "border border-slate-200 text-slate-600 hover:text-emerald-700"
          }`}
        >
          Бэлэн хичээл өгөх
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            mode === "custom"
              ? "bg-emerald-500 text-white"
              : "border border-slate-200 text-slate-600 hover:text-emerald-700"
          }`}
        >
          Өөрөө даалгавар бичих
        </button>
      </div>

      {mode === "lesson" ? (
        <>
          {lessonsError ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {lessonsError}
            </p>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Хичээл сонгох</span>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              required
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              {lessons.length === 0 ? (
                <option value="">Хичээл олдсонгүй</option>
              ) : null}
              {groupedLessons.map(([courseLabel, items]) => (
                <optgroup key={courseLabel} label={courseLabel}>
                  {items.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title} ({lesson.id})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Даалгаврын төрөл</span>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              {ASSIGNMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ASSIGNMENT_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Хичээл хавсаргахгүй — ангид хийх буюу гэрийн даалгаврыг өөрийн үгээр
          бичнэ. Сурагчид даалгаврын жагсаалтдаа гарчиг, зааврыг харна.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Гарчиг</span>
        <input
          value={effectiveTitle}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleTouched(true);
          }}
          required
          placeholder={
            mode === "custom" ? "Жишээ: 3-р бүлгийн үгийн цээж бичиг" : undefined
          }
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Заавар</span>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          placeholder={
            mode === "custom"
              ? "Юу хийх, хэрхэн шалгахаа бичнэ үү."
              : undefined
          }
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
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

      {lockedStudentIds ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
          Энэ даалгавар зөвхөн {targetLabel || "сонгосон сурагч"}-д харагдана.
        </p>
      ) : (
        <>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="font-medium text-slate-700">Хэнд өгөх</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTargetIds([])}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                  targetIds.length === 0
                    ? "bg-emerald-500 text-white"
                    : "border border-slate-200 text-slate-600"
                }`}
              >
                Бүх анги
              </button>
              <button
                type="button"
                onClick={() =>
                  setTargetIds((prev) =>
                    prev.length > 0 ? prev : students[0]?.studentUserId ? [students[0].studentUserId] : prev
                  )
                }
                disabled={students.length === 0}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                  targetIds.length > 0
                    ? "bg-emerald-500 text-white"
                    : "border border-slate-200 text-slate-600"
                }`}
              >
                Сонгосон сурагчид{targetIds.length > 0 ? ` (${targetIds.length})` : ""}
              </button>
            </div>
            {targetIds.length > 0 ? (
              <ul className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
                {students.map((s) => {
                  const id = s.studentUserId ?? "";
                  return (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={targetIds.includes(id)}
                          onChange={() => toggleTarget(id)}
                        />
                        <span className="truncate">{s.displayName ?? s.email ?? "Сурагч"}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </fieldset>

          {targetIds.length > 0 ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
              Сурагч бүрт тусдаа даалгавар үүснэ — зөвхөн {targetLabel} харна. Ангийн бусад
              сурагчид гарчиг нь ч харагдахгүй.
            </p>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Ангийн бүх сурагч энэ даалгаврыг харна.
            </p>
          )}
        </>
      )}

      {students.length === 0 ? (
        <p className="text-xs text-slate-500">
          Нэг сурагчид онилж өгөхийн тулд тухайн сурагчийн апп дээрх бүртгэлийг
          ангийн жагсаалттай холбосон байх шаардлагатай.
        </p>
      ) : null}

      <AssignmentAttachmentPicker
        key={attachmentResetKey}
        value={attachment}
        onChange={setAttachment}
        disabled={saving}
      />

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
        {saving
          ? "Өгч байна…"
          : targetIds.length > 0
            ? `${targetIds.length} сурагчид даалгавар өгөх`
            : "Ангид даалгавар өгөх"}
      </button>

      <p className="text-xs text-slate-500">
        Хавсаргасан файлыг зөвхөн энэ даалгаврыг харж буй хүн татна.
      </p>
    </form>
  );
}
