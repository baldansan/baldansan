"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AssignmentAttachmentPicker } from "@/components/teacher/assignment-attachment-picker";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import type { Classroom, ClassroomStudent } from "@/lib/classroom/types";
import {
  createAssignment,
  getClassroomStudents,
  getTeacherClassrooms,
} from "@/lib/supabase/classrooms";
import { courseSortKey, prettyCourseTitle } from "@/lib/classroom/course-label";
import {
  createAssignmentSchedule,
  remindResultText,
  sendClassPush,
} from "@/lib/supabase/teacher-extras";
import {
  getSupabaseAssignableLessons,
  type AssignableLesson,
} from "@/lib/supabase/content";

/* ------------------------------------------------------------------ */
/* Даалгаврын төрлүүд — багшид ойлгомжтой нэр, тайлбартай               */
/* ------------------------------------------------------------------ */

type KindKey = "full_lesson" | "vocabulary" | "quiz" | "review" | "watch" | "custom";

const KINDS: { key: KindKey; icon: string; label: string; hint: string }[] = [
  {
    key: "full_lesson",
    icon: "📖",
    label: "Бүтэн хичээл",
    hint: "Үг, яриа, дүрэм, дасгал — хичээлийг бүтнээр нь хийнэ",
  },
  {
    key: "vocabulary",
    icon: "🔤",
    label: "Үг цээжлэх",
    hint: "Сонгосон хичээлийн шинэ үгсийг цээжилнэ",
  },
  {
    key: "quiz",
    icon: "✏️",
    label: "Дасгал ажиллах",
    hint: "Хичээлийн дасгалыг хийж оноо авна",
  },
  {
    key: "review",
    icon: "🔁",
    label: "Давталт",
    hint: "Өмнө үзсэн хичээлээ дахин давтана",
  },
  {
    key: "watch",
    icon: "▶️",
    label: "Бичлэг үзэх",
    hint: "Хичээлийн бичлэг/яриаг үзэж сонсоно",
  },
  {
    key: "custom",
    icon: "📎",
    label: "Өөрийн даалгавар",
    hint: "Та өөрөө бичнэ — файл (PDF, зураг) хавсаргаж болно",
  },
];

const KIND_TITLE: Record<KindKey, string> = {
  full_lesson: "хичээлийг бүтнээр хийх",
  vocabulary: "үгсийг цээжлэх",
  quiz: "дасгалыг ажиллах",
  review: "давтах",
  watch: "бичлэгийг үзэх",
  custom: "",
};

/** Өнөөдрөөс N хоногийн дараах өдөр (YYYY-MM-DD). Товч дарахад л дуудагдана. */
function dateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDue(value: string): string {
  if (!value) return "Хугацаагүй";
  const [, m, d] = value.split("-").map(Number);
  return `${m}-р сарын ${d} хүртэл`;
}

function StepHeader({
  n,
  title,
  current,
  done,
  summary,
  onEdit,
}: {
  n: number;
  title: string;
  current: boolean;
  done: boolean;
  summary?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          done
            ? "bg-emerald-500 text-white"
            : current
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-slate-500"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-bold ${current || done ? "text-slate-900" : "text-slate-400"}`}>
          {title}
        </p>
        {done && summary ? (
          <p className="truncate text-sm text-slate-600" translate="no">
            {summary}
          </p>
        ) : null}
      </div>
      {done && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline"
        >
          Өөрчлөх
        </button>
      ) : null}
    </div>
  );
}

