"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MockTestPracticeQuestion } from "@/components/mock-test/mock-test-practice-question";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import {
  mapMockQuestionType,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import { mapQuestion } from "@/lib/mock-test/map-question";
import { describeTestId } from "@/lib/mock-test/test-id-meta";
import {
  buildPracticeFeedback,
  type PracticeFeedback,
} from "@/lib/mock-test/practice-feedback";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import {
  fetchMistakes,
  isDue,
  isMockMistake,
  mockQuestionUuid,
  REPEAT_INTERVAL_DAYS,
  type MistakeEntry,
} from "@/lib/supabase/mistake-book";

/**
 * «Жинхэнэ шалгалтын алдааны дэвтэр» (错题本) — 真题 / өнөөдрийн сонсголоос
 * алдсан асуултуудыг ЖИНХЭНЭ асуулт хэлбэрээр (аудио, зураг, сонголт, тайлбар)
 * 1/3/7 хоногийн зайтай дахин давтуулна. 3 дараалан зөв → дэвтрээс гарна.
 */

type Item = { mistake: MistakeEntry; question: MockTestQuestionRow };
type View = "list" | "practice" | "done";

const DECK_MAX = 15;

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function streakLabel(n: number): string {
  if (n <= 0) return "Буруу → маргааш давтах";
  if (n === 1) return "1 зөв → 3 хоногийн дараа";
  return "2 зөв → 7 хоногийн дараа, дараа нь гарна";
}

async function loadQuestions(ids: string[]): Promise<Map<string, MockTestQuestionRow>> {
  const out = new Map<string, MockTestQuestionRow>();
  if (!supabase || ids.length === 0) return out;
  // 100-аар хэсэглэж татна (URL хэт уртсахаас сэргийлнэ).
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await supabase
      .from("mock_test_questions")
      .select("*")
      .in("id", ids.slice(i, i + 100));
    for (const row of data ?? []) {
      const q = mapQuestion(row as Record<string, unknown>);
      out.set(q.id, q);
    }
  }
  return out;
}

async function loadTestTitles(testIds: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!supabase || testIds.length === 0) return out;
  const { data } = await supabase.from("mock_tests").select("id, title").in("id", testIds);
  for (const t of (data ?? []) as { id: string; title: string }[]) out[t.id] = t.title;
  return out;
}

