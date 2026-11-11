"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import {
  ComboBadge,
  PointsPop,
  SfxToggle,
  TemeeReaction,
  useGameJuice,
} from "@/components/games/game-juice";
import { LearnSettingsSheet } from "@/components/games/learn/learn-settings-sheet";
import { MatchRound } from "@/components/games/learn/match-round";
import { useActiveHskLevelOptional } from "@/components/providers/active-hsk-level-provider";
import { recordQuestionAttempt } from "@/lib/analytics/record-question-attempt";
import { fireConfetti, playSfx, recordDailyMissionProgress } from "@/lib/games/game-fx";
import { saveGameResult } from "@/lib/games/game-progress";
import { rateGameWord } from "@/lib/games/game-srs-feedback";
import {
  DEFAULT_LEARN_SETTINGS,
  LEARN_MODES,
  LEARN_PRESETS,
  answerLearn,
  nextQuestion,
  readLearnSettings,
  shuffle,
  startLearn,
  writeLearnSettings,
  type LearnQuestion,
  type LearnSettings,
  type LearnState,
  type LearnWord,
} from "@/lib/games/learn-session";
import {
  WORD_ORIGIN_META,
  loadLevelWords,
  loadMyWords,
  type MyWord,
  type WordOrigin,
} from "@/lib/games/learn-words";
import type { ActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";

type Phase = "setup" | "loading" | "play" | "result";
type Source = "mine" | "hsk";

const LEVELS: ActiveHskLevel[] = [1, 2, 3, 4, 5, 6];
const ORIGINS: WordOrigin[] = ["lesson", "video", "hsk"];

function meaning(w: LearnWord): string {
  return (w.meaning_mn ?? w.meaning_en ?? "").trim();
}

export function LearnGameClient() {
  const locale = useUiLocale();
  const params = useSearchParams();
  const preset = params.get("preset") ?? "";
  const levelCtx = useActiveHskLevelOptional();
  const juice = useGameJuice({ lives: false });

  const [settings, setSettings] = useState<LearnSettings>(DEFAULT_LEARN_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");

  // --- үгийн эх үүсвэр ---
  const [myWords, setMyWords] = useState<MyWord[] | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [source, setSource] = useState<Source>("hsk");
  const [origins, setOrigins] = useState<WordOrigin[]>(ORIGINS);
  const [onlyDue, setOnlyDue] = useState(false);
  const [level, setLevel] = useState<ActiveHskLevel>(levelCtx?.level ?? 1);
  const [showList, setShowList] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // --- тоглолт ---
  const [pool, setPool] = useState<LearnWord[]>([]);
  const [learn, setLearn] = useState<LearnState | null>(null);
  const [question, setQuestion] = useState<LearnQuestion | null>(null);
  const [qNo, setQNo] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [built, setBuilt] = useState<number[]>([]); // диктант: сонгосон товчны индексүүд
  const [points, setPoints] = useState(0);
  const [answers, setAnswers] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(0);
  const advanceTimer = useRef<number | null>(null);

  const byId = useMemo(() => new Map(pool.map((w) => [w.id, w])), [pool]);

  /* ---------- эхлэл: тохиргоо + миний үгс ---------- */
  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (!alive) return;
      const saved = readLearnSettings();
      const p = LEARN_PRESETS[preset];
      setSettings(p ? { ...saved, ...p } : saved);
      if (preset === "marathon") setOnlyDue(true);
    });
    void loadMyWords().then((res) => {
      if (!alive) return;
      setLoggedIn(res.loggedIn);
      setMyWords(res.words);
      if (res.words.length >= 4) setSource("mine");
    });
    return () => {
      alive = false;
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, [preset]);

  const updateSettings = useCallback((next: LearnSettings) => {
    setSettings(next);
    writeLearnSettings(next);
  }, []);

  const counts = useMemo(() => {
    const c: Record<WordOrigin | "due", number> = { video: 0, lesson: 0, hsk: 0, due: 0 };
    for (const w of myWords ?? []) {
      c[w.origin] += 1;
      if (w.due) c.due += 1;
    }
    return c;
  }, [myWords]);

  const mineSelected = useMemo(
    () => (myWords ?? []).filter((w) => origins.includes(w.origin) && (!onlyDue || w.due)),
    [myWords, origins, onlyDue]
  );

  /* ---------- тоглолт эхлүүлэх ---------- */
  const begin = useCallback(
    async (onlyWords?: LearnWord[]) => {
      setPhase("loading");
      setSetupError(null);
      let session: LearnWord[] = onlyWords ?? [];
      let distractors: LearnWord[] = [];
      if (!onlyWords) {
        if (source === "mine") {
          session = mineSelected;
          // Цөөн үгтэй бол буруу сонголтуудыг түвшний үгээр баяжуулна.
          if (session.length < 16) distractors = await loadLevelWords(level);
        } else {
          const all = await loadLevelWords(level);
          session = shuffle(all).slice(0, settings.size > 0 ? Math.max(settings.size, 12) : 40);
          distractors = all;
        }
      } else {
        distractors = pool;
      }
      if (session.length < 2) {
        setSetupError("Тоглоход хангалттай үг алга. Өөр эх үүсвэр сонгоно уу.");
        setPhase("setup");
        return;
      }
      const merged = new Map<number, LearnWord>();
      for (const w of [...session, ...distractors]) merged.set(w.id, w);
      const allWords = [...merged.values()];
      const state = startLearn(session, onlyWords ? 0 : settings.size);
      const map = new Map(allWords.map((w) => [w.id, w]));
      const first = nextQuestion(state, map, allWords, settings, 0);
      setPool(allWords);
      setLearn(state);
      setQuestion(first);
      setQNo(0);
      setPicked(null);
      setLocked(false);
      setBuilt([]);
      setPoints(0);
      setAnswers({ correct: 0, total: 0 });
      setTimeLeft(settings.timer);
      juice.reset();
      setPhase("play");
    },
    [source, mineSelected, level, settings, pool, juice]
  );

  /* ---------- дуу автоматаар ---------- */
  useEffect(() => {
    if (phase !== "play" || !question || question.type === "match") return;
    const needsAudio = question.type === "dictation" || question.mode === "listen";
    if (needsAudio || (settings.autoAudio && question.mode === "meaning")) {
      void playChineseWordAudio(question.word.simplified ?? "");
    }
    // Зөвхөн шинэ асуулт гарахад тоглуулна.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNo, phase]);

  /* ---------- дүгнэлт ---------- */
  const finish = useCallback(
    (final: LearnState, stats: { correct: number; total: number }) => {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      saveGameResult({
        gameType: "hsk-vocab-quiz",
        lessonId: "learn",
        score: accuracy,
        correct: stats.correct,
        total: stats.total,
        accuracy,
        playedAt: new Date().toISOString(),
      });
      recordDailyMissionProgress({ correct: stats.correct, bestCombo: juice.bestCombo });
      playSfx("finish");
      if (accuracy >= 80) fireConfetti();
      setLearn(final);
      setQuestion(null);
      setPhase("result");
    },
    [juice.bestCombo]
  );

  /** Нэг (эсвэл холбох үед хэд хэдэн) үгийн хариултыг бүртгээд дараагийн асуулт руу. */
  const settle = useCallback(
    (results: { word: LearnWord; correct: boolean }[], delay: number) => {
      if (!learn) return;
      let state = learn;
      let gained = 0;
      let right = 0;
      for (const r of results) {
        // SRS-д зөвхөн тухайн үгийн ЭХНИЙ хариулт тооцогдоно.
        if ((state.asked[r.word.id] ?? 0) === 0) rateGameWord(r.word.id, r.correct);
        const outcome = juice.answer(r.correct);
        gained += outcome.points;
        if (r.correct) right += 1;
        state = answerLearn(state, r.word.id, r.correct);
      }
      const stats = {
        correct: answers.correct + right,
        total: answers.total + results.length,
      };
      setPoints((p) => p + gained);
      setAnswers(stats);
      setLocked(true);
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => {
        if (state.queue.length === 0) {
          finish(state, stats);
          return;
        }
        const n = qNo + 1;
        setLearn(state);
        setQuestion(nextQuestion(state, byId, pool, settings, n));
        setQNo(n);
        setPicked(null);
        setBuilt([]);
        setLocked(false);
        setTimeLeft(settings.timer);
        juice.newQuestion();
      }, delay);
    },
    [learn, answers, juice, qNo, byId, pool, settings, finish]
  );

  function pickOption(option: string) {
    if (locked || !question || question.type !== "choice") return;
    const correct = option === question.correct;
    setPicked(option);
    recordQuestionAttempt({
      lessonId: `hsk${level}`,
      stage: "word_practice",
      questionId: `word:${question.word.id}`,
      questionType: "choice",
      isCorrect: correct,
      selectedAnswer: option,
      correctAnswer: question.correct,
      timeSpentMs: 0,
    });
    if (question.mode !== "listen" && question.word.simplified) {
      void playChineseWordAudio(question.word.simplified);
    }
    settle([{ word: question.word, correct }], correct ? 750 : 1900);
  }

  function checkDictation() {
    if (locked || !question || question.type !== "dictation") return;
    const typed = built.map((i) => question.tiles[i]).join("");
    const correct = typed === question.answer;
    setPicked(typed || "—");
    settle([{ word: question.word, correct }], correct ? 800 : 2200);
  }

  /* ---------- цаг ---------- */
  useEffect(() => {
    if (phase !== "play" || locked || settings.timer <= 0 || !question || question.type === "match") {
      return;
    }
    const t = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setPicked("⏱");
        settle([{ word: question.word, correct: false }], 1700);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => window.clearTimeout(t);
  }, [phase, locked, settings.timer, timeLeft, question, settle]);

  /* ================================================================== */
  /* SETUP                                                               */
  /* ================================================================== */
  if (phase === "setup" || phase === "loading") {
    const modeLabels = LEARN_MODES.filter((m) => settings.modes.includes(m.id));
    return (
      <GameShell>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
          <header className="flex items-start justify-between gap-3">
            <div>
              <Link href="/games" className="text-xs font-semibold text-emerald-700">
                ← {tr(locale, "Тоглоом")}
              </Link>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                🎮 {tr(locale, "Тоглож сурах")}
              </h1>
              <p className="text-sm text-slate-600">
                {tr(locale, "Үг бүрийг зөв хариултал дахин асууна — тоглонгоо цээжилнэ.")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              ⚙️ {tr(locale, "Тохиргоо")}
            </button>
          </header>

          {/* 1. Ямар үгээр? */}
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              1 · {tr(locale, "Ямар үгээр тоглох вэ?")}
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={!loggedIn || (myWords?.length ?? 0) < 2}
                onClick={() => setSource("mine")}
                aria-pressed={source === "mine"}
                className={`rounded-2xl p-3 text-left ring-1 transition disabled:opacity-50 ${
                  source === "mine"
                    ? "bg-emerald-50 ring-2 ring-emerald-500"
                    : "bg-white ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="font-bold text-slate-900">
                  ⭐ {tr(locale, "Миний үгс")}{" "}
                  <span className="font-medium text-slate-500">
                    {myWords ? myWords.length : "…"}
                  </span>
                </p>
                <p className="text-xs text-slate-600">
                  {!loggedIn && myWords
                    ? tr(locale, "Нэвтэрсний дараа хадгалсан үгсээрээ тоглоно")
                    : tr(locale, "Сурах бичиг, бичлэг, HSK үгсээс нэмсэн бүх үг нэг дор")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSource("hsk")}
                aria-pressed={source === "hsk"}
                className={`rounded-2xl p-3 text-left ring-1 transition ${
                  source === "hsk"
                    ? "bg-emerald-50 ring-2 ring-emerald-500"
                    : "bg-white ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="font-bold text-slate-900">📊 {tr(locale, "HSK түвшний үгс")}</p>
                <p className="text-xs text-slate-600">
                  {tr(locale, "Сонгосон түвшний үгсээс санамсаргүй")}
                </p>
              </button>
            </div>

            {source === "mine" && myWords ? (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {ORIGINS.map((o) => {
                    const on = origins.includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        disabled={counts[o] === 0}
                        onClick={() =>
                          setOrigins((prev) =>
                            on
                              ? prev.length > 1
                                ? prev.filter((x) => x !== o)
                                : prev
                              : [...prev, o]
                          )
                        }
                        aria-pressed={on}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 disabled:opacity-40 ${
                          on
                            ? "bg-slate-900 text-white ring-slate-900"
                            : "bg-white text-slate-600 ring-slate-200"
                        }`}
                      >
                        {WORD_ORIGIN_META[o].icon} {tr(locale, WORD_ORIGIN_META[o].label)} {counts[o]}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={counts.due === 0}
                    onClick={() => setOnlyDue((v) => !v)}
                    aria-pressed={onlyDue}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 disabled:opacity-40 ${
                      onlyDue
                        ? "bg-orange-500 text-white ring-orange-500"
                        : "bg-white text-slate-600 ring-slate-200"
                    }`}
                  >
                    🔥 {tr(locale, "Зөвхөн давтах ёстой")} {counts.due}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowList((v) => !v)}
                  className="self-start text-xs font-semibold text-emerald-700"
                >
                  {mineSelected.length} {tr(locale, "үг сонгогдсон")} · {showList ? "▴" : "▾"}{" "}
                  {tr(locale, "жагсаалт")}
                </button>
                {showList ? (
                  <ul className="grid max-h-56 gap-1 overflow-y-auto rounded-2xl bg-slate-50 p-2 sm:grid-cols-2">
                    {mineSelected.slice(0, 200).map((w) => (
                      <li key={w.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm">
                        <span title={WORD_ORIGIN_META[w.origin].label} aria-hidden>
                          {WORD_ORIGIN_META[w.origin].icon}
                        </span>
                        <span className="font-bold text-slate-900" translate="no">
                          {w.simplified}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                          {meaning(w)}
                        </span>
                        {w.due ? <span title="Давтах ёстой">🔥</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {source === "hsk" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={String(l)}
                    type="button"
                    onClick={() => setLevel(l)}
                    aria-pressed={level === l}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold ring-1 ${
                      level === l
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-white text-slate-700 ring-slate-200"
                    }`}
                  >
                    HSK {l}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {/* 2. Ямар тоглоомоор? */}
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                2 · {tr(locale, "Ямар тоглоомуудыг холих вэ?")}
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="text-xs font-semibold text-emerald-700"
              >
                {tr(locale, "Өөрчлөх")}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {LEARN_MODES.map((m) => {
                const on = settings.modes.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    title={m.hint}
                    onClick={() => {
                      const modes = on
                        ? settings.modes.filter((x) => x !== m.id)
                        : [...settings.modes, m.id];
                      if (modes.length > 0) updateSettings({ ...settings, modes });
                    }}
                    aria-pressed={on}
                    className={`rounded-2xl px-3 py-2 text-sm font-semibold ring-1 transition ${
                      on
                        ? "bg-emerald-600 text-white ring-emerald-600"
                        : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {m.icon} {tr(locale, m.label)}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {modeLabels.length} {tr(locale, "төрөл")} ·{" "}
              {settings.size > 0 ? `${settings.size} ${tr(locale, "үг")}` : tr(locale, "бүх үг")} ·{" "}
              {settings.timer > 0
                ? `⏱ ${settings.timer} ${tr(locale, "сек")}`
                : tr(locale, "цаггүй")}
            </p>
          </section>

          {setupError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{setupError}</p>
          ) : null}

          <button
            type="button"
            disabled={phase === "loading" || (source === "mine" && mineSelected.length < 2)}
            onClick={() => void begin()}
            className="rounded-full bg-emerald-600 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
          >
            {phase === "loading" ? tr(locale, "Бэлдэж байна…") : `▶ ${tr(locale, "Эхлэх")}`}
          </button>
        </div>
        <LearnSettingsSheet
          open={settingsOpen}
          settings={settings}
          onChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      </GameShell>
    );
  }

  /* ================================================================== */
  /* RESULT                                                              */
  /* ================================================================== */
  if (phase === "result" && learn) {
    const accuracy = answers.total > 0 ? Math.round((answers.correct / answers.total) * 100) : 0;
    const missed = learn.missed.map((id) => byId.get(id)).filter((w): w is LearnWord => Boolean(w));
    return (
      <GameShell>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 pb-8 text-center">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-5xl" aria-hidden>
              {accuracy >= 90 ? "🏆" : accuracy >= 70 ? "🎉" : "💪"}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              {learn.total} {tr(locale, "үгийг бүгдийг зөв хариуллаа!")}
            </h1>
            <dl className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Оноо", value: String(points) },
                { label: "Нарийвчлал", value: `${accuracy}%` },
                { label: "Дээд combo", value: `×${juice.bestCombo}` },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl bg-slate-50 p-3">
                  <dt className="text-[11px] text-slate-500">{tr(locale, m.label)}</dt>
                  <dd className="text-xl font-extrabold tabular-nums text-slate-900">{m.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {missed.length > 0 ? (
            <section className="rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                {tr(locale, "Эхний удаад алдсан үгс")} ({missed.length})
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {missed.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => void playChineseWordAudio(w.simplified ?? "")}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50"
                    >
                      <span className="text-xl font-bold text-slate-900" translate="no">
                        {w.simplified}
                      </span>
                      <span className="text-xs text-slate-500" translate="no">
                        {w.pinyin}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                        {meaning(w)}
                      </span>
                      <span aria-hidden>🔊</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void begin(missed)}
                className="mt-3 w-full rounded-full bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600"
              >
                🔁 {tr(locale, "Алдсан үгсээ дахин тоглох")}
              </button>
            </section>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void begin()}
              className="flex-1 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              ▶ {tr(locale, "Шинэ үгсээр дахин")}
            </button>
            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="flex-1 rounded-full bg-white py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200"
            >
              {tr(locale, "Үг, тоглоомоо солих")}
            </button>
            <Link
              href="/games"
              className="flex-1 rounded-full bg-white py-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200"
            >
              {tr(locale, "Гарах")}
            </Link>
          </div>
        </div>
      </GameShell>
    );
  }

  /* ================================================================== */
  /* PLAY                                                                */
  /* ================================================================== */
  if (!learn || !question) return null;
  const done = learn.mastered.length;
  const modeMeta = LEARN_MODES.find((m) => m.id === question.mode);
  const reveal = locked && picked !== null;

  return (
    <GameShell>
      <div className={`mx-auto flex w-full max-w-xl flex-col gap-3 pb-8 ${juice.shake ? "bs-gj-shake" : ""}`}>
        {/* Дээд мөр */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPhase("setup")}
            aria-label={tr(locale, "Гарах")}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200"
          >
            ✕
          </button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${learn.total > 0 ? (done / learn.total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums text-slate-600">
            {done}/{learn.total}
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={tr(locale, "Тохиргоо")}
            className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200"
          >
            ⚙️
          </button>
        </div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
            {modeMeta?.icon} {tr(locale, modeMeta?.label ?? "")}
          </span>
          <span className="flex items-center gap-2">
            <ComboBadge combo={juice.combo} multiplier={juice.multiplier} />
            <span className="rounded-full bg-amber-100 px-3 py-1 font-bold tabular-nums text-amber-900">
              ⭐ {points}
            </span>
            <SfxToggle />
          </span>
        </div>
        {settings.timer > 0 && question.type !== "match" ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                timeLeft <= 2 ? "bg-red-500" : "bg-sky-500"
              }`}
              style={{ width: `${(timeLeft / settings.timer) * 100}%` }}
            />
          </div>
        ) : null}

        <div className="relative">
          <PointsPop outcome={juice.lastOutcome} />
          <TemeeReaction reaction={juice.reaction} />
        </div>

        {/* ---------- Сонголттой асуулт ---------- */}
        {question.type === "choice" ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-center text-xs font-semibold text-slate-500">
              {tr(locale, question.label)}
            </p>
            {question.display ? (
              <p
                className={`mt-3 text-center font-extrabold text-slate-900 ${
                  question.mode === "recall"
                    ? "text-2xl"
                    : question.mode === "cloze"
                      ? "text-2xl leading-relaxed"
                      : "text-6xl"
                }`}
                translate="no"
              >
                {question.display}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void playChineseWordAudio(question.word.simplified ?? "")}
                className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-5xl ring-2 ring-emerald-400 active:scale-95"
                aria-label={tr(locale, "Дахин сонсох")}
              >
                🔊
              </button>
            )}
            {question.sub && (reveal || settings.showPinyin || question.mode !== "meaning") ? (
              <p className="mt-1 text-center text-sm text-slate-500" translate="no">
                {question.sub}
              </p>
            ) : null}
            {question.audio && question.display ? (
              <button
                type="button"
                onClick={() => void playChineseWordAudio(question.audio ?? "")}
                className="mx-auto mt-2 block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                🔊 {tr(locale, "Сонсох")}
              </button>
            ) : null}

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {question.options.map((opt) => {
                const isCorrect = opt === question.correct;
                const isPicked = opt === picked;
                const tone = !reveal
                  ? "bg-white ring-slate-200 hover:bg-emerald-50 hover:ring-emerald-300"
                  : isCorrect
                    ? "bg-emerald-500 text-white ring-emerald-500"
                    : isPicked
                      ? "bg-red-500 text-white ring-red-500"
                      : "bg-white text-slate-400 ring-slate-200";
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={locked}
                    onClick={() => pickOption(opt)}
                    translate="no"
                    className={`rounded-2xl px-3 py-3.5 font-bold ring-1 transition active:scale-[0.98] ${tone} ${
                      question.hanziOptions ? "text-2xl" : "text-[15px] leading-snug"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {reveal && picked !== question.correct ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-900" translate="no">
                <b>{question.word.simplified}</b> {question.word.pinyin} — {meaning(question.word)}
                <br />
                <span className="text-xs">{tr(locale, "Энэ үг дахин ирнэ.")}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ---------- Диктант ---------- */}
        {question.type === "dictation" ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-center text-xs font-semibold text-slate-500">
              {tr(locale, "Сонсоод ханзаар нь угсар")}
            </p>
            <button
              type="button"
              onClick={() => void playChineseWordAudio(question.word.simplified ?? "")}
              className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-5xl ring-2 ring-emerald-400 active:scale-95"
              aria-label={tr(locale, "Дахин сонсох")}
            >
              🔊
            </button>
            {settings.showPinyin ? (
              <p className="mt-1 text-center text-sm text-slate-500" translate="no">
                {question.word.pinyin}
              </p>
            ) : null}
            <div
              className={`mt-4 flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl px-3 py-2 ${
                !reveal
                  ? "bg-slate-50"
                  : picked === question.answer
                    ? "bg-emerald-100"
                    : "bg-red-100"
              }`}
            >
              {built.length === 0 ? (
                <span className="text-xs text-slate-400">
                  {tr(locale, "Доорх ханзнаас дарж угсарна")}
                </span>
              ) : (
                built.map((ti, i) => (
                  <button
                    key={`${ti}-${i}`}
                    type="button"
                    disabled={locked}
                    onClick={() => setBuilt((p) => p.filter((_, k) => k !== i))}
                    className="rounded-xl bg-white px-3 py-2 text-3xl font-bold text-slate-900 shadow-sm ring-1 ring-slate-200"
                    translate="no"
                  >
                    {question.tiles[ti]}
                  </button>
                ))
              )}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {question.tiles.map((ch, i) => (
                <button
                  key={`${ch}-${i}`}
                  type="button"
                  disabled={locked || built.includes(i)}
                  onClick={() => setBuilt((p) => [...p, i])}
                  className="rounded-xl bg-white px-3 py-2 text-3xl font-bold text-slate-900 shadow-sm ring-1 ring-slate-300 transition active:scale-95 disabled:opacity-25"
                  translate="no"
                >
                  {ch}
                </button>
              ))}
            </div>
            {reveal && picked !== question.answer ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-900" translate="no">
                {tr(locale, "Зөв нь")}: <b className="text-lg">{question.answer}</b> {question.word.pinyin}{" "}
                — {meaning(question.word)}
              </p>
            ) : null}
            <button
              type="button"
              disabled={locked || built.length === 0}
              onClick={checkDictation}
              className="mt-4 w-full rounded-full bg-emerald-600 py-3.5 text-base font-extrabold text-white disabled:opacity-40"
            >
              {tr(locale, "Шалгах")}
            </button>
          </section>
        ) : null}

        {/* ---------- Холбох ---------- */}
        {question.type === "match" ? (
          <MatchRound
            key={qNo}
            words={question.words}
            onDone={(results) => settle(results, 700)}
          />
        ) : null}
      </div>
      <LearnSettingsSheet
        open={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </GameShell>
  );
}