export function AssignmentWizard() {
  const params = useSearchParams();
  const preClass = params.get("classroom") ?? "";
  const preStudent = params.get("student") ?? "";
  const preLesson = params.get("lesson") ?? "";

  const [classes, setClasses] = useState<Classroom[] | null>(null);
  const [classroomId, setClassroomId] = useState(preClass);
  // «Бүх анги» горимд нэмж сонгосон бусад ангиуд — нэг даалгаврыг олон ангид нэг дор.
  const [extraClassIds, setExtraClassIds] = useState<string[]>([]);
  // 0 = давтахгүй. N = дараагийн N хичээлийг долоо хоног бүр автоматаар өгнө.
  const [repeatWeeks, setRepeatWeeks] = useState(0);
  const [afterNote, setAfterNote] = useState<string | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [everyone, setEveryone] = useState(!preStudent);
  const [targetIds, setTargetIds] = useState<string[]>(preStudent ? [preStudent] : []);

  const [lessons, setLessons] = useState<AssignableLesson[]>([]);
  const [kind, setKind] = useState<KindKey>("full_lesson");
  const [course, setCourse] = useState("");
  const [lessonId, setLessonId] = useState(preLesson);
  const [customTitle, setCustomTitle] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");

  const [step, setStep] = useState<1 | 2 | 3>(preClass ? 2 : 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneInfo, setDoneInfo] = useState<{
    id: string;
    title: string;
    who: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    void getTeacherClassrooms().then(({ data }) => {
      if (!alive) return;
      const list = (data ?? []).filter((c) => c.status !== "archived");
      setClasses(list);
      setClassroomId((prev) =>
        prev && list.some((c) => c.id === prev) ? prev : (list[0]?.id ?? "")
      );
    });
    void getSupabaseAssignableLessons()
      .then((list) => {
        if (!alive) return;
        list = list.filter((l) => l.status !== "draft");
        setLessons(list);
        const pre = list.find((l) => l.id === preLesson);
        const first =
          pre ??
          [...list].sort((a, b) =>
            courseSortKey(a.courseId).localeCompare(courseSortKey(b.courseId), "en", { numeric: true })
          )[0];
        if (first) {
          setCourse(first.courseId);
          setLessonId((prev) => (prev && pre ? prev : first.id));
        }
      })
      .catch(() => {
        /* жагсаалт татагдаагүй бол доор мэдэгдэнэ */
      });
    return () => {
      alive = false;
    };
  }, [preLesson]);

  useEffect(() => {
    if (!classroomId) return;
    let alive = true;
    void getClassroomStudents(classroomId).then(({ data }) => {
      if (!alive) return;
      setStudents((data ?? []).filter((s) => s.studentUserId));
    });
    return () => {
      alive = false;
    };
  }, [classroomId]);

  const courses = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    for (const l of lessons) {
      const cur = map.get(l.courseId);
      if (cur) cur.count += 1;
      else
        map.set(l.courseId, {
          id: l.courseId,
          title: prettyCourseTitle(l.courseId, l.courseTitle),
          count: 1,
        });
    }
    return [...map.values()].sort((a, b) =>
      courseSortKey(a.id).localeCompare(courseSortKey(b.id), "en", { numeric: true })
    );
  }, [lessons]);
  // Ангийн хөтөлбөрийн түвшин (жишээ нь HSK 2) байвал номыг тэр түвшнээр нээнэ —
  // багш өөрөө ном/хичээл сонгосон бол хөндөхгүй.
  const [courseTouched, setCourseTouched] = useState(Boolean(preLesson));
  const classCourse =
    classes?.find((c) => c.id === classroomId)?.curriculumCourseId ?? null;
  const effectiveCourse =
    !courseTouched && classCourse && lessons.some((l) => l.courseId === classCourse)
      ? classCourse
      : course;
  const courseLessons = useMemo(
    () => lessons.filter((l) => l.courseId === effectiveCourse),
    [lessons, effectiveCourse]
  );
  const lesson =
    courseLessons.find((l) => l.id === lessonId) ?? courseLessons[0] ?? null;
  const selectedClass = classes?.find((c) => c.id === classroomId) ?? null;

  const whoLabel = useMemo(() => {
    if (!selectedClass) return "";
    if (everyone || targetIds.length === 0) {
      const others = (classes ?? []).filter((c) => extraClassIds.includes(c.id));
      return others.length > 0
        ? `${[selectedClass, ...others].map((c) => `«${c.name}»`).join(", ")} — бүх сурагч`
        : `«${selectedClass.name}» — бүх сурагч`;
    }
    const names = targetIds.map((id) => {
      const s = students.find((x) => x.studentUserId === id);
      return s?.displayName ?? s?.email ?? "сурагч";
    });
    const shown =
      names.length <= 3
        ? names.join(", ")
        : `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
    return `«${selectedClass.name}» — ${shown}`;
  }, [selectedClass, everyone, targetIds, students, classes, extraClassIds]);

  const title =
    kind === "custom"
      ? customTitle.trim()
      : lesson
        ? `${lesson.title} — ${KIND_TITLE[kind]}`
        : "";
  const whatLabel =
    kind === "custom"
      ? customTitle.trim() || "Өөрийн даалгавар"
      : `${KINDS.find((k) => k.key === kind)?.label} · ${lesson?.title ?? ""}`;

  const step1Ok = Boolean(classroomId) && (everyone || targetIds.length > 0);
  const step2Ok = kind === "custom" ? customTitle.trim().length > 0 : Boolean(lesson);

  function toggleStudent(id: string) {
    setTargetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Давтахад өгөх дараагийн хичээлүүд (сонгосон хичээлийн дараахаас).
  const lessonIndex = lesson ? courseLessons.findIndex((l) => l.id === lesson.id) : -1;
  const upcoming =
    lessonIndex >= 0 ? courseLessons.slice(lessonIndex + 1, lessonIndex + 1 + repeatWeeks) : [];
  const canRepeat = kind !== "custom" && everyone && lessonIndex >= 0 &&
    lessonIndex < courseLessons.length - 1;

  async function submit() {
    if (!step1Ok || !step2Ok || !title) return;
    setSaving(true);
    setError(null);
    setAfterNote(null);
    const wholeClass = everyone || targetIds.length === 0;
    const classIds = wholeClass ? [classroomId, ...extraClassIds] : [classroomId];
    const recipients: (string | null)[] = wholeClass ? [null] : targetIds;
    let firstId: string | null = null;
    let created = 0;
    let failure: string | null = null;
    // Сонгосон сурагч бүрт тусдаа мөр — ангийн бусад сурагчид харагдахгүй.
    outer: for (const cid of classIds) {
      for (const target of recipients) {
        const { data, error: createError } = await createAssignment({
          classroomId: cid,
          lessonId: kind === "custom" ? null : (lesson?.id ?? lessonId),
          assignmentType: kind === "custom" ? "review" : kind,
          title,
          instructions,
          dueDate: dueDate || undefined,
          targetStudentUserId: target,
          attachment: kind === "custom" ? attachment : null,
        });
        if (!data) {
          failure = createError ?? "Даалгавар үүсгэж чадсангүй.";
          break outer;
        }
        created += 1;
        firstId = firstId ?? data.id;
      }
    }
    if (created === 0 || !firstId) {
      setSaving(false);
      setError(failure ?? "Даалгавар үүсгэж чадсангүй.");
      return;
    }
    if (failure) setError(`${created} даалгавар өгсөн ч үлдсэнд алдаа гарлаа: ${failure}`);

    const notes: string[] = [];
    // Долоо хоног бүрийн автомат даалгавар.
    if (canRepeat && upcoming.length > 0) {
      let scheduled = 0;
      let missing = false;
      for (const cid of classIds) {
        const res = await createAssignmentSchedule({
          classroomId: cid,
          lessonIds: upcoming.map((l) => l.id),
          lessonTitles: upcoming.map((l) => l.title),
          assignmentType: kind,
          instructions,
          firstInDays: 7,
          intervalDays: 7,
          dueDays: 7,
        });
        if (res.ok) scheduled += 1;
        if (res.missing) missing = true;
      }
      notes.push(
        scheduled > 0
          ? `🔁 Дараагийн ${upcoming.length} хичээл долоо хоног бүр автоматаар өгөгдөнө.`
          : missing
            ? "🔁 Автомат давталт асаагүй — 091 SQL файлыг ажиллуулсны дараа боломжтой болно."
            : "🔁 Автомат давталтыг тохируулж чадсангүй."
      );
    }
    // Сурагчдын утас руу мэдэгдэл.
    let reached = 0;
    let targets = 0;
    let configured = true;
    for (const cid of classIds) {
      const r = await sendClassPush({
        classroomId: cid,
        userIds: wholeClass ? undefined : targetIds,
        title: "📌 Багшийн шинэ даалгавар",
        body: title,
        url: "/home",
      });
      reached += r.reached;
      targets += r.targets;
      configured = configured && r.configured;
    }
    notes.push(
      `🔔 ${remindResultText({ ok: true, configured, targets, reached })}`
    );
    setAfterNote(notes.join("\n"));
    setSaving(false);
    setDoneInfo({ id: firstId, title, who: whoLabel });
  }

  function reset() {
    setDoneInfo(null);
    setError(null);
    setAfterNote(null);
    setRepeatWeeks(0);
    setCustomTitle("");
    setInstructions("");
    setAttachment(null);
    setStep(2);
  }

  /* ---------------- render ---------------- */

  if (classes === null) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </TeacherShell>
    );
  }

  if (classes.length === 0) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-base font-semibold text-slate-900">
            Даалгавар өгөхийн тулд эхлээд анги хэрэгтэй
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Анги үүсгээд сурагчдаа нэмсний дараа даалгавар өгнө.
          </p>
          <Link
            href="/teacher/classes/new"
            className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            + Анги үүсгэх
          </Link>
        </section>
      </TeacherShell>
    );
  }

  if (doneInfo) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <section className="mx-auto w-full max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-4xl" aria-hidden>
            ✅
          </p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Даалгавар өглөө</h1>
          <p className="mt-2 text-sm text-slate-700" translate="no">
            <b>{doneInfo.title}</b>
            <br />
            {doneInfo.who} · {formatDue(dueDate)}
          </p>
          <p className="mt-3 text-[13px] text-slate-600">
            Сурагчийн нүүр хуудасны хамгийн дээр «БАГШИЙН ДААЛГАВАР · ЗААВАЛ» гэж
            гарсан. Хийж дуустал тэндээ байна.
          </p>
          {afterNote ? (
            <p className="mt-3 whitespace-pre-line rounded-lg bg-white px-3 py-2 text-left text-[13px] leading-6 text-slate-700 ring-1 ring-emerald-200">
              {afterNote}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href={`/teacher/assignments/${doneInfo.id}`}
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Үр дүнг харах →
            </Link>
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              + Өөр даалгавар өгөх
            </button>
            <Link
              href="/teacher/today"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Өнөөдөр рүү буцах
            </Link>
          </div>
        </section>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Даалгавар өгөх</h1>
        <p className="text-sm text-slate-600">3 алхам: хэнд → юу → хэзээ</p>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {/* ---------- 1. ХЭНД ---------- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <StepHeader
            n={1}
            title="Хэнд өгөх вэ?"
            current={step === 1}
            done={step > 1 && step1Ok}
            summary={whoLabel}
            onEdit={() => setStep(1)}
          />
          {step === 1 ? (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Анги</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (c.id === classroomId) return;
                        if (everyone && classroomId) {
                          // «Бүх анги» горимд дарах бүрд нэмж/хасна — олон ангид нэг дор.
                          setExtraClassIds((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          );
                          return;
                        }
                        setClassroomId(c.id);
                        setExtraClassIds([]);
                        setTargetIds([]);
                      }}
                      aria-pressed={c.id === classroomId || extraClassIds.includes(c.id)}
                      className={`rounded-xl px-4 py-2.5 text-left text-sm ring-1 transition ${
                        c.id === classroomId || extraClassIds.includes(c.id)
                          ? "bg-emerald-50 font-semibold text-emerald-900 ring-2 ring-emerald-500"
                          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {c.id === classroomId || extraClassIds.includes(c.id) ? "✓ " : ""}
                      <span translate="no">{c.name}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {c.studentCount ?? 0} сурагч
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {classes.length > 1 ? (
                  <p className="-mt-2 mb-3 text-xs text-slate-500">
                    Нэг даалгаврыг хэд хэдэн ангид нэг дор өгөх бол ангиудаа дараалан дарж
                    сонгоно.{" "}
                    {extraClassIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExtraClassIds([])}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Зөвхөн нэг анги болгох
                      </button>
                    ) : null}
                  </p>
                ) : null}
                <p className="text-sm font-semibold text-slate-700">Хэн хийх вэ?</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setEveryone(true)}
                    aria-pressed={everyone}
                    className={`rounded-xl p-3 text-left ring-1 ${
                      everyone
                        ? "bg-emerald-50 ring-2 ring-emerald-500"
                        : "bg-white ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">👥 Бүх анги</p>
                    <p className="text-xs text-slate-600">Ангийн бүх сурагч хийнэ</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEveryone(false);
                      setExtraClassIds([]);
                    }}
                    aria-pressed={!everyone}
                    className={`rounded-xl p-3 text-left ring-1 ${
                      !everyone
                        ? "bg-emerald-50 ring-2 ring-emerald-500"
                        : "bg-white ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">🙋 Сонгосон сурагчид</p>
                    <p className="text-xs text-slate-600">
                      Зөвхөн тэдэнд харагдана — бусад нь мэдэхгүй
                    </p>
                  </button>
                </div>
                {!everyone ? (
                  students.length === 0 ? (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Энэ ангид апп-д нэгдсэн сурагч алга. Эхлээд ангийн кодоор
                      сурагчдаа нэгтгэнэ үү.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {students.map((s) => {
                        const id = s.studentUserId as string;
                        const on = targetIds.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleStudent(id)}
                            aria-pressed={on}
                            translate="no"
                            className={`rounded-full px-3 py-1.5 text-sm ring-1 ${
                              on
                                ? "bg-emerald-600 font-semibold text-white ring-emerald-600"
                                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {on ? "✓ " : ""}
                            {s.displayName ?? s.email ?? "Сурагч"}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : null}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!step1Ok}
                  onClick={() => setStep(2)}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Дараах: юу өгөх →
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* ---------- 2. ЮУ ---------- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <StepHeader
            n={2}
            title="Юу хийлгэх вэ?"
            current={step === 2}
            done={step > 2 && step2Ok}
            summary={whatLabel}
            onEdit={() => setStep(2)}
          />
          {step === 2 ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {KINDS.map((k) => (
                  <button
                    key={k.key}
                    type="button"
                    onClick={() => setKind(k.key)}
                    aria-pressed={kind === k.key}
                    className={`rounded-xl p-3 text-left ring-1 transition ${
                      kind === k.key
                        ? "bg-emerald-50 ring-2 ring-emerald-500"
                        : "bg-white ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">
                      <span aria-hidden>{k.icon}</span> {k.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-slate-600">{k.hint}</p>
                  </button>
                ))}
              </div>

              {kind === "custom" ? (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Даалгаврын нэр</span>
                    <input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Жишээ: 3-р бүлгийн үгсийг 5 удаа бичих"
                      className="rounded-xl border border-slate-300 px-3 py-2.5"
                    />
                  </label>
                  <AssignmentAttachmentPicker value={attachment} onChange={setAttachment} />
                </div>
              ) : lessons.length === 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Хичээлийн жагсаалтыг татаж байна… Удаан байвал хуудсаа дахин ачаална уу.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Ном / түвшин</span>
                    <select
                      value={effectiveCourse}
                      onChange={(e) => {
                        setCourseTouched(true);
                        setCourse(e.target.value);
                        const first = lessons.find((l) => l.courseId === e.target.value);
                        if (first) setLessonId(first.id);
                      }}
                      className="rounded-xl border border-slate-300 px-3 py-2.5"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.count})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Хичээл</span>
                    <select
                      value={lesson?.id ?? ""}
                      onChange={(e) => {
                        setCourseTouched(true);
                        setCourse(effectiveCourse);
                        setLessonId(e.target.value);
                      }}
                      className="rounded-xl border border-slate-300 px-3 py-2.5"
                    >
                      {courseLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  {lesson ? (
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      Сурагчид яг юу харагдахыг шалгах бол:{" "}
                      <a
                        href={`/lessons/${lesson.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        хичээлийг шинэ цонхонд нээх ↗
                      </a>
                    </p>
                  ) : null}
                </div>
              )}

              {selectedClass ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  Өөр төрлийн ажил өгөх бол:{" "}
                  <Link
                    href={`/teacher/classes/${selectedClass.id}/exams`}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    📝 HSK загвар шалгалт
                  </Link>
                  {" · "}
                  <Link
                    href={`/teacher/classes/${selectedClass.id}?tab=quiz`}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    ⚡ Хурдан сорил
                  </Link>
                  {" · "}
                  <Link
                    href={`/teacher/classes/${selectedClass.id}?tab=assign`}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    ✍️ Ханз бичих даалгавар
                  </Link>
                </p>
              ) : null}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ← Буцах
                </button>
                <button
                  type="button"
                  disabled={!step2Ok}
                  onClick={() => setStep(3)}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Дараах: хэзээ →
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* ---------- 3. ХЭЗЭЭ ---------- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <StepHeader n={3} title="Хэзээ гэхэд хийх вэ?" current={step === 3} done={false} />
          {step === 3 ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "Маргааш", days: 1 },
                  { label: "3 хоногт", days: 3 },
                  { label: "7 хоногт", days: 7 },
                ].map((q) => (
                  <button
                    key={q.days}
                    type="button"
                    onClick={() => setDueDate(dateInDays(q.days))}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    {q.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  aria-pressed={!dueDate}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
                    !dueDate
                      ? "bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Хугацаагүй
                </button>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-label="Дуусах өдөр"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {canRepeat ? (
                <div className="rounded-xl bg-slate-50 p-3">
                  <label className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-700">
                      🔁 Дараагийн хичээлүүдийг долоо хоног бүр автоматаар өгөх:
                    </span>
                    <select
                      value={repeatWeeks}
                      onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value={0}>Үгүй, зөвхөн энэ удаа</option>
                      {[2, 4, 6, 8, 12].map((n) => (
                        <option key={n} value={n}>
                          Тийм — дараагийн {n} хичээл
                        </option>
                      ))}
                    </select>
                  </label>
                  {repeatWeeks > 0 ? (
                    <p className="mt-2 text-xs leading-5 text-slate-600" translate="no">
                      7 хоног тутам нэг хичээл: {upcoming.map((l) => l.title).join(" → ")}
                      {upcoming.length < repeatWeeks ? " (энэ номын хичээл дууслаа)" : ""}. Хүссэн
                      үедээ «Даалгавар» хуудаснаас зогсооно.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-700">
                  Сурагчид бичих үг{" "}
                  <span className="font-normal text-slate-500">(заавал биш)</span>
                </span>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="Жишээ: Үгсээ чангаар уншаарай. Дасгал дээр 80%-иас дээш авах хэрэгтэй."
                  className="rounded-xl border border-slate-300 px-3 py-2.5"
                />
              </label>

              <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700">
                  📌 Сурагчид ингэж харагдана · Багшийн даалгавар · Заавал
                </p>
                <p className="mt-1 text-base font-bold text-slate-900" translate="no">
                  {title}
                </p>
                <p className="text-sm text-slate-600" translate="no">
                  {whoLabel} · {formatDue(dueDate)}
                </p>
                {instructions.trim() ? (
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700" translate="no">
                    {instructions}
                  </p>
                ) : null}
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              ) : null}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ← Буцах
                </button>
                <button
                  type="button"
                  disabled={saving || !step1Ok || !step2Ok}
                  onClick={() => void submit()}
                  className="rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
                >
                  {saving ? "Илгээж байна…" : "✓ Даалгавар өгөх"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </TeacherShell>
  );
}
