"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GameWordSourcePicker } from "@/components/games/game-word-source-picker";
import { GameShell } from "@/components/games/game-shell";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import {
  buildGameWordPool,
  defaultGameWordSource,
  type GameWordSource,
  wordIdsToQuery,
} from "@/lib/games/game-word-pool";
import { recordQuestionAttempt } from "@/lib/analytics/record-question-attempt";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import { QuestionFeedbackButtons } from "@/components/feedback/question-feedback-buttons";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  evaluateVocabQuiz,
  formatVocabQuizLevelLabel,
  getVocabQuizConfig,
  type VocabQuizLevelConfig,
} from "@/lib/games/hsk-vocab-quiz";
import { saveGameResult } from "@/lib/games/game-progress";
import type {
  HskQuizKind,
  HskQuizQuestion,
} from "@/lib/games/hsk-quiz-builders";
import type { HskLevel } from "@/lib/hsk";
import {
  HSK_LEVEL_OPTIONS,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";

type Phase = "source" | "setup" | "intro" | "loading" | "play" | "result";

function toCatalogLevel(level: ActiveHskLevel): HskLevel {
  return level === "7-9" ? "7-9" : (String(level) as HskLevel);
}

type Props = {
  embedded?: boolean;
  presetTypes?: HskQuizKind[] | null;
  presetTitle?: string | null;
};

export function HskVocabQuizClient({
  embedded = false,
  presetTypes = null,
  presetTitle = null,
}: Props) {
  const screenTitle = presetTitle ?? "Үгсийн дасгал";
  const { level: activeLevel, hydrated: levelHydrated } = useActiveHskLevel();
  const [phase, setPhase] = useState<Phase>("source");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wordSource, setWordSource] = useState<GameWordSource>("catalog");
  const [wordSourceQuery, setWordSourceQuery] = useState("");
  const [poolNote, setPoolNote] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [testLevel, setTestLevel] = useState<ActiveHskLevel>(5);
  const [config, setConfig] = useState<VocabQuizLevelConfig>(
    getVocabQuizConfig("5")
  );
  const [deck, setDeck] = useState<HskQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.secondsPerQuestion);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const correctRef = useRef(0);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!levelHydrated) return;
    setTestLevel(activeLevel);
    setConfig(getVocabQuizConfig(toCatalogLevel(activeLevel)));
  }, [activeLevel, levelHydrated]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    void getAuthenticatedUserId().then(({ userId }) => {
      const loggedIn = Boolean(userId);
      setIsLoggedIn(loggedIn);
      setWordSource(defaultGameWordSource(loggedIn));
    });
  }, []);

  const confirmSource = useCallback(async () => {
    if (!levelHydrated) return;
    setSourceLoading(true);
    try {
      const pool = await buildGameWordPool(wordSource, activeLevel);
      setWordSourceQuery(wordIdsToQuery(pool.wordIds));
      setPoolNote(pool.note);
      setPhase("setup");
    } finally {
      setSourceLoading(false);
    }
  }, [wordSource, activeLevel, levelHydrated]);

  const catalogLevel = toCatalogLevel(testLevel);
  const current = deck[index];
  const getElapsed = useQuestionTimer(`word:${current?.id ?? index}`);
  const total = deck.length;
  const timerPct = (timeLeft / config.secondsPerQuestion) * 100;

  const finishTest = useCallback(
    (finalCorrect: number) => {
      const result = evaluateVocabQuiz(finalCorrect, deck.length, catalogLevel);
      saveGameResult({
        gameType: "hsk-vocab-quiz",
        lessonId: `hsk-vocab-${catalogLevel}`,
        score: result.accuracy,
        correct: result.correct,
        total: result.total,
        accuracy: result.accuracy,
        playedAt: new Date().toISOString(),
      });
      setCorrectCount(finalCorrect);
      setPhase("result");
    },
    [catalogLevel, deck.length]
  );

  const advance = useCallback(() => {
    if (indexRef.current >= deck.length - 1) {
      finishTest(correctRef.current);
      return;
    }
    indexRef.current += 1;
    setIndex(indexRef.current);
    setTimeLeft(config.secondsPerQuestion);
    setPicked(null);
    setLocked(false);
  }, [config.secondsPerQuestion, deck.length, finishTest]);

  const startTest = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const typesQuery =
        presetTypes && presetTypes.length > 0
          ? `&types=${encodeURIComponent(presetTypes.join(","))}`
          : "";
      const res = await fetch(
        `/api/games/hsk-vocab-quiz-deck?level=${encodeURIComponent(catalogLevel)}${typesQuery}${wordSourceQuery}`
      );
      const body = (await res.json()) as {
        deck?: HskQuizQuestion[];
        config?: VocabQuizLevelConfig;
        error?: string;
      };
      if (!res.ok || !body.deck?.length) {
        setError(body.error ?? "Ачаалахад алдаа гарлаа.");
        setPhase("setup");
        return;
      }
      if (body.config) setConfig(body.config);
      setDeck(body.deck);
      indexRef.current = 0;
      correctRef.current = 0;
      setIndex(0);
      setCorrectCount(0);
      setTimeLeft(body.config?.secondsPerQuestion ?? config.secondsPerQuestion);
      setPicked(null);
      setLocked(false);
      setPhase("play");
    } catch {
      setError("Сүлжээний алдаа.");
      setPhase("setup");
    }
  }, [catalogLevel, config.secondsPerQuestion, presetTypes, wordSourceQuery]);

  useEffect(() => {
    if (phase !== "play" || locked || !current) return;

    if (timeLeft <= 0) {
      setLocked(true);
      setPicked(null);
      setTimeout(() => advance(), 700);
      return;
    }

    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, locked, timeLeft, current, advance]);

  function pickOption(option: string) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(option);

    if (option === current.correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    }
    recordQuestionAttempt({
      lessonId: `hsk${testLevel}`,
      stage: "word_practice",
      questionId: `word:${current.id}`,
      questionType: "choice",
      isCorrect: option === current.correct,
      selectedAnswer: option,
      correctAnswer: current.correct,
      timeSpentMs: getElapsed(),
    });
    setTimeout(() => advance(), 650);
  }

  function selectLevel(level: ActiveHskLevel) {
    setTestLevel(level);
    setConfig(getVocabQuizConfig(toCatalogLevel(level)));
    setError(null);
  }

  const timerColor = useMemo(() => {
    if (timeLeft <= 3) return "bg-red-500";
    if (timeLeft <= 6) return "bg-amber-400";
    return "bg-[var(--app-primary)]";
  }, [timeLeft]);

  const isHanziDisplay =
    current?.kind === "word-recall" ||
    current?.kind === "pinyin" ||
    current?.kind === "meaning" ||
    current?.kind === "example-cloze";

  const wrap = (content: ReactNode) =>
    embedded ? (
      <div className="pb-4">{content}</div>
    ) : (
      <GameShell mainClassName=" px-4 pb-8">
        {content}
      </GameShell>
    );

  if (phase === "source") {
    return wrap(
      <div className="bs-mock-setup">
        <h1 className="bs-mock-title">{screenTitle}</h1>
        <p className="bs-mock-sub">Эхлээд ямар үгсээр тоглохоо сонгоно уу</p>
        <GameWordSourcePicker
          value={wordSource}
          onChange={setWordSource}
          isLoggedIn={isLoggedIn}
        />
        <button
          type="button"
          className="bs-mock-primary-btn mt-5"
          disabled={sourceLoading}
          onClick={() => void confirmSource()}
        >
          {sourceLoading ? "Бэлдэж байна…" : "Үргэлжлүүлэх →"}
        </button>
        {!embedded ? (
          <Link href="/games" className="bs-meaning-link mt-4 block text-center">
            ← Тоглоом руу
          </Link>
        ) : null}
      </div>
    );
  }

  if (phase === "setup") {
    return wrap(
      <div className="bs-mock-setup">
        <h1 className="bs-mock-title">{screenTitle}</h1>
        <p className="bs-mock-sub">
          {presetTypes?.length === 1
            ? "Сонгосон үгсээр нэг төрлийн асуулт"
            : "HSK түвшний vocabulary quiz — утга, ханз, пиньинь, жишээ"}
        </p>
        {poolNote ? (
          <p className="mt-2 text-xs font-semibold text-amber-700">{poolNote}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          className="bs-mem-back"
          onClick={() => setPhase("source")}
        >
          ← Үгийн эх
        </button>
        <h2 className="bs-mem-step-title mt-4">Түвшин сонгох</h2>
        <div className="bs-mem-chip-grid mt-3">
          {HSK_LEVEL_OPTIONS.map((opt) => {
            const active = testLevel === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                className={`bs-mem-chip bs-mem-chip-level ${active ? "bs-mock-chip--active" : ""}`}
                onClick={() => selectLevel(opt.value)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="bs-mock-info-card mt-4">
          <p className="bs-mock-info-row">
            <span>Асуулт</span>
            <strong>{config.questions}</strong>
          </p>
          <p className="bs-mock-info-row">
            <span>Тэнцэх оноо</span>
            <strong>{config.passPct}%</strong>
          </p>
          <p className="bs-mock-info-row">
            <span>Асуулт бүр</span>
            <strong>{config.secondsPerQuestion} сек</strong>
          </p>
        </div>
        <button
          type="button"
          className="bs-mock-primary-btn mt-5"
          onClick={() => setPhase("intro")}
        >
          Үргэлжлүүлэх →
        </button>
        {!embedded ? (
          <Link href="/games" className="bs-meaning-link mt-4 block text-center">
            ← Тоглоом руу
          </Link>
        ) : null}
      </div>
    );
  }

  if (phase === "intro") {
    return wrap(
      <div className="bs-mock-setup">
        <button
          type="button"
          className="bs-mem-back"
          onClick={() => setPhase("setup")}
        >
          ← Түвшин
        </button>
        <h1 className="bs-mock-title">{formatVocabQuizLevelLabel(catalogLevel)}</h1>
        <p className="bs-mock-sub">Дасгал эхлэхийн өмнө</p>
        <ul className="bs-mock-rules mt-4">
          <li>
            {config.questions} асуулт
            {presetTypes?.length === 1
              ? ` — ${presetTitle ?? presetTypes[0]}`
              : " — утга, ханз, пиньинь, жишээ, радикал"}
          </li>
          <li>Асуулт бүрт {config.secondsPerQuestion} секунд</li>
          <li>Буруу хариулсан ч үргэлжлэнэ (амь алдахгүй)</li>
          <li>{config.passPct}%+ зөв хариулбал <strong>тэнцэнэ</strong></li>
        </ul>
        <button
          type="button"
          className="bs-mock-primary-btn mt-6"
          onClick={() => void startTest()}
        >
          Шалгалт эхлүүлэх
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return wrap(
      <p className="py-16 text-center text-sm text-[var(--app-muted)]">
        Асуулт бэлдэж байна…
      </p>
    );
  }

  if (phase === "result") {
    const result = evaluateVocabQuiz(correctCount, total, catalogLevel);
    return wrap(
      <div className="bs-mock-result">
        <p className="bs-mock-result-badge">
          {result.passed ? "✅ Тэнцсэн" : "❌ Тэнцээгүй"}
        </p>
        <h2 className="bs-mock-title mt-2">
          {formatVocabQuizLevelLabel(catalogLevel)} · {screenTitle}
        </h2>
        <p className="bs-mock-score-pct">{result.accuracy}%</p>
        <p className="bs-mock-sub">
          Зөв: {result.correct} / {result.total} · Тэнцэх: {result.passPct}%
        </p>
        <div className="bs-mock-info-card mt-4">
          <p className="text-sm leading-relaxed text-[var(--bs-ink-2)]">
            {result.passed
              ? "Сайн байна! Энэ түвшний үгсийн дасгалд бэлэн байна."
              : "Дахин давтаад дасгалаа давтан хийнэ үү."}
          </p>
        </div>
        <button
          type="button"
          className="bs-mock-primary-btn mt-5"
          onClick={() => {
            setPhase("setup");
            setDeck([]);
          }}
        >
          Дахин оролдох
        </button>
        {!embedded ? (
          <Link href="/games" className="bs-meaning-link mt-3 block text-center">
            ← Тоглоом руу
          </Link>
        ) : null}
      </div>
    );
  }

  if (!current) return null;

  return wrap(
    <div className="pt-2">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-extrabold text-[var(--bs-ink)]">
            {screenTitle}
          </h1>
          <p className="text-[11px] font-bold text-[var(--bs-muted)]">
            {formatVocabQuizLevelLabel(catalogLevel)}
          </p>
        </div>
        <span className="rounded-full bg-[var(--bs-green-50)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--bs-green-700)]">
          {index + 1}/{total}
        </span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
        <div
          className="h-full rounded-full bg-[var(--bs-green)] transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>
      <p className="mb-3 text-center text-[11px] font-bold text-[var(--bs-muted)]">
        ⏱ {timeLeft} сек · Зөв {correctCount}
      </p>

      <div className="bs-meaning-card">
        <p className="text-center text-sm font-bold text-[var(--bs-muted)]">
          {current.promptLabel}
        </p>
        {current.display ? (
          isHanziDisplay && current.kind !== "example-cloze" ? (
            <p className="bs-meaning-hanzi">{current.display}</p>
          ) : (
            <p className="mt-3 text-center text-base font-bold leading-relaxed text-[var(--bs-ink)]">
              {current.display}
            </p>
          )
        ) : null}
        {current.subDisplay &&
        !(current.kind === "word-recall" && !locked) ? (
          <p className="text-center text-sm font-extrabold text-[var(--bs-green)]">
            {current.subDisplay}
          </p>
        ) : null}
        {current.hint ? (
          <p className="mt-1 text-center text-xs text-[var(--bs-muted)]">
            {current.hint}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2">
          {current.options.map((option) => {
            let cls = "bs-meaning-option";
            if (locked && option === current.correct) {
              cls += " bs-meaning-option--correct";
            } else if (
              locked &&
              picked === option &&
              option !== current.correct
            ) {
              cls += " bs-meaning-option--wrong";
            }
            return (
              <button
                key={`${current.id}-${option}`}
                type="button"
                disabled={locked}
                onClick={() => pickOption(option)}
                className={cls}
              >
                {option}
              </button>
            );
          })}
        </div>
        {locked && current ? (
          <QuestionFeedbackButtons
            lessonId={`hsk${testLevel}`}
            questionId={`word:${current.id}`}
          />
        ) : null}
      </div>

      <button
        type="button"
        className="bs-mem-back mt-4"
        onClick={() => {
          if (confirm("Шалгалтаас гарах уу? Явц хадгалагдахгүй.")) {
            finishTest(correctRef.current);
          }
        }}
      >
        Шалгалт дуусгах
      </button>
    </div>
  );
}
