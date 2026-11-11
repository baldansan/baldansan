"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import {
  GradeChip,
  Pct,
  WeakAreaChip,
  formatLastActive,
} from "@/components/teacher/class-dashboard/shared";
import { useWorkspaceRole } from "@/components/workspace/workspace-context";
import { WEAK_SPOT_AREA_LABELS } from "@/lib/analytics/weak-spots";
import type { Classroom } from "@/lib/classroom/types";
import type { LearnerGradeBucket } from "@/lib/learner-grade";
import { getTeacherClassrooms } from "@/lib/supabase/classrooms";
import { remindResultText, sendClassPush } from "@/lib/supabase/teacher-extras";
import {
  getClassroomProgressAnalytics,
  getClassroomStudentProgress,
} from "@/lib/supabase/teacher-analytics";
import type {
  ClassroomProgressAnalytics,
  StudentProgressRow,
} from "@/lib/teacher/analytics-types";
import {
  fetchClassInsights,
  type ClassInsights,
  type StudentInsight,
} from "@/lib/teacher/class-insights";

/* ------------------------------------------------------------------ */
/* Сурагчийн байдал — багшид ойлгомжтой 5 ангилал                       */
/* ------------------------------------------------------------------ */

type StudentStatus = "good" | "mid" | "behind" | "inactive" | "new";

const STATUS_META: Record<
  StudentStatus,
  { label: string; chip: string; dot: string; tile: string; hint: string }
> = {
  good: {
    label: "Сайн",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-500",
    tile: "border-emerald-200 bg-emerald-50/70",
    hint: "A, B үнэлгээтэй",
  },
  mid: {
    label: "Дунд",
    chip: "bg-amber-50 text-amber-900 ring-amber-200",
    dot: "bg-amber-400",
    tile: "border-amber-200 bg-amber-50/70",
    hint: "C үнэлгээтэй",
  },
  behind: {
    label: "Хоцорч байна",
    chip: "bg-red-50 text-red-800 ring-red-200",
    dot: "bg-red-500",
    tile: "border-red-200 bg-red-50/70",
    hint: "D, F үнэлгээтэй",
  },
  inactive: {
    label: "7 хоног ороогүй",
    chip: "bg-slate-200 text-slate-700 ring-slate-300",
    dot: "bg-slate-400",
    tile: "border-slate-300 bg-slate-100",
    hint: "Сүүлийн 7 хоногт апп нээгээгүй",
  },
  new: {
    label: "Шинэ",
    chip: "bg-sky-50 text-sky-800 ring-sky-200",
    dot: "bg-sky-400",
    tile: "border-sky-200 bg-sky-50/70",
    hint: "Үнэлэхэд мэдээлэл бага",
  },
};

const STATUS_ORDER: StudentStatus[] = ["behind", "inactive", "mid", "new", "good"];

function statusOf(s: StudentInsight): StudentStatus {
  if (!s.active7d) return "inactive";
  if (s.grade === "A" || s.grade === "B") return "good";
  if (s.grade === "C") return "mid";
  if (s.grade === "D" || s.grade === "F") return "behind";
  return "new";
}

type AllLearner = {
  userId: string;
  displayName: string | null;
  email: string | null;
  grade: LearnerGradeBucket;
  completedLessons: number;
  learnedWords: number;
  activeMinutes: number;
  lastActiveAt: string | null;
};

function learnerName(l: AllLearner): string {
  return (
    l.displayName?.trim() ||
    l.email?.trim() ||
    `Нэргүй суралцагч · ${l.userId.slice(0, 4)}`
  );
}

const CLASS_KEY = "bs.teacher.today.class";

function rememberedClass(): string | null {
  try {
    return window.localStorage.getItem(CLASS_KEY);
  } catch {
    return null;
  }
}

function formatDue(iso: string | null): string {
  if (!iso) return "Хугацаагүй";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Хугацаагүй";
  return `${d.getMonth() + 1}-р сарын ${d.getDate()} хүртэл`;
}

/* ------------------------------------------------------------------ */
/* 4 алхмын заавар                                                      */
/* ------------------------------------------------------------------ */

