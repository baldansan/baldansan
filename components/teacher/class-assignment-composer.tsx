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

type Props = {
  classroomId: string;
  onCreated?: () => void;
};

type Mode = "lesson" | "custom";

/** «Бүх анги» сонголтын утга — сурагчийн ID-тай давхцахгүй. */
const WHOLE_CLASS = "";

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  full_lesson: "Бүтэн хичээл",
  watch: "Бичлэг үзэх",
  vocabulary: "Үгсийн сан",
  quiz: "Дасгал",
  review: "Давталт",
};

export function ClassAssignmentComposer({ classroomId, onCreated }: Props) {
  const [mode, setMode] = useState<Mode>("lesson");
  const [lessons, setLessons] = useState<AssignableLesson[]>([]);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [assignmentType, setAssignmentType] = useState("full_lesson");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [targetStudentUserId, setTargetStudentUserId] = useState(WHOLE_CLASS);
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
    if (!targetStudentUserId) return "";
    const found = students.find(
      (s) => s.studentUserId === targetStudentUserId
    );
    return found?.displayName ?? found?.email ?? "сонгосон";
  }, [students, targetStudentUserId]);

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

    const { data, error: createError } = await createAssignment({
      classroomId,
      // Хичээл хавсраагүй даалгаварт NULL бичнэ — хиймэл 'custom' утга хэрэггүй.
      lessonId: mode === "lesson" ? lessonId : null,
      assignmentType: mode === "lesson" ? assignmentType : "review",
      title: effectiveTitle,
      instructions,
      dueDate: dueDate || undefined,
      targetStudentUserId: targetStudentUserId || null,
      attachment,
    });

    setSaving(false);
    if (!data) {
      setError(createError ?? "Даалгавар үүсгэж чадсангүй.");
      return;
    }
    if (createError) {
      // Даалгавар үүссэн ч хавсралт байршуулахад алдаа гарсан тохиолдол.
      setError(`Даалгавар үүссэн ч файл хавсаргаж чадсангүй: ${createError}`);
    } else {
      setError(null);
    }

    setNotice(
      targetStudentUserId
        ? `«${data.title}» даалгаврыг ${targetLabel} сурагчид өглөө. Ангийн бусад сурагчид энэ даалгавар харагдахгүй.`
        : `«${data.title}» даалгаврыг ангид өглөө.`
    );
    setTitle("");
    setTitleTouched(false);
    setInstructions("");
    setDueDate("");
    setAttachment(null);
    setAttachmentResetKey((k) => k + 1);
    setTargetStudentUserId(WHOLE_CLASS);
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

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Хэнд өгөх</span>
        <select
          value={targetStudentUserId}
          onChange={(e) => setTargetStudentUserId(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value={WHOLE_CLASS}>Бүх анги</option>
          {students.map((s) => (
            <option key={s.id} value={s.studentUserId ?? ""}>
              {s.displayName ?? s.email ?? "Сурагч"}
            </option>
          ))}
        </select>
      </label>

      {targetStudentUserId ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
          Энэ даалгавар болон хавсралтыг зөвхөн {targetLabel} харна. Ангийн
          бусад сурагчид гарчиг нь ч харагдахгүй.
        </p>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Ангийн бүх сурагч энэ даалгаврыг харна.
        </p>
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
        {saving ? "Өгч байна…" : "Ангид даалгавар өгөх"}
      </button>

      <p className="text-xs text-slate-500">
        Хавсаргасан файлыг зөвхөн энэ даалгаврыг харж буй хүн татна.
      </p>
    </form>
  );
}
