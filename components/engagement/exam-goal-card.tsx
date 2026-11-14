"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { lessonPath } from "@/lib/content";
import { getLessonProgressMapSmart } from "@/lib/progress";
import {
  EXAM_GOAL_EVENT,
  clearExamGoal,
  computeExamPlan,
  fetchLevelLessonIds,
  formatMnDate,
  loadExamGoal,
  saveExamGoal,
  todayYmd,
  type ExamGoal,
  type ExamPlan,
} from "@/lib/study-plan/exam-goal";

type Props = {
  /** "full" — төлөвлөгөөний хуудас (зорилго тавих маягттай); "compact" — нүүрт, зорилготой үед л. */
  variant?: "full" | "compact";
};

type Loaded = { goal: ExamGoal; plan: ExamPlan } | null;

const STATUS_TEXT: Record<ExamPlan["status"], { label: string; tone: string }> = {
  done: { label: "Хичээлээ дуусгасан", tone: "bg-emerald-100 text-emerald-800" },
  ahead: { label: "Төлөвлөгөөнөөс түрүүлж байна", tone: "bg-emerald-100 text-emerald-800" },
  "on-track": { label: "Төлөвлөгөөний дагуу", tone: "bg-emerald-100 text-emerald-800" },
  behind: { label: "Хоцорч байна", tone: "bg-amber-100 text-amber-800" },
  "too-late": { label: "Хугацаа давчуу", tone: "bg-rose-100 text-rose-800" },
  past: { label: "Шалгалтын өдөр өнгөрсөн", tone: "bg-slate-100 text-slate-700" },
};

function addDaysYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayYmd(d);
}

async function buildPlan(goal: ExamGoal): Promise<ExamPlan> {
  const ids = await fetchLevelLessonIds(goal.level);
  const { byLesson } = await getLessonProgressMapSmart(ids);
  const done = new Set(ids.filter((id) => byLesson[id] === "completed"));
  return computeExamPlan(goal, ids, done);
}