function StartGuide({
  hasClass,
  hasStudents,
  hasAssignment,
  hasResult,
  classId,
}: {
  hasClass: boolean;
  hasStudents: boolean;
  hasAssignment: boolean;
  hasResult: boolean;
  classId: string | null;
}) {
  const steps = [
    {
      done: hasClass,
      title: "Анги үүсгэх",
      detail: "Ангийн нэр, түвшнээ бичнэ. 1 минут.",
      href: "/teacher/classes/new",
      cta: "Анги үүсгэх",
    },
    {
      done: hasStudents,
      title: "Сурагчаа нэмэх",
      detail: "Ангийн 6 оронтой кодыг сурагчдад өгнө — тэд өөрсдөө нэгдэнэ.",
      href: classId ? `/teacher/classes/${classId}?tab=tools` : "/teacher/classes",
      cta: "Код харах",
    },
    {
      done: hasAssignment,
      title: "Даалгавар өгөх",
      detail: "Хичээл сонгоод «өгөх» дарна. Сурагчийн нүүрэнд «ЗААВАЛ» гэж гарна.",
      href: classId
        ? `/teacher/assignments/new?classroom=${classId}`
        : "/teacher/assignments/new",
      cta: "Даалгавар өгөх",
    },
    {
      done: hasResult,
      title: "Үр дүнг харах",
      detail: "Хэн хийсэн, хэн хийгээгүй, хэн юун дээр алдсаныг эндээс харна.",
      href: "/teacher/assignments",
      cta: "Үр дүн харах",
    },
  ];
  const nextIndex = steps.findIndex((s) => !s.done);
  if (nextIndex === -1) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-slate-900">
        Эхлэх 4 алхам{" "}
        <span className="text-sm font-medium text-slate-500">
          — {nextIndex}/4 хийгдсэн
        </span>
      </h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => {
          const isNext = i === nextIndex;
          return (
            <li
              key={s.title}
              className={`flex flex-col rounded-xl border p-3 ${
                s.done
                  ? "border-emerald-200 bg-emerald-50/60"
                  : isNext
                    ? "border-emerald-400 bg-white ring-2 ring-emerald-100"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    s.done
                      ? "bg-emerald-500 text-white"
                      : isNext
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {s.done ? "✓" : i + 1}
                </span>
                <p className="font-semibold text-slate-900">{s.title}</p>
              </div>
              <p className="mt-2 flex-1 text-[13px] leading-5 text-slate-600">
                {s.detail}
              </p>
              {isNext ? (
                <Link
                  href={s.href}
                  className="mt-3 inline-flex justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {s.cta} →
                </Link>
              ) : s.done ? (
                <p className="mt-3 text-xs font-semibold text-emerald-700">Хийгдсэн</p>
              ) : (
                <p className="mt-3 text-xs text-slate-400">Дараа нь</p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Сурагчид хэрхэн харагдах — жижиг урьдчилсан харагдац                 */
/* ------------------------------------------------------------------ */

function StudentPreviewCard() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">
        Сурагчид ингэж харагдана
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Таны өгсөн даалгавар сурагчийн нүүр хуудасны хамгийн дээр гарч, хийж
        дуустал алга болохгүй.
      </p>
      <div className="mt-3 rounded-2xl border-2 border-orange-300 bg-orange-50 p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700">
          📌 Багшийн даалгавар · Заавал
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">HSK 2 · 5-р хичээл</p>
        <p className="text-xs text-slate-600">Баасан гараг хүртэл</p>
        <span className="mt-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
          Одоо хийх →
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Үндсэн хуудас                                                        */
/* ------------------------------------------------------------------ */

export function TeacherTodayView() {
  const { loggedIn } = useTeacherAuth();
  const role = useWorkspaceRole();

  const [classes, setClasses] = useState<Classroom[] | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<ClassroomProgressAnalytics | null>(null);
  const [progress, setProgress] = useState<StudentProgressRow[]>([]);
  const [insights, setInsights] = useState<ClassInsights | null>(null);
  const [classLoading, setClassLoading] = useState(false);

  const [filter, setFilter] = useState<StudentStatus | "all">("all");
  const [copied, setCopied] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);
  const [allLearners, setAllLearners] = useState<AllLearner[] | null>(null);

  /* --- ангиуд --- */
  useEffect(() => {
    if (!loggedIn) return;
    let alive = true;
    void getTeacherClassrooms().then(({ data, error }) => {
      if (!alive) return;
      const list = (data ?? []).filter((c) => c.status !== "archived");
      setClasses(list);
      setClassError(error);
      const remembered = rememberedClass();
      const pick =
        list.find((c) => c.id === remembered)?.id ?? list[0]?.id ?? null;
      setSelectedId(pick);
    });
    return () => {
      alive = false;
    };
  }, [loggedIn]);

  /* --- сонгосон ангийн мэдээлэл --- */
  const loadClass = useCallback(async (classroomId: string) => {
    setClassLoading(true);
    setInsights(null);
    const [a, p] = await Promise.all([
      getClassroomProgressAnalytics(classroomId),
      getClassroomStudentProgress(classroomId),
    ]);
    setAnalytics(a.data);
    setProgress(p.data ?? []);
    setClassLoading(false);
    const ins = await fetchClassInsights(classroomId, p.data ?? []);
    setInsights(ins.data);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сонгосон анги солигдоход дахин татна
    void loadClass(selectedId);
  }, [selectedId, loadClass]);

  /* --- админд: апп ашиглаж буй бүх хүн --- */
  useEffect(() => {
    if (role !== "admin") return;
    let alive = true;
    fetch("/api/admin/learner-board", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((j: { rows?: AllLearner[] }) => {
        if (alive) setAllLearners(j.rows ?? []);
      })
      .catch(() => {
        if (alive) setAllLearners([]);
      });
    return () => {
      alive = false;
    };
  }, [role]);

  function selectClass(id: string) {
    setSelectedId(id);
    setFilter("all");
    try {
      window.localStorage.setItem(CLASS_KEY, id);
    } catch {
      /* ignore */
    }
  }

  const students = useMemo(() => insights?.students ?? [], [insights]);
  const byStatus = useMemo(() => {
    const map: Record<StudentStatus, StudentInsight[]> = {
      good: [],
      mid: [],
      behind: [],
      inactive: [],
      new: [],
    };
    for (const s of students) map[statusOf(s)].push(s);
    return map;
  }, [students]);

  const rows = useMemo(() => {
    const list = filter === "all" ? students : byStatus[filter];
    return [...list].sort(
      (a, b) =>
        STATUS_ORDER.indexOf(statusOf(a)) - STATUS_ORDER.indexOf(statusOf(b)) ||
        a.name.localeCompare(b.name, "mn")
    );
  }, [students, byStatus, filter]);

  const unlinked = progress.filter((p) => !p.studentUserId);
  const weakestArea = useMemo(() => {
    const areas = (insights?.areas ?? []).filter(
      (a) => a.weakStudents.length > 0 && a.accuracy != null
    );
    areas.sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));
    return areas[0] ?? null;
  }, [insights]);
  const topMissed = insights?.missed?.[0] ?? null;
  const assignments = (analytics?.assignmentSummaries ?? []).filter(
    (a) => !a.isCurriculum
  );

  async function pushInactive() {
    if (!selectedId || byStatus.inactive.length === 0) return;
    setPushing(true);
    const r = await sendClassPush({
      classroomId: selectedId,
      userIds: byStatus.inactive.map((s) => s.userId),
      title: "👋 Багш чинь хүлээж байна",
      body: "Сүүлийн 7 хоногт апп-даа ороогүй байна. Өнөөдөр 10 минут хичээлээ хийгээрэй!",
      url: "/home",
    });
    setPushing(false);
    setPushNote(remindResultText(r));
  }

  async function copyReminder() {
    const names = byStatus.inactive.map((s) => s.name).join(", ");
    const text = `Сайн байна уу? ${names} — та нар сүүлийн 7 хоногт апп-даа ороогүй байна. Өнөөдөр 10 минут ч гэсэн хичээлээ хийгээрэй. Багш нь хүлээж байна 🙂`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  }

  /* ---------------- render ---------------- */

  if (loggedIn === null || (loggedIn && classes === null)) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </TeacherShell>
    );
  }

  if (!loggedIn) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Багшийн ажлын талбар</h1>
          <p className="mt-2 text-sm text-slate-600">
            Анги, сурагч, даалгавраа удирдахын тулд эхлээд нэвтэрнэ үү.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Нэвтрэх
          </Link>
        </section>
      </TeacherShell>
    );
  }

  const classList = classes ?? [];
  const selected = classList.find((c) => c.id === selectedId) ?? null;
  const hasStudents = (analytics?.totalStudents ?? 0) > 0;
  const hasAssignment = (analytics?.assignmentsCount ?? 0) > 0;
  const hasResult = (analytics?.completedAssignmentsCount ?? 0) > 0;

  return (
    <TeacherShell active="help" showBottomNav={false}>
      {/* Гарчиг + анги сонгогч */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Өнөөдөр
            </h1>
            <p className="text-sm text-slate-600">
              {selected
                ? `«${selected.name}» ангийн байдал`
                : "Эхлээд анги үүсгэнэ үү"}
            </p>
          </div>
          {selected ? (
            <Link
              href={`/teacher/assignments/new?classroom=${selected.id}`}
              className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              📝 Даалгавар өгөх
            </Link>
          ) : null}
        </div>

        {classList.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Анги:</span>
            {classList.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectClass(c.id)}
                aria-pressed={c.id === selectedId}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition ${
                  c.id === selectedId
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <span translate="no">{c.name}</span>
                <span className="ml-1.5 text-xs font-normal opacity-70">
                  {c.studentCount ?? 0}
                </span>
              </button>
            ))}
            <Link
              href="/teacher/classes/new"
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-dashed ring-emerald-300 hover:bg-emerald-50"
            >
              + Шинэ анги
            </Link>
          </div>
        ) : null}
        {classError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {classError}
          </p>
        ) : null}
      </header>

      <StartGuide
        hasClass={classList.length > 0}
        hasStudents={hasStudents}
        hasAssignment={hasAssignment}
        hasResult={hasResult}
        classId={selectedId}
      />

      {selected ? (
        <>
          {/* Тоймын 5 хавтан — дарж шүүнэ */}
          <section aria-label="Сурагчдын байдал">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(["good", "mid", "behind", "inactive", "new"] as StudentStatus[]).map(
                (st) => {
                  const meta = STATUS_META[st];
                  const n = byStatus[st].length;
                  const on = filter === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilter(on ? "all" : st)}
                      aria-pressed={on}
                      className={`rounded-2xl border p-3 text-left transition ${meta.tile} ${
                        on ? "ring-2 ring-slate-900" : "hover:brightness-95"
                      }`}
                    >
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </p>
                      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                        {insights ? n : "…"}
                      </p>
                      <p className="text-[11px] text-slate-500">{meta.hint}</p>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Сурагчдын хүснэгт */}
            <section className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Сурагчид{" "}
                  <span className="text-sm font-medium text-slate-500">
                    {filter === "all"
                      ? `(${students.length})`
                      : `— ${STATUS_META[filter].label} (${rows.length})`}
                  </span>
                </h2>
                {filter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Бүгдийг харуулах
                  </button>
                ) : null}
              </div>

              {classLoading || !insights ? (
                <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                  Сурагчдын мэдээллийг ачаалж байна…
                </p>
              ) : students.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <p className="text-sm text-slate-600">
                    Энэ ангид апп-д нэгдсэн сурагч алга.
                    {unlinked.length > 0
                      ? ` ${unlinked.length} сурагч жагсаалтад байгаа ч апп-д нэвтрээгүй байна.`
                      : ""}
                  </p>
                  <Link
                    href={`/teacher/classes/${selected.id}?tab=tools`}
                    className="mt-3 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
                  >
                    Ангийн код харах / сурагч нэмэх →
                  </Link>
                </div>
              ) : (
                <>
                {/* Утас: сурагч бүр нэг карт */}
                <ul className="flex flex-col gap-2 md:hidden">
                  {rows.map((s) => {
                    const meta = STATUS_META[statusOf(s)];
                    return (
                      <li key={s.userId} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/teacher/classes/${selected.id}/students/${s.userId}`}
                            className="min-w-0 truncate text-base font-bold text-slate-900"
                            translate="no"
                          >
                            {s.name}
                          </Link>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${meta.chip}`}
                            >
                              {meta.label}
                            </span>
                            <GradeChip grade={s.grade} />
                          </span>
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span>
                            🕒 {s.lastActiveAt ? formatLastActive(s.lastActiveAt) : "Огт ороогүй"}
                          </span>
                          <span>
                            ✔ <Pct value={s.accuracy} />
                          </span>
                          <span>
                            📝{" "}
                            {s.assignmentsAssigned > 0
                              ? `${s.assignmentsCompleted}/${s.assignmentsAssigned}`
                              : "—"}
                          </span>
                          <WeakAreaChip area={s.weakArea} />
                        </p>
                        <Link
                          href={`/teacher/assignments/new?classroom=${selected.id}&student=${s.userId}`}
                          className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
                        >
                          Даалгавар өгөх
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 md:block">
                  <table className="w-full min-w-[780px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                        <th className="px-3 py-2.5 font-semibold">Сурагч</th>
                        <th className="px-3 py-2.5 font-semibold">Байдал</th>
                        <th className="px-3 py-2.5 font-semibold">Сүүлд орсон</th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Зөв хариулт</th>
                        <th className="px-3 py-2.5 font-semibold">Сул тал</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Даалгавар</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s) => {
                        const st = statusOf(s);
                        const meta = STATUS_META[st];
                        return (
                          <tr
                            key={s.userId}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-3 py-2.5">
                              <Link
                                href={`/teacher/classes/${selected.id}/students/${s.userId}`}
                                className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                                translate="no"
                              >
                                {s.name}
                              </Link>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${meta.chip}`}
                                >
                                  {meta.label}
                                </span>
                                <GradeChip grade={s.grade} />
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                              {s.lastActiveAt ? formatLastActive(s.lastActiveAt) : "Огт ороогүй"}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <Pct value={s.accuracy} />
                            </td>
                            <td className="px-3 py-2.5">
                              <WeakAreaChip area={s.weakArea} />
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                              {s.assignmentsAssigned > 0
                                ? `${s.assignmentsCompleted}/${s.assignmentsAssigned}`
                                : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <Link
                                href={`/teacher/assignments/new?classroom=${selected.id}&student=${s.userId}`}
                                className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
                              >
                                Даалгавар өгөх
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
              {unlinked.length > 0 && students.length > 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  {unlinked.length} сурагч жагсаалтад байгаа ч апп-д нэвтрээгүй тул энд
                  харагдахгүй:{" "}
                  <span translate="no">
                    {unlinked
                      .slice(0, 6)
                      .map((u) => u.displayName)
                      .join(", ")}
                  </span>
                  {unlinked.length > 6 ? "…" : ""}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Нэр дээр дарвал тухайн сурагчийн дэлгэрэнгүй нээгдэнэ. A–F үсэг нь
                дасгалын оноо, дуусгасан хичээл, сурсан үгээр бодсон үнэлгээ.
              </p>
            </section>

            {/* Баруун багана: зөвлөмж, даалгаврууд, урьдчилсан харагдац */}
            <div className="flex min-w-0 flex-col gap-4">
              <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <h2 className="text-sm font-bold text-amber-950">
                  💡 Одоо юу хийх вэ?
                </h2>
                <ul className="mt-2 flex flex-col gap-2.5 text-[13px] leading-5 text-amber-950">
                  {!insights ? (
                    <li className="text-amber-800">Бодож байна…</li>
                  ) : null}
                  {insights && byStatus.inactive.length > 0 ? (
                    <li>
                      <b>{byStatus.inactive.length} сурагч</b> 7 хоног ороогүй:{" "}
                      <span translate="no">
                        {byStatus.inactive
                          .slice(0, 4)
                          .map((s) => s.name)
                          .join(", ")}
                        {byStatus.inactive.length > 4 ? "…" : ""}
                      </span>
                      <br />
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={pushing}
                          onClick={() => void pushInactive()}
                          className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                        >
                          {pushing ? "Илгээж байна…" : "🔔 Утсанд нь сануулга илгээх"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyReminder()}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
                        >
                          {copied ? "Хууллаа ✓" : "Бичвэр хуулах"}
                        </button>
                      </span>
                      {pushNote ? (
                        <span className="mt-1 block rounded-lg bg-white px-2 py-1 text-xs text-slate-700">
                          {pushNote}
                        </span>
                      ) : null}
                    </li>
                  ) : null}
                  {insights && byStatus.behind.length > 0 ? (
                    <li>
                      <b>{byStatus.behind.length} сурагч</b> хоцорч байна. Нэр дээр нь
                      дарж сул хичээлийг нь зөвхөн тэр хүнд даалгавар болгож өгөөрэй.
                      <br />
                      <button
                        type="button"
                        onClick={() => setFilter("behind")}
                        className="mt-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
                      >
                        Тэднийг харуулах
                      </button>
                    </li>
                  ) : null}
                  {weakestArea ? (
                    <li>
                      Анги <b>«{WEAK_SPOT_AREA_LABELS[weakestArea.area]}»</b> дээр хамгийн
                      сул ({weakestArea.accuracy}% зөв) — {weakestArea.weakStudents.length}{" "}
                      сурагчид давтлага хэрэгтэй.
                      <br />
                      <Link
                        href={`/teacher/classes/${selected.id}?tab=weak`}
                        className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
                      >
                        Давтлага өгөх →
                      </Link>
                    </li>
                  ) : null}
                  {topMissed ? (
                    <li>
                      Хамгийн их алдсан асуулт — <b>{Math.round(topMissed.wrongPct)}%</b> нь
                      буруу хариулсан. Хичээл дээрээ тайлбарлаарай.
                      <br />
                      <Link
                        href={`/teacher/classes/${selected.id}?tab=missed`}
                        className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
                      >
                        Асуултуудыг харах →
                      </Link>
                    </li>
                  ) : null}
                  {insights && hasStudents && !hasAssignment ? (
                    <li>
                      Энэ ангид одоогоор <b>даалгавар өгөөгүй</b> байна.
                      <br />
                      <Link
                        href={`/teacher/assignments/new?classroom=${selected.id}`}
                        className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
                      >
                        Эхний даалгавраа өгөх →
                      </Link>
                    </li>
                  ) : null}
                  {insights &&
                  byStatus.inactive.length === 0 &&
                  byStatus.behind.length === 0 &&
                  !weakestArea &&
                  !topMissed &&
                  (hasAssignment || !hasStudents) ? (
                    <li className="text-amber-800">
                      {hasStudents
                        ? "Одоогоор анхаарах зүйл алга. Сурагчид хичээлээ хийх тусам энд зөвлөмж гарна."
                        : "Сурагчид нэгдсэний дараа энд зөвлөмж гарна."}
                    </li>
                  ) : null}
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Миний өгсөн даалгаврууд
                  </h2>
                  <Link
                    href="/teacher/assignments"
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Бүгд →
                  </Link>
                </div>
                {assignments.length === 0 ? (
                  <p className="mt-2 text-[13px] text-slate-500">
                    Одоогоор даалгавар өгөөгүй.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-2.5">
                    {assignments.slice(0, 5).map((a) => (
                      <li key={a.assignmentId}>
                        <Link
                          href={`/teacher/assignments/${a.assignmentId}`}
                          className="block rounded-xl p-2 hover:bg-slate-50"
                        >
                          <p className="truncate text-[13px] font-semibold text-slate-900">
                            {a.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, a.completionRate)}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
                              {a.completedCount}/{a.totalCount} хийсэн
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {formatDue(a.dueDate)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <StudentPreviewCard />
            </div>
          </div>
        </>
      ) : null}

      {/* Админд: апп ашиглаж буй бүх хүн */}
      {role === "admin" ? (
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Апп ашиглаж буй бүх хүн{" "}
                <span className="text-sm font-medium text-slate-500">
                  {allLearners ? `(${allLearners.length})` : ""}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ангид ороогүй хүмүүс ч энд харагдана. Зөвхөн танд (админд) харагдах хэсэг.
              </p>
            </div>
            <Link
              href="/admin/learners"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Бүгдийг дэлгэрэнгүй харах →
            </Link>
          </div>
          {!allLearners ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              Ачаалж байна…
            </p>
          ) : allLearners.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              Одоогоор суралцагч алга.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="px-3 py-2.5 font-semibold">Нэр</th>
                    <th className="px-3 py-2.5 font-semibold">Үнэлгээ</th>
                    <th className="px-3 py-2.5 font-semibold">Сүүлд орсон</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Дуусгасан хичээл</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Сурсан үг</th>
                  </tr>
                </thead>
                <tbody>
                  {[...allLearners]
                    .sort((a, b) =>
                      (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? "")
                    )
                    .slice(0, 12)
                    .map((l) => (
                      <tr
                        key={l.userId}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/learner?user=${l.userId}`}
                            className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                            translate="no"
                          >
                            {learnerName(l)}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <GradeChip grade={l.grade} />
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {l.lastActiveAt ? formatLastActive(l.lastActiveAt) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {l.completedLessons}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {l.learnedWords}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </TeacherShell>
  );
}