export function ZhentiMistakesClient() {
  useActivityTracker("review", "mistakes-zhenti");

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [view, setView] = useState<View>("list");

  const [deck, setDeck] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const current = deck[index] ?? null;
  const getElapsed = useQuestionTimer(current?.question.id ?? "none");

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    const { mistakes } = await fetchMistakes(uid);
    const mock = mistakes.filter(isMockMistake);
    const qmap = await loadQuestions(mock.map(mockQuestionUuid));
    const built: Item[] = [];
    for (const m of mock) {
      const q = qmap.get(mockQuestionUuid(m));
      if (q) built.push({ mistake: m, question: q });
    }
    setItems(built);
    setTitles(await loadTestTitles([...new Set(built.map((b) => b.question.test_id))]));
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      if (!hasSupabaseConfig) {
        setAuthChecked(true);
        setLoading(false);
        return;
      }
      const { userId: uid } = await getAuthenticatedUserId().catch(() => ({ userId: null }));
      setUserId(uid);
      setAuthChecked(true);
      if (uid) await load(uid);
      else setLoading(false);
    })();
  }, [load]);

  const due = useMemo(() => items.filter((it) => isDue(it.mistake)), [items]);
  const later = useMemo(
    () =>
      items
        .filter((it) => !isDue(it.mistake))
        .sort((a, b) => a.mistake.dueAt.localeCompare(b.mistake.dueAt)),
    [items]
  );

  function start(pool: Item[]) {
    if (pool.length === 0) return;
    // Хамгийн эрт ээлжтэй нь эхэндээ.
    const sorted = [...pool].sort((a, b) => a.mistake.dueAt.localeCompare(b.mistake.dueAt));
    setDeck(sorted.slice(0, DECK_MAX));
    setIndex(0);
    setAnswer(null);
    setRevealed(false);
    setFeedback(null);
    setCorrectCount(0);
    setView("practice");
  }

  const record = useCallback(
    (q: MockTestQuestionRow, value: string | null, ok: boolean) => {
      recordQuestionAttempt({
        lessonId: q.test_id,
        stage: "mistake_review",
        questionId: `mock:${q.id}`,
        questionType: mapMockQuestionType(q.q_type),
        isCorrect: ok,
        selectedAnswer: value,
        correctAnswer: q.correct_answer,
        timeSpentMs: getElapsed(),
      });
    },
    [getElapsed]
  );

  const handleAnswer = useCallback(
    (value: string) => {
      if (!current || revealed) return;
      const built = buildPracticeFeedback(current.question, value);
      setAnswer(value);
      setFeedback(built);
      setRevealed(true);
      if (built.isCorrect === null) return; // гараар дүгнэх (эссэ г.м.) → onSelfGrade
      const ok = built.isCorrect === true;
      if (ok) setCorrectCount((c) => c + 1);
      record(current.question, value, ok);
    },
    [current, revealed, record]
  );

  const handleSelfGrade = useCallback(
    (ok: boolean) => {
      if (!current) return;
      if (ok) setCorrectCount((c) => c + 1);
      record(current.question, answer, ok);
    },
    [current, answer, record]
  );

  const skip = useCallback(() => {
    if (!current || revealed) return;
    setFeedback(buildPracticeFeedback(current.question, null));
    setRevealed(true);
    setAnswer(null);
    record(current.question, null, false);
  }, [current, revealed, record]);

  async function next() {
    if (index + 1 >= deck.length) {
      setView("done");
      if (userId) await load(userId);
      return;
    }
    setIndex((i) => i + 1);
    setAnswer(null);
    setRevealed(false);
    setFeedback(null);
  }

  if (authChecked && !userId) {
    return (
      <div className="bs-mem-wizard">
        <h2 className="bs-mem-step-title">📕 Жинхэнэ шалгалтын алдаа</h2>
        <div className="mt-4 rounded-[20px] bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-bold text-[var(--app-text)]">
            Нэвтэрч орвол алдсан асуултууд чинь хадгалагдаж, 1·3·7 хоногийн зайтай дахин гарч ирнэ.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-[var(--app-primary)] px-6 py-2.5 text-sm font-bold text-white"
          >
            Нэвтрэх →
          </Link>
        </div>
      </div>
    );
  }

  if (!authChecked || loading) {
    return <p className="py-12 text-center text-sm text-[var(--app-muted)]">Ачааллаж байна…</p>;
  }

  // --- Давтах ---
  if (view === "practice" && current) {
    const q = current.question;
    const meta = describeTestId(q.test_id);
    const title = meta ? `HSK ${meta.level} · ${meta.label}` : (titles[q.test_id] ?? q.test_id);
    return (
      <div className="bs-mtp-wrap">
        <div className="bs-mtp-runbar">
          <button type="button" className="bs-mtp-back" onClick={() => setView("list")}>
            ← Жагсаалт
          </button>
          <span className="bs-mtp-counter">{index + 1} / {deck.length}</span>
          <span className="bs-mtp-tally">
            <b className="bs-mtp-tally-ok">{correctCount}</b>
          </span>
        </div>
        <div className="bs-mtp-progress">
          <span style={{ width: `${Math.round(((index + (revealed ? 1 : 0)) / deck.length) * 100)}%` }} />
        </div>
        <p className="bs-mtp-group-line">
          📕 <span translate="no">{title}</span> №{q.q_no} · алдсан ×{current.mistake.wrongCount}
          {current.mistake.consecutiveCorrect > 0 ? ` · дараалан зөв ${current.mistake.consecutiveCorrect}` : ""}
        </p>

        <MockTestPracticeQuestion
          key={q.id}
          question={q}
          answer={answer}
          revealed={revealed}
          onAnswer={handleAnswer}
          onSelfGrade={handleSelfGrade}
          feedback={feedback}
          hideAudio={false}
          prefetchAudioUrls={deck.slice(index + 1, index + 3).map((it) => it.question.audio_url)}
        />

        <div className="bs-mtp-footer">
          {!revealed ? (
            <button type="button" className="bs-mtp-secondary" onClick={skip}>
              Мэдэхгүй — хариултыг нь харах
            </button>
          ) : (
            <button type="button" className="bs-mtp-primary" onClick={() => void next()}>
              {index + 1 >= deck.length ? "Дуусгах" : "Дараагийн асуулт →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="bs-mem-wizard">
        <div className="rounded-[20px] bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-5xl" aria-hidden>{correctCount === deck.length ? "🏆" : "💪"}</p>
          <h2 className="mt-3 text-xl font-bold text-[var(--app-text)]">{correctCount}/{deck.length} зөв</h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Дэвтэрт {items.length} асуулт · өнөөдөр давтах {due.length}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {due.length > 0 ? (
              <button type="button" className="bs-mock-primary-btn" onClick={() => start(due)}>
                🔁 Үргэлжлүүлэх ({due.length})
              </button>
            ) : null}
            <button type="button" className="bs-mem-back" onClick={() => setView("list")}>
              ← Жагсаалт руу
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Жагсаалт ---
  return (
    <div className="bs-mem-wizard">
      <h2 className="bs-mem-step-title">📕 Жинхэнэ шалгалтын алдаа{items.length ? ` · ${items.length}` : ""}</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
        Жинхэнэ шалгалт, дасгал, өнөөдрийн сонсголоос алдсан асуултууд. Буруу → 1 хоног, зөв → 3 → 7
        хоногийн дараа дахин гарна; 3 дараалан зөв бол дэвтрээс гарна.
      </p>

      {items.length === 0 ? (
        <div className="mt-4 rounded-[20px] bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-4xl" aria-hidden>🎉</p>
          <p className="mt-2 text-sm font-bold text-[var(--app-text)]">Дэвтэр хоосон</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">Шалгалт, дасгал хийхэд алдсан асуултууд энд цуглана.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/listen/daily" className="bs-mock-primary-btn">🎧 Өнөөдрийн сонсгол</Link>
            <Link href="/review/practice" className="bs-mem-back">Дасгалын жагсаалт →</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-sm font-bold text-[var(--app-text)]">
              Өнөөдөр давтах: <span className="text-red-600">{due.length}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              {later.length > 0
                ? `Дараа нь: ${later.length} (хамгийн ойрынх ${Math.max(1, daysUntil(later[0]!.mistake.dueAt))} хоногийн дараа)`
                : "Бусад нь ээлжээ хүлээж байна."}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                className="bs-mock-primary-btn"
                disabled={due.length === 0}
                onClick={() => start(due)}
              >
                🔁 Өнөөдрийнхийг давтах{due.length ? ` (${Math.min(due.length, DECK_MAX)})` : ""}
              </button>
              {items.length > due.length ? (
                <button type="button" className="bs-mem-back" onClick={() => start(items)}>
                  Бүгдийг давтах ({Math.min(items.length, DECK_MAX)})
                </button>
              ) : null}
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {[...due, ...later].map(({ mistake: m, question: q }) => {
              const dueNow = isDue(m);
              return (
                <li key={m.key} className="rounded-[16px] bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--app-muted)]">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5" translate="no">
                      {(() => { const m = describeTestId(q.test_id); return m ? `HSK ${m.level} · ${m.isSample ? "загвар" : `${m.year} №${m.serial}${m.variant ?? ""}`}` : (titles[q.test_id] ?? q.test_id); })()} · асуулт {q.q_no}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {q.skill === "listening" ? "Сонсгол" : q.skill === "reading" ? "Унших" : "Бичих"}
                    </span>
                    {m.wrongCount > 1 ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">×{m.wrongCount}</span>
                    ) : null}
                    <span className={`rounded-full px-2 py-0.5 ${dueNow ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {dueNow ? "өнөөдөр" : `${Math.max(1, daysUntil(m.dueAt))} хоногийн дараа`}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-[var(--app-text)] hanzi" translate="no">
                    {q.stem?.trim() || q.options?.map((o) => o.text).filter(Boolean).join(" / ") || "(аудио/зурагтай асуулт)"}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                    {streakLabel(m.consecutiveCorrect)} ·{" "}
                    <Link href={`/review/practice/${q.test_id}`} className="underline">
                      тест рүү →
                    </Link>
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-center text-[11px] text-[var(--app-muted)]">
            Давталтын зай: {REPEAT_INTERVAL_DAYS.join(" · ")} хоног
          </p>
        </>
      )}
    </div>
  );
}