export function ExamGoalCard({ variant = "full" }: Props) {
  const [state, setState] = useState<Loaded>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState<ExamGoal["level"]>(3);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [minDate, setMinDate] = useState("");

  const refresh = useCallback(async () => {
    const goal = await loadExamGoal();
    if (!goal) {
      setState(null);
      setReady(true);
      return;
    }
    const plan = await buildPlan(goal);
    setState({ goal, plan });
    setReady(true);
  }, []);

  useEffect(() => {
    let alive = true;
    const run = () => {
      void refresh().catch(() => {
        if (alive) setReady(true);
      });
    };
    run();
    window.addEventListener(EXAM_GOAL_EVENT, run);
    return () => {
      alive = false;
      window.removeEventListener(EXAM_GOAL_EVENT, run);
    };
  }, [refresh]);

  const openEditor = () => {
    setLevel(state?.goal.level ?? 3);
    setDate(state?.goal.examDate ?? addDaysYmd(60));
    setMinDate(addDaysYmd(1));
    setEditing(true);
  };

  const submit = async () => {
    if (!date || busy) return;
    setBusy(true);
    try {
      const ids = await fetchLevelLessonIds(level);
      const { byLesson } = await getLessonProgressMapSmart(ids);
      const startCompleted = ids.filter((id) => byLesson[id] === "completed").length;
      await saveExamGoal({ level, examDate: date, startDate: todayYmd(), startCompleted });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await clearExamGoal();
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  if (variant === "compact") {
    if (!state || state.plan.status === "past") return null;
    const { goal, plan } = state;
    const st = STATUS_TEXT[plan.status];
    return (
      <Link
        href="/study-plan"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-[var(--bs-line)] bg-[var(--bs-card)] p-3 active:scale-[0.99]"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-center leading-none">
          <span className="block text-lg font-extrabold text-emerald-700">{plan.daysLeft}</span>
          <span className="block text-[10px] font-bold text-emerald-700">өдөр</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-[var(--bs-ink)]">
            HSK {goal.level} шалгалт хүртэл
          </span>
          <span className="block truncate text-xs font-semibold text-[var(--bs-muted)]">
            {plan.phase === "review"
              ? "Одоо загвар шалгалт, давтлагын үе"
              : `Долоо хоногт ${plan.lessonsPerWeek} хичээл · ${plan.completed}/${plan.totalLessons} дууссан`}
          </span>
        </span>
        {plan.status === "behind" || plan.status === "too-late" || plan.status === "done" ? (
          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${st.tone}`}>{st.label}</span>
        ) : (
          <span className="shrink-0 text-lg text-[var(--bs-muted)]" aria-hidden>›</span>
        )}
      </Link>
    );
  }

  if (editing || !state) {
    if (!editing) {
      return (
        <section className="bs-study-plan-goal-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/temee/v2/goal-sm.webp" alt="" width={96} height={96} className="float-right -mr-1 -mt-1 ml-2 h-24 w-24 object-contain" />
          <h2 className="bs-study-plan-goal-title">Шалгалтын зорилго</h2>
          <p className="bs-study-plan-goal-msg">
            HSK шалгалтаа хэзээ өгөхөө оруулбал долоо хоногт хэдэн хичээл үзэхийг тооцоолж, хоцорч байгаа эсэхийг чинь
            хэлж өгнө.
          </p>
          <button
            type="button"
            onClick={openEditor}
            className="mt-3 w-full rounded-2xl bg-[#1FB85A] px-4 py-3 text-sm font-extrabold text-white active:scale-[0.99]"
          >
            Зорилго тавих
          </button>
        </section>
      );
    }
    return (
      <section className="bs-study-plan-goal-card">
        <h2 className="bs-study-plan-goal-title">Шалгалтын зорилго</h2>
        <p className="mt-3 text-xs font-bold text-[var(--bs-muted)]">Аль түвшин?</p>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLevel(n)}
              aria-pressed={level === n}
              className={`rounded-xl border py-2 text-sm font-extrabold ${
                level === n
                  ? "border-[#1FB85A] bg-emerald-50 text-emerald-800"
                  : "border-[var(--bs-line)] bg-[var(--bs-card)] text-[var(--bs-ink)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-xs font-bold text-[var(--bs-muted)]" htmlFor="exam-goal-date">
          Шалгалтын өдөр
        </label>
        <input
          id="exam-goal-date"
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--bs-line)] bg-[var(--bs-card)] px-3 py-3 text-base font-bold text-[var(--bs-ink)]"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!date || busy}
            className="flex-1 rounded-2xl bg-[#1FB85A] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Хадгалж байна…" : "Хадгалах"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-2xl border border-[var(--bs-line)] px-4 py-3 text-sm font-bold text-[var(--bs-ink)]"
          >
            Болих
          </button>
        </div>
        {state ? (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="mt-3 w-full text-center text-xs font-bold text-rose-600"
          >
            Зорилгыг устгах
          </button>
        ) : null}
      </section>
    );
  }

  const { goal, plan } = state;
  const st = STATUS_TEXT[plan.status];
  const pct = plan.totalLessons ? Math.round((plan.completed / plan.totalLessons) * 100) : 0;
  const expectedPct = plan.totalLessons ? Math.round((plan.expectedByNow / plan.totalLessons) * 100) : 0;

  let advice: string;
  if (plan.status === "past") advice = "Шалгалтын өдөр өнгөрсөн байна. Дараагийн шалгалтын өдрөө оруулаарай.";
  else if (plan.status === "done")
    advice = "Бүх хичээлээ үзсэн. Одоо загвар шалгалт өгч, алдсан хэсгээ давт.";
  else if (plan.status === "too-late")
    advice = `Үлдсэн ${plan.remaining} хичээлийг ${Math.max(plan.daysLeft, 0)} өдөрт амжуулахад хэцүү. Шалгалтын өдрөө хойшлуулах эсвэл өдөр бүр 2-оос дээш хичээл үзэх хэрэгтэй.`;
  else if (plan.phase === "review")
    advice = "Сүүлийн үе: шинэ хичээлээс илүү загвар шалгалт, үгийн давтлагад цаг гарга.";
  else if (plan.status === "behind")
    advice = `Өнөөдрийг хүртэл ${plan.expectedByNow} хичээл дууссан байх ёстой байсан, одоо ${plan.completed}. Энэ долоо хоногт ${plan.lessonsPerWeek} хичээл үзвэл гүйцнэ.`;
  else
    advice = `Долоо хоногт ${plan.lessonsPerWeek} хичээл үзээд явбал шалгалтаас ${plan.reviewDays} хоногийн өмнө дуусгаж, үлдсэн хугацаанд загвар шалгалт өгнө.`;

  return (
    <section className="bs-study-plan-goal-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="bs-study-plan-goal-title">HSK {goal.level} шалгалт</h2>
          <p className="bs-study-plan-goal-msg">{formatMnDate(goal.examDate)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.tone}`}>{st.label}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-emerald-50 px-2 py-3">
          <p className="text-2xl font-extrabold leading-none text-emerald-700">{Math.max(plan.daysLeft, 0)}</p>
          <p className="mt-1 text-[11px] font-bold text-emerald-800">өдөр үлдсэн</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-2 py-3">
          <p className="text-2xl font-extrabold leading-none text-[var(--bs-ink)]">{plan.remaining}</p>
          <p className="mt-1 text-[11px] font-bold text-[var(--bs-muted)]">хичээл үлдсэн</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-2 py-3">
          <p className="text-2xl font-extrabold leading-none text-[var(--bs-ink)]">{plan.lessonsPerWeek}</p>
          <p className="mt-1 text-[11px] font-bold text-[var(--bs-muted)]">хичээл / 7 хоног</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#1FB85A]" style={{ width: `${pct}%` }} />
          {plan.status !== "done" && plan.status !== "past" ? (
            <span
              className="absolute top-0 h-full w-0.5 bg-slate-500"
              style={{ left: `${Math.min(expectedPct, 99)}%` }}
              aria-hidden
            />
          ) : null}
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-[var(--bs-muted)]">
          {plan.completed}/{plan.totalLessons} хичээл дууссан · саарал зураас — өнөөдөр байх ёстой газар
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--bs-ink)]">{advice}</p>

      <div className="mt-4 flex gap-2">
        {plan.phase === "study" && plan.nextLessonId ? (
          <Link
            href={lessonPath(plan.nextLessonId)}
            className="flex-1 rounded-2xl bg-[#1FB85A] px-4 py-3 text-center text-sm font-extrabold text-white"
          >
            Дараагийн хичээл
          </Link>
        ) : (
          <Link
            href="/review/tests"
            className="flex-1 rounded-2xl bg-[#1FB85A] px-4 py-3 text-center text-sm font-extrabold text-white"
          >
            Загвар шалгалт өгөх
          </Link>
        )}
        <button
          type="button"
          onClick={openEditor}
          className="rounded-2xl border border-[var(--bs-line)] px-4 py-3 text-sm font-bold text-[var(--bs-ink)]"
        >
          Өөрчлөх
        </button>
      </div>
    </section>
  );
}
