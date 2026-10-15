"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { POINTS_AWARDED_EVENT } from "@/lib/points/award";
import {
  effectiveStatus,
  getQuizForStudent,
  startClassQuiz,
  submitClassQuiz,
  type ClassQuiz,
  type QuizSubmitResult,
  type StudentQuizQuestion,
} from "@/lib/supabase/class-quizzes";

type Phase = "loading" | "error" | "intro" | "running" | "submitting" | "done" | "already";

function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function draftKey(quizId: string): string {
  return `bs:class-quiz:${quizId}`;
}

function readDraft(quizId: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(draftKey(quizId));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeDraft(quizId: string, answers: Record<string, string>) {
  try {
    window.localStorage.setItem(draftKey(quizId), JSON.stringify(answers));
  } catch {
    /* хувийн горимд хадгалахгүй байж болно */
  }
}

export function ClassQuizPlayer({ quizId }: { quizId: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<ClassQuiz | null>(null);
  const [questions, setQuestions] = useState<StudentQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [deadline, setDeadline] = useState<number>(0);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    let off = false;
    void (async () => {
      const res = await getQuizForStudent(quizId);
      if (off) return;
      if (res.error || !res.data) {
        setError(res.error ?? "Сорил олдсонгүй.");
        setPhase("error");
        return;
      }
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions);
      setAnswers(readDraft(quizId));
      setPhase(effectiveStatus(res.data.quiz) === "open" ? "intro" : "error");
      if (effectiveStatus(res.data.quiz) !== "open") {
        // Хаагдсан ч өөрийн дүн байж магадгүй.
        const started = await startClassQuiz(quizId);
        if (off) return;
        if (started.data?.submitted) {
          setPrevScore(started.data.scorePct);
          setPhase("already");
        } else {
          setError("Энэ сорил хаагдсан байна.");
        }
      }
    })();
    return () => {
      off = true;
    };
  }, [quizId]);

  const submit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase("submitting");
      const res = await submitClassQuiz(quizId, answers);
      if (res.error || !res.data) {
        submittedRef.current = false;
        setError(
          auto
            ? `Хугацаа дууссан ч илгээж чадсангүй: ${res.error ?? ""}`
            : (res.error ?? "Илгээж чадсангүй.")
        );
        setPhase("running");
        return;
      }
      try {
        window.localStorage.removeItem(draftKey(quizId));
      } catch {
        /* ignore */
      }
      if (res.data.points > 0 && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(POINTS_AWARDED_EVENT, { detail: { source: "exam", points: res.data.points } })
        );
      }
      setResult(res.data);
      setPhase("done");
    },
    [quizId, answers]
  );

  // Таймер
  useEffect(() => {
    if (phase !== "running") return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [phase]);

  const remaining = deadline - (now + offset);
  useEffect(() => {
    if (phase === "running" && deadline > 0 && remaining <= 0) void submit(true);
  }, [phase, deadline, remaining, submit]);

  async function begin() {
    setError(null);
    const res = await startClassQuiz(quizId);
    if (res.error || !res.data) {
      setError(res.error ?? "Эхлүүлж чадсангүй.");
      return;
    }
    if (res.data.submitted) {
      setPrevScore(res.data.scorePct);
      setPhase("already");
      return;
    }
    setOffset(new Date(res.data.serverNow).getTime() - Date.now());
    setDeadline(new Date(res.data.deadline).getTime());
    setNow(Date.now());
    setIndex(0);
    setPhase("running");
  }

  function choose(q: StudentQuizQuestion, option: string) {
    setAnswers((prev) => {
      const next = { ...prev, [String(q.id)]: option };
      writeDraft(quizId, next);
      return next;
    });
  }

  const answered = useMemo(
    () => questions.filter((q) => answers[String(q.id)]).length,
    [questions, answers]
  );
  const q = questions[index];

  return (
    <PublicPageShell active="dashboard" showBottomNav={false}>
      {phase === "loading" ? <p className="text-sm text-slate-600">Ачаалж байна…</p> : null}

      {phase === "error" ? (
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-sm text-slate-700">{error ?? "Сорил нээгдэх боломжгүй байна."}</p>
          <Link href="/my-assignments" className="mt-3 inline-block text-sm font-semibold text-emerald-700">
            ← Даалгавар руу
          </Link>
        </section>
      ) : null}

      {phase === "already" ? (
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Та энэ сорилыг өгсөн байна</h1>
          {prevScore != null ? (
            <p className="mt-2 text-sm text-slate-700">
              Таны оноо: <b>{Math.round(prevScore)}%</b>
            </p>
          ) : null}
          <Link href="/study/records" className="mt-3 inline-block text-sm font-semibold text-emerald-700">
            Миний дүн →
          </Link>
        </section>
      ) : null}

      {phase === "intro" && quiz ? (
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Хурдан сорил</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900" translate="no">
            {quiz.title}
          </h1>
          <ul className="mt-4 flex flex-col gap-1 text-sm text-slate-700">
            <li>{questions.length} асуулт</li>
            <li>{quiz.durationMinutes} минут — «Эхлэх» дарсан мөчөөс тоолно</li>
            <li>Нэг асуулт нэг дэлгэц; дуустал буцаж засаж болно</li>
          </ul>
          {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          <button
            type="button"
            onClick={() => void begin()}
            className="mt-5 rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Эхлэх
          </button>
        </section>
      ) : null}

      {(phase === "running" || phase === "submitting") && q ? (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
          <header className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">
              {index + 1} / {questions.length}
            </span>
            <span
              className={`rounded-full px-3 py-1 font-bold tabular-nums ${
                remaining < 60_000 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
              }`}
              role="timer"
              aria-label="Үлдсэн хугацаа"
            >
              ⏱ {mmss(remaining)}
            </span>
          </header>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(answered / Math.max(1, questions.length)) * 100}%` }}
            />
          </div>

          <h2 className="mt-5 whitespace-pre-line break-words text-lg font-semibold text-slate-900" translate="no">
            {q.question}
          </h2>

          <ul className="mt-4 flex flex-col gap-2">
            {q.options.map((opt) => {
              const chosen = answers[String(q.id)] === opt;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    disabled={phase === "submitting"}
                    onClick={() => choose(q, opt)}
                    aria-pressed={chosen}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm ring-1 transition-colors ${
                      chosen
                        ? "bg-emerald-50 font-semibold text-emerald-900 ring-emerald-400"
                        : "bg-white text-slate-800 ring-slate-200 hover:ring-emerald-300"
                    }`}
                    translate="no"
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>

          {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

          <footer className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={index === 0 || phase === "submitting"}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              Өмнөх
            </button>
            {index < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Дараах
              </button>
            ) : (
              <button
                type="button"
                disabled={phase === "submitting"}
                onClick={() => {
                  const missing = questions.length - answered;
                  if (missing > 0 && !window.confirm(`${missing} асуултад хариулаагүй байна. Илгээх үү?`)) return;
                  void submit(false);
                }}
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {phase === "submitting" ? "Илгээж байна…" : "Илгээх"}
              </button>
            )}
          </footer>

          <nav className="mt-4 flex flex-wrap gap-1" aria-label="Асуултын дугаар">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Асуулт ${i + 1}`}
                aria-current={i === index}
                className={`h-7 w-7 rounded-md text-xs font-semibold ${
                  i === index
                    ? "bg-emerald-600 text-white"
                    : answers[String(qq.id)]
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        </section>
      ) : null}

      {phase === "done" && result ? (
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
            <p className="text-5xl" aria-hidden="true">
              {result.passed ? "🏆" : "💪"}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{Math.round(result.scorePct)}%</h1>
            <p className="mt-1 text-sm text-slate-600">
              {result.correct} / {result.total} зөв · {Math.floor(result.durationSec / 60)} мин {result.durationSec % 60} сек
            </p>
            {result.points > 0 ? (
              <p className="mt-2 text-sm font-semibold text-emerald-700">+{result.points} оноо</p>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/study/records"
                className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Миний дүн
              </Link>
              <Link
                href="/my-assignments"
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Даалгавар
              </Link>
            </div>
          </div>

          {result.review.some((r) => !r.isCorrect) ? (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Алдсан асуултууд</h2>
              <ul className="mt-3 flex flex-col divide-y divide-slate-100">
                {result.review
                  .filter((r) => !r.isCorrect)
                  .map((r) => {
                    const qq = questions.find((x) => x.id === r.questionId);
                    return (
                      <li key={r.questionId} className="py-2 text-sm">
                        <p className="font-medium text-slate-900" translate="no">
                          {qq?.question ?? `Асуулт ${r.questionId}`}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Таны хариулт:{" "}
                          <b className="text-red-700" translate="no">
                            {r.selected ?? "—"}
                          </b>{" "}
                          · Зөв:{" "}
                          <b className="text-emerald-700" translate="no">
                            {r.correctAnswer}
                          </b>
                        </p>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </PublicPageShell>
  );
}
