"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  WEAK_SPOT_AREA_ICONS,
  WEAK_SPOT_AREA_LABELS,
  MIN_AREA_ATTEMPTS,
  MIN_TOTAL_ATTEMPTS,
  type AreaStat,
} from "@/lib/analytics/weak-spots";
import { isCustomAssignment, type StudentAssignment } from "@/lib/classroom/types";
import { lessonPath } from "@/lib/content";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  computeClassLearnerScore,
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_TONES,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
import { getCurrentUser } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { buildStudentAreaStats, type RawAttempt } from "@/lib/teacher/class-insights";

type Standing = {
  loggedIn: boolean;
  classNames: string[];
  grade: LearnerGradeBucket;
  accuracy: number | null;
  answers: number;
  areas: AreaStat[];
  learnedWords: number;
  lastActiveDays: number | null;
  pending: StudentAssignment[];
  done: StudentAssignment[];
};

async function loadStanding(): Promise<Standing> {
  const empty: Standing = {
    loggedIn: false,
    classNames: [],
    grade: "unrated",
    accuracy: null,
    answers: 0,
    areas: [],
    learnedWords: 0,
    lastActiveDays: null,
    pending: [],
    done: [],
  };
  const { data: user } = await getCurrentUser();
  if (!user || !supabase) return empty;

  const { getStudentAssignments } = await import("@/lib/supabase/classrooms");
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [assignRes, attemptsRes, wordsRes] = await Promise.all([
    getStudentAssignments(),
    supabase
      .from("question_attempts")
      .select(
        "user_id, lesson_id, stage, question_id, question_type, is_correct, selected_answer, correct_answer, created_at"
      )
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(3000),
    supabase
      .from("user_vocabulary_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "learned"),
  ]);

  const all = (assignRes.data ?? []).filter((a) => a.status !== "archived");
  const done = all.filter((a) => a.resultStatus === "completed");
  const pending = all.filter((a) => a.resultStatus !== "completed" && !a.isCurriculum);
  const attempts = (attemptsRes.data ?? []) as RawAttempt[];
  const correct = attempts.filter((a) => a.is_correct).length;
  const accuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : null;
  const latestQuiz =
    [...done]
      .filter((a) => a.quizPercentage != null)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0]
      ?.quizPercentage ?? null;
  const learnedWords = wordsRes.count ?? 0;

  // Багшийн самбарт харагддаг үнэлгээтэй ижил томьёо.
  const score = computeClassLearnerScore({
    quizPercent: latestQuiz ?? (attempts.length >= MIN_TOTAL_ATTEMPTS ? accuracy : null),
    completionRate: all.length > 0 ? Math.round((done.length / all.length) * 100) : 0,
    assignmentsAssigned: all.length,
    assignmentsCompleted: done.length,
    learnedWords,
  });

  const last = attempts[0]?.created_at ?? null;
  return {
    loggedIn: true,
    classNames: [...new Set(all.map((a) => a.classroomName).filter((n): n is string => Boolean(n)))],
    grade: score.grade,
    accuracy,
    answers: attempts.length,
    areas: buildStudentAreaStats(attempts),
    learnedWords,
    lastActiveDays: last
      ? Math.max(0, Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000))
      : null,
    pending,
    done,
  };
}

const GRADE_ADVICE: Record<LearnerGradeBucket, string> = {
  A: "Маш сайн байна! Энэ хэвээрээ үргэлжлүүлээрэй.",
  B: "Сайн байна. Сул хэсгээ бага зэрэг давтвал A болно.",
  C: "Дунд зэрэг. Даалгавраа бүгдийг хийж, сул хэсгээ давтаарай.",
  D: "Хоцорч байна. Өдөр бүр 15 минут хичээлээ хийгээрэй.",
  F: "Нэлээд хоцорсон байна. Өнөөдрөөс эхлээд даалгавраа нэг нэгээр нь хийгээрэй.",
  unrated: "Үнэлэхэд мэдээлэл бага байна. Даалгавар, дасгалаа хийхээр үнэлгээ гарна.",
};

