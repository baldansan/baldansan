"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C, StatTile } from "@/components/charts";
import {
  autoPickQuestions,
  closeClassQuiz,
  createClassQuiz,
  deleteClassQuiz,
  effectiveStatus,
  fetchQuestionsForLessons,
  getQuizResults,
  listClassQuizzes,
  openClassQuiz,
  setQuizShareResults,
  START_WINDOW_MINUTES,
  type ClassQuiz,
  type QuizLiveResults,
  type QuizQuestionOption,
} from "@/lib/supabase/class-quizzes";
import { getSupabaseAssignableLessons, type AssignableLesson } from "@/lib/supabase/content";
import { Pct } from "./shared";

const POLL_MS = 5000;
const MIN_Q = 10;
const MAX_Q = 20;

const STATUS_LABEL = { draft: "Ноорог", open: "Нээлттэй", closed: "Хаагдсан" } as const;
const STATUS_TONE = {
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  open: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  closed: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

function fmtDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });
}

/* ------------------------------------------------------------------ */
/* Шинэ сорил үүсгэх                                                   */
/* ------------------------------------------------------------------ */

function QuizCreator({
  classroomId,
  onCreated,
  onCancel,
}: {
  classroomId: string;
  onCreated: (q: ClassQuiz) => void;
  onCancel: () => void;
}) {
  const [lessons, setLessons] = useState<AssignableLesson[]>([]);
  const [filter, setFilter] = useState("");
  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestionOption[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [count, setCount] = useState(15);
  const [duration, setDuration] = useState(15);
  const [title, setTitle] = useState(`Хурдан сорил — ${todayLabel()}`);
  const [loadingQ, setLoadingQ] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    void getSupabaseAssignableLessons()
      .then((l) => {
        if (!off) setLessons(l);
      })
      .catch((e: unknown) => {
        if (!off) setError(e instanceof Error ? e.message : "Хичээлийн жагсаалт татаж чадсангүй.");
      });
    return () => {
      off = true;
    };
  }, []);

  const shownLessons = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return lessons
      .filter((l) => !f || `${l.title} ${l.id} ${l.courseTitle ?? ""}`.toLowerCase().includes(f))
      .slice(0, 120);
  }, [lessons, filter]);

  const toggleLesson = (id: string) =>
    setLessonIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function loadQuestions() {
    setLoadingQ(true);
    setError(null);
    const res = await fetchQuestionsForLessons(lessonIds);
    setLoadingQ(false);
    if (res.error || !res.data) {
      setError(res.error ?? "Асуулт татаж чадсангүй.");
      return;
    }
    setQuestions(res.data);
    setPicked(autoPickQuestions(res.data, Math.min(count, res.data.length)));
    if (res.data.length === 0) setError("Сонгосон хичээлд сорилд тохирох (сонголттой) асуулт алга.");
  }

  function autoPick(n: number) {
    setCount(n);
    setPicked(autoPickQuestions(questions, Math.min(n, questions.length)));
  }

  const toggleQ = (id: number) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const valid = picked.length >= MIN_Q && picked.length <= MAX_Q;

  async function save(openNow: boolean) {
    setSaving(true);
    setError(null);
    // Сонгосон дарааллаар (хичээл → асуултын дараалал) хадгална.
    const order = new Map(questions.map((q, i) => [q.id, i]));
    const ids = [...picked].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    const usedLessons = [...new Set(questions.filter((q) => ids.includes(q.id)).map((q) => q.lessonId))];
    const res = await createClassQuiz({
      classroomId,
      title,
      questionIds: ids,
      lessonIds: usedLessons,
      durationMinutes: duration,
      openNow,
    });
    setSaving(false);
    if (res.error || !res.data) {
      setError(res.error ?? "Сорил үүсгэж чадсангүй. 073 миграц ажилласан эсэхийг шалгана уу.");
      return;
    }
    onCreated(res.data);
  }

  const byLesson = useMemo(() => {
    const m = new Map<string, QuizQuestionOption[]>();
    for (const q of questions) {
      const l = m.get(q.lessonId) ?? [];
      l.push(q);
      m.set(q.lessonId, l);
    }
    return [...m.entries()];
  }, [questions]);

  const lessonName = (id: string) => lessons.find((l) => l.id === id)?.title ?? id;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="text-base font-semibold text-slate-900">Шинэ хурдан сорил</h3>

      <div>
        <p className="text-sm font-medium text-slate-700">1. Хичээл(үүд) сонгох</p>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Хичээл хайх…"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <ul className="mt-2 grid max-h-48 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
          {shownLessons.map((l) => (
            <li key={l.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={lessonIds.includes(l.id)} onChange={() => toggleLesson(l.id)} />
                <span className="truncate" translate="no">
                  {l.title}
                </span>
              </label>
            </li>
          ))}
          {shownLessons.length === 0 ? <li className="p-2 text-xs text-slate-500">Хичээл олдсонгүй.</li> : null}
        </ul>
        <button
          type="button"
          onClick={() => void loadQuestions()}
          disabled={lessonIds.length === 0 || loadingQ}
          className="mt-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-50"
        >
          {loadingQ ? "Татаж байна…" : `Асуулт татах (${lessonIds.length} хичээл)`}
        </button>
      </div>

      {questions.length > 0 ? (
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-slate-700">
              2. Асуулт сонгох ·{" "}
              <span className={valid ? "text-emerald-700" : "text-red-700"}>
                {picked.length} сонгосон ({MIN_Q}–{MAX_Q})
              </span>
            </p>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Автоматаар
              <select
                value={count}
                onChange={(e) => autoPick(Number(e.target.value))}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
              >
                {[10, 12, 15, 18, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} асуулт
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {byLesson.map(([lessonId, qs]) => (
              <div key={lessonId} className="mb-2">
                <p className="px-2 text-xs font-semibold text-slate-500" translate="no">
                  {lessonName(lessonId)}
                </p>
                {qs.map((q) => (
                  <label
                    key={q.id}
                    className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={picked.includes(q.id)}
                      onChange={() => toggleQ(q.id)}
                    />
                    <span className="line-clamp-2" translate="no">
                      {q.question}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Гарчиг</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Хугацаа (минут)</span>
          <input
            type="number"
            min={1}
            max={180}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!valid || saving}
          onClick={() => void save(true)}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? "Хадгалж байна…" : "Одоо нээх"}
        </button>
        <button
          type="button"
          disabled={!valid || saving}
          onClick={() => void save(false)}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Ноорог хадгалах
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2.5 text-sm text-slate-500 hover:text-slate-800">
          Болих
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Нээсний дараа сурагч бүр {duration} минут авна; сорил {duration + START_WINDOW_MINUTES} минутын дараа
        автоматаар хаагдана. Багш хүссэн үедээ хааж болно.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Үр дүн / шууд самбар                                                */
/* ------------------------------------------------------------------ */

function ResultsPanel({
  quiz,
  onChanged,
}: {
  quiz: ClassQuiz;
  onChanged: (q: ClassQuiz | null) => void;
}) {
  const [res, setRes] = useState<QuizLiveResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const status = effectiveStatus(quiz);

  const refresh = useCallback(async () => {
    const r = await getQuizResults(quiz);
    if (r.error) setError(r.error);
    else {
      setError(null);
      setRes(r.data);
    }
  }, [quiz]);

  useEffect(() => {
    void refresh();
    if (status !== "open") return;
    const t = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(t);
  }, [refresh, status]);

  async function act(fn: () => Promise<{ error: string | null }>, after?: () => void) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.error) setError(r.error);
    else after?.();
  }

  const rows = res?.rows ?? [];
  const sorted = [...rows].sort((a, b) => {
    const rank = { submitted: 0, in_progress: 1, not_started: 2 } as const;
    return rank[a.status] - rank[b.status] || (b.scorePct ?? -1) - (a.scorePct ?? -1);
  });
  const inProgress = rows.filter((r) => r.status === "in_progress").length;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900" translate="no">
            {quiz.title}
          </h3>
          <p className="text-xs text-slate-500">
            {quiz.questionIds.length} асуулт · {quiz.durationMinutes} мин ·{" "}
            <span className={`rounded-full px-2 py-0.5 ring-1 ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
            {status === "open" ? " · 5 секунд тутам шинэчлэгдэнэ" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "draft" || status === "closed" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void act(
                  async () => {
                    const r = await openClassQuiz(quiz);
                    if (r.data) onChanged(r.data);
                    return r;
                  }
                )
              }
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {status === "closed" ? "Дахин нээх" : "Одоо нээх"}
            </button>
          ) : null}
          {status === "open" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void act(() => closeClassQuiz(quiz.id), () => onChanged({ ...quiz, status: "closed", closesAt: new Date().toISOString() }))
              }
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Сорил хаах
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Энэ сорил болон бүх дүнг устгах уу?")) return;
              void act(() => deleteClassQuiz(quiz.id), () => onChanged(null));
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
          >
            Устгах
          </button>
        </div>
      </header>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Илгээсэн" value={res ? `${res.submitted}/${res.total}` : "—"} hint="сурагч" />
        <StatTile label="Дундаж оноо" value={res?.avgPct != null ? `${Math.round(res.avgPct)}%` : "—"} hint="илгээсэн сурагчдаар" />
        <StatTile label="Хийж байгаа" value={String(inProgress)} hint="одоо" />
        <StatTile
          label="Эхлээгүй"
          value={res ? String(res.rows.filter((r) => r.status === "not_started").length) : "—"}
          hint="сурагч"
        />
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-3 py-2 font-semibold">Сурагч</th>
              <th className="px-3 py-2 font-semibold">Төлөв</th>
              <th className="px-3 py-2 text-right font-semibold">Оноо</th>
              <th className="px-3 py-2 text-right font-semibold">Зөв</th>
              <th className="px-3 py-2 text-right font-semibold">Хугацаа</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.userId} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 font-medium text-slate-900" translate="no">
                  {r.name}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.status === "submitted" ? (
                    <span className="text-emerald-700">Илгээсэн</span>
                  ) : r.status === "in_progress" ? (
                    <span className="text-amber-700">Хийж байна</span>
                  ) : (
                    <span className="text-slate-400">Эхлээгүй</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Pct value={r.scorePct} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                  {r.correct != null ? `${r.correct}/${r.total}` : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{fmtDuration(r.durationSec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {status === "closed" && res && res.submitted > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Асуулт бүрийн алдсан хувь</h4>
          <ul className="mt-2 flex flex-col gap-1.5">
            {res.questions.map((q) => (
              <li key={q.questionId} className="flex items-center gap-3 text-sm">
                <span className="line-clamp-1 min-w-0 flex-1 text-slate-700" translate="no">
                  {q.text}
                </span>
                <span className="h-2 w-24 shrink-0 overflow-hidden rounded-full" style={{ background: C.track }}>
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${q.wrongPct ?? 0}%`, background: (q.wrongPct ?? 0) >= 50 ? C.bad : C.brand }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">
                  {q.wrongPct == null ? "—" : `${q.wrongPct}%`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={quiz.shareResults}
          onChange={(e) =>
            void act(
              () => setQuizShareResults(quiz.id, e.target.checked),
              () => onChanged({ ...quiz, shareResults: e.target.checked })
            )
          }
        />
        Хаагдсаны дараа сурагчдад ангийн дунджийг харуулах
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Таб                                                                 */
/* ------------------------------------------------------------------ */

export function QuickQuizTab({ classroomId }: { classroomId: string }) {
  const [quizzes, setQuizzes] = useState<ClassQuiz[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await listClassQuizzes(classroomId);
    if (r.error) {
      setError(r.error);
      setQuizzes([]);
      return;
    }
    setError(null);
    const list = r.data ?? [];
    setQuizzes(list);
    setSelectedId((cur) => cur ?? list.find((q) => effectiveStatus(q) === "open")?.id ?? list[0]?.id ?? null);
  }, [classroomId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = quizzes?.find((q) => q.id === selectedId) ?? null;

  function replaceQuiz(q: ClassQuiz | null) {
    if (!q) {
      setQuizzes((l) => (l ?? []).filter((x) => x.id !== selectedId));
      setSelectedId(null);
      return;
    }
    setQuizzes((l) => (l ?? []).map((x) => (x.id === q.id ? q : x)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          Хичээлийн асуултуудаас богино сорил үүсгэж, бүх ангид нэгэн зэрэг нээнэ. Дүн шууд харагдана.
        </p>
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            + Шинэ сорил
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error} — Supabase дээр 073_class_quick_quiz_records.sql ажилласан эсэхийг шалгана уу.
        </p>
      ) : null}

      {creating ? (
        <QuizCreator
          classroomId={classroomId}
          onCancel={() => setCreating(false)}
          onCreated={(q) => {
            setCreating(false);
            setQuizzes((l) => [q, ...(l ?? [])]);
            setSelectedId(q.id);
          }}
        />
      ) : null}

      {quizzes && quizzes.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {quizzes.map((q) => {
            const st = effectiveStatus(q);
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(q.id)}
                  className={`rounded-xl px-3 py-2 text-left text-sm ring-1 ${
                    q.id === selectedId ? "bg-emerald-50 ring-emerald-300" : "bg-white ring-slate-200 hover:ring-emerald-200"
                  }`}
                >
                  <span className="block font-medium text-slate-900" translate="no">
                    {q.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {q.questionIds.length} асуулт ·{" "}
                    <span className={st === "open" ? "font-semibold text-emerald-700" : ""}>{STATUS_LABEL[st]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : quizzes && !creating ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
          Сорил хараахан үүсгээгүй байна.
        </p>
      ) : null}

      {selected ? <ResultsPanel key={selected.id} quiz={selected} onChanged={replaceQuiz} /> : null}
    </div>
  );
}