/** Сурагчийн «Миний дүн»: багш ангийн самбар дээр юу харж байгааг сурагч өөрөө харна. */
export function MyStandingView() {
  const locale = useUiLocale();
  const [data, setData] = useState<Standing | null>(null);

  useEffect(() => {
    let alive = true;
    void loadStanding()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive)
          setData({
            loggedIn: true,
            classNames: [],
            grade: "unrated",
            accuracy: null,
            answers: 0,
            areas: [],
            learnedWords: 0,
            lastActiveDays: null,
            pending: [],
            done: [],
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <PublicPageShell>
        <p className="text-sm text-slate-600">{tr(locale, "Ачаалж байна…")}</p>
      </PublicPageShell>
    );
  }

  if (!data.loggedIn) {
    return (
      <PublicPageShell>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">{tr(locale, "Миний дүн")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {tr(locale, "Дүнгээ харахын тулд нэвтэрнэ үү.")}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            {tr(locale, "Нэвтрэх")}
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  const weak = data.areas
    .filter((a) => a.total >= MIN_AREA_ATTEMPTS && a.accuracyPct != null)
    .sort((a, b) => (a.accuracyPct ?? 100) - (b.accuracyPct ?? 100));
  const weakest = weak[0] && (weak[0].accuracyPct ?? 100) < 70 ? weak[0] : null;
  const total = data.pending.length + data.done.length;

  return (
    <PublicPageShell>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {tr(locale, "Миний дүн")}
        </h1>
        <p className="text-sm text-slate-600" translate="no">
          {data.classNames.length > 0
            ? data.classNames.join(", ")
            : tr(locale, "Багш чамайг ингэж харж байна")}
        </p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-4">
          <span
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-black ring-1 ${LEARNER_GRADE_TONES[data.grade]}`}
          >
            {data.grade === "unrated" ? "—" : data.grade}
          </span>
          <div>
            <p className="text-base font-bold text-slate-900">
              {tr(locale, LEARNER_GRADE_LABELS[data.grade])}
            </p>
            <p className="mt-0.5 text-sm leading-5 text-slate-600">
              {tr(locale, GRADE_ADVICE[data.grade])}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              label: "Даалгавар",
              value: total > 0 ? `${data.done.length}/${total}` : "—",
            },
            {
              label: "Зөв хариулт",
              value: data.accuracy != null ? `${data.accuracy}%` : "—",
            },
            { label: "Сурсан үг", value: String(data.learnedWords) },
            {
              label: "Сүүлд хичээл хийсэн",
              value:
                data.lastActiveDays == null
                  ? "—"
                  : data.lastActiveDays === 0
                    ? tr(locale, "Өнөөдөр")
                    : `${data.lastActiveDays} ${tr(locale, "өдрийн өмнө")}`,
            },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] text-slate-500">{tr(locale, m.label)}</dt>
              <dd className="text-lg font-bold tabular-nums text-slate-900">{m.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] leading-4 text-slate-400">
          {tr(
            locale,
            "Үнэлгээ = сүүлийн дасгалын оноо + даалгаврын гүйцэтгэл + сурсан үг. Багшийн самбарт яг ийм харагдана."
          )}
        </p>
      </section>

      {weak.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {tr(locale, "Аль хэсэгт хэр байна?")}
          </h2>
          {weakest ? (
            <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {tr(locale, "Хамгийн сул хэсэг")}: <b>{tr(locale, WEAK_SPOT_AREA_LABELS[weakest.area])}</b>{" "}
              ({weakest.accuracyPct}%) — {tr(locale, "үүнийг түлхүү давтаарай.")}
            </p>
          ) : null}
          <ul className="mt-3 flex flex-col gap-2">
            {weak.map((a) => (
              <li key={a.area} className="flex items-center gap-3 text-sm">
                <span className="w-36 shrink-0 truncate text-slate-700">
                  {WEAK_SPOT_AREA_ICONS[a.area]} {tr(locale, WEAK_SPOT_AREA_LABELS[a.area])}
                </span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className={`block h-full rounded-full ${
                      (a.accuracyPct ?? 0) >= 80
                        ? "bg-emerald-500"
                        : (a.accuracyPct ?? 0) >= 70
                          ? "bg-amber-400"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${a.accuracyPct ?? 0}%` }}
                  />
                </span>
                <b className="w-10 text-right tabular-nums">{a.accuracyPct}%</b>
              </li>
            ))}
          </ul>
          <Link
            href="/review"
            className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
          >
            {tr(locale, "Алдаагаа давтах")} →
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-bold text-slate-900">
          ⏳ {tr(locale, "Хийгээгүй даалгавар")} ({data.pending.length})
        </h2>
        {data.pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            {total > 0
              ? `🎉 ${tr(locale, "Бүх даалгавраа хийсэн байна!")}`
              : tr(locale, "Одоогоор багш даалгавар өгөөгүй байна.")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.pending.map((a) => (
              <li key={a.id}>
                <Link
                  href={isCustomAssignment(a.lessonId) ? "/my-assignments" : lessonPath(a.lessonId)}
                  className="flex items-center justify-between gap-3 rounded-xl bg-orange-50 px-3 py-2.5 text-sm ring-1 ring-orange-200"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900" translate="no">
                      {a.title}
                    </span>
                    <span className="text-xs text-slate-600">
                      {a.dueDate ? `${a.dueDate} ${tr(locale, "хүртэл")}` : tr(locale, "Хугацаагүй")}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                    {tr(locale, "Хийх")} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {data.done.length > 0 ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              ✅ {tr(locale, "Хийсэн даалгавар")} ({data.done.length})
            </summary>
            <ul className="mt-2 flex flex-col gap-1.5">
              {data.done.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate" translate="no">
                    {a.title}
                  </span>
                  {a.quizPercentage != null ? (
                    <b className="shrink-0 tabular-nums">{a.quizPercentage}%</b>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <p className="text-center text-xs text-slate-400">
        <Link href="/rank" className="font-semibold text-emerald-700">
          🏆 {tr(locale, "Ангийн байр харах")}
        </Link>
      </p>
    </PublicPageShell>
  );
}
