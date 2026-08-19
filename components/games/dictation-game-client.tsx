"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "@/components/games/game-shell";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import {
  isDictationPinyinMatch,
  type DictationQuestion,
} from "@/lib/games/dictation";
import { saveGameResult } from "@/lib/games/game-progress";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import type { HskLevel } from "@/lib/hsk";
import {
  HSK_LEVEL_OPTIONS,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";

type Phase = "setup" | "loading" | "play" | "result";
type InputMode = "tiles" | "pinyin";

function toCatalogLevel(level: ActiveHskLevel): HskLevel {
  return level === "7-9" ? "7-9" : (String(level) as HskLevel);
}

export function DictationGameClient() {
  useActivityTracker("game", "dictation");
  const { level: activeLevel, hydrated: levelHydrated } = useActiveHskLevel();

  const [phase, setPhase] = useState<Phase>("setup");
  const [testLevel, setTestLevel] = useState<ActiveHskLevel>(5);
  const [deck, setDeck] = useState<DictationQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Угсрах горим үндсэн — утсанд бичихээс хялбар.
  const [mode, setMode] = useState<InputMode>("tiles");
  const [usedTiles, setUsedTiles] = useState<number[]>([]);
  const [pinyinInput, setPinyinInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  useEffect(() => {
    if (!levelHydrated) return;
    setTestLevel(activeLevel);
  }, [activeLevel, levelHydrated]);

  const catalogLevel = toCatalogLevel(testLevel);
  const current = deck[index];
  const total = deck.length;
  const assembled = usedTiles
    .map((i) => current?.tiles[i] ?? "")
    .join("");

  // Асуулт гарч ирэхэд аудиог автоматаар НЭГ удаа тоглуулна.
  const lastPlayRef = useRef<string | null>(null);
  useEffect(() => {
    if (phase !== "play" || !current) return;
    const key = `${current.id}-${index}`;
    if (lastPlayRef.current === key) return;
    lastPlayRef.current = key;
    void playChineseWordAudio(current.hanzi);
  }, [phase, current, index]);

  const startGame = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch(
        `/api/games/dictation-deck?level=${encodeURIComponent(catalogLevel)}`
      );
      const body = (await res.json()) as {
        deck?: DictationQuestion[];
        error?: string;
      };
      if (!res.ok || !body.deck?.length) {
        setError(body.error ?? "Ачаалахад алдаа гарлаа.");
        setPhase("setup");
        return;
      }
      setDeck(body.deck);
      setIndex(0);
      setCorrectCount(0);
      setUsedTiles([]);
      setPinyinInput("");
      setChecked(false);
      setWasCorrect(false);
      setPhase("play");
    } catch {
      setError("Сүлжээний алдаа.");
      setPhase("setup");
    }
  }, [catalogLevel]);

  function checkAnswer() {
    if (!current || checked) return;
    const ok =
      mode === "tiles"
        ? assembled === current.hanzi
        : isDictationPinyinMatch(pinyinInput, current.pinyin);
    setChecked(true);
    setWasCorrect(ok);
    if (ok) setCorrectCount((c) => c + 1);
  }

  function nextQuestion() {
    const finalCorrect = correctCount;
    if (index >= deck.length - 1) {
      const accuracy =
        deck.length > 0 ? Math.round((finalCorrect / deck.length) * 100) : 0;
      saveGameResult({
        gameType: "dictation",
        lessonId: `dictation-${catalogLevel}`,
        score: accuracy,
        correct: finalCorrect,
        total: deck.length,
        accuracy,
        playedAt: new Date().toISOString(),
      });
      setPhase("result");
      return;
    }
    setIndex((i) => i + 1);
    setUsedTiles([]);
    setPinyinInput("");
    setChecked(false);
    setWasCorrect(false);
  }

  if (phase === "setup") {
    return (
      <GameShell mainClassName=" px-4 pb-8">
        <div className="bs-mock-setup">
          <h1 className="bs-mock-title">Диктант 👂</h1>
          <p className="bs-mock-sub">
            Аудио сонсоод үгийг ханзаар угсар, эсвэл пиньиньгээр бич
          </p>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <h2 className="bs-mem-step-title mt-4">Түвшин сонгох</h2>
          <div className="bs-mem-chip-grid mt-3">
            {HSK_LEVEL_OPTIONS.map((opt) => {
              const active = testLevel === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`bs-mem-chip bs-mem-chip-level ${active ? "bs-mock-chip--active" : ""}`}
                  onClick={() => setTestLevel(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <ul className="bs-mock-rules mt-4">
            <li>10 асуулт — үг бүрийг сонсоод бичнэ</li>
            <li>Ханз угсрах эсвэл пиньинь бичих (аялгагүй ok: aiqing)</li>
            <li>🔊 товчоор хэдэн ч удаа дахин сонсож болно</li>
          </ul>
          <button
            type="button"
            className="bs-mock-primary-btn mt-5"
            onClick={() => void startGame()}
          >
            Эхлүүлэх
          </button>
          <Link href="/games" className="bs-meaning-link mt-4 block text-center">
            ← Тоглоом руу
          </Link>
        </div>
      </GameShell>
    );
  }

  if (phase === "loading") {
    return (
      <GameShell mainClassName=" px-4 pb-8">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Асуулт бэлдэж байна…
        </p>
      </GameShell>
    );
  }

  if (phase === "result") {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <GameShell mainClassName=" px-4 pb-8">
        <div className="bs-mock-result">
          <p className="bs-mock-result-badge">
            {accuracy >= 60 ? "✅ Сайн байна" : "💪 Дахиад давт"}
          </p>
          <h2 className="bs-mock-title mt-2">Диктант · HSK {catalogLevel}</h2>
          <p className="bs-mock-score-pct">{accuracy}%</p>
          <p className="bs-mock-sub">
            Зөв: {correctCount} / {total}
          </p>
          <div className="bs-mock-info-card mt-4">
            <p className="text-sm leading-relaxed text-[var(--bs-ink-2)]">
              {accuracy >= 60
                ? "Сонсох чадвар сайжирч байна. Үргэлжлүүлээрэй!"
                : "Сонссон үгээ давтаж хэлээд дахин оролдоорой."}
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
            Дахин тоглох
          </button>
          <Link href="/games" className="bs-meaning-link mt-3 block text-center">
            ← Тоглоом руу
          </Link>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  const canCheck =
    mode === "tiles" ? assembled.length > 0 : pinyinInput.trim().length > 0;

  return (
    <GameShell mainClassName=" px-4 pb-8">
      <div className="pt-2">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-extrabold text-[var(--bs-ink)]">
              Диктант 👂
            </h1>
            <p className="text-[11px] font-bold text-[var(--bs-muted)]">
              HSK {catalogLevel}
            </p>
          </div>
          <span className="rounded-full bg-[var(--bs-green-50)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--bs-green-700)]">
            {index + 1}/{total}
          </span>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
          <div
            className="h-full rounded-full bg-[var(--bs-green)] transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="bs-meaning-card">
          <p className="text-center text-sm font-bold text-[var(--bs-muted)]">
            Сонсоод бич
          </p>

          <div className="mt-3 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => void playChineseWordAudio(current.hanzi)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bs-green-50)] text-4xl shadow-sm ring-2 ring-[var(--bs-green)] active:scale-95"
              aria-label="Дахин сонсох"
            >
              🔊
            </button>
            <p className="text-[11px] font-bold text-[var(--bs-muted)]">
              Дарж дахин сонсоно
            </p>
          </div>

          {!checked ? (
            <>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  className={`rounded-full px-4 py-1.5 text-xs font-bold ring-1 ${
                    mode === "tiles"
                      ? "bg-[var(--bs-green)] text-white ring-[var(--bs-green)]"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                  onClick={() => setMode("tiles")}
                >
                  🀄 Угсрах
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-1.5 text-xs font-bold ring-1 ${
                    mode === "pinyin"
                      ? "bg-[var(--bs-green)] text-white ring-[var(--bs-green)]"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                  onClick={() => setMode("pinyin")}
                >
                  🔤 Пиньинь бичих
                </button>
              </div>

              {mode === "tiles" ? (
                <>
                  <div className="mt-4 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                    {usedTiles.length === 0 ? (
                      <p className="text-xs font-semibold text-[var(--bs-muted)]">
                        Доорх ханзнаас дарж угсарна
                      </p>
                    ) : (
                      usedTiles.map((tileIndex, pos) => (
                        <button
                          key={`${tileIndex}-${pos}`}
                          type="button"
                          className="rounded-xl bg-white px-3 py-2 text-2xl font-bold text-[var(--bs-ink)] shadow-sm ring-1 ring-[var(--bs-green)]"
                          onClick={() =>
                            setUsedTiles((prev) =>
                              prev.filter((_, i) => i !== pos)
                            )
                          }
                          aria-label="Буцаах"
                        >
                          {current.tiles[tileIndex]}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {current.tiles.map((tile, tileIndex) => {
                      const used = usedTiles.includes(tileIndex);
                      return (
                        <button
                          key={`${tile}-${tileIndex}`}
                          type="button"
                          disabled={used}
                          className={`rounded-xl px-3 py-2 text-2xl font-bold shadow-sm ring-1 transition ${
                            used
                              ? "bg-slate-100 text-slate-300 ring-slate-100"
                              : "bg-white text-[var(--bs-ink)] ring-slate-200 active:scale-95"
                          }`}
                          onClick={() =>
                            setUsedTiles((prev) => [...prev, tileIndex])
                          }
                        >
                          {tile}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <input
                  type="text"
                  value={pinyinInput}
                  onChange={(e) => setPinyinInput(e.target.value)}
                  placeholder="жишээ: aiqing"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold text-[var(--bs-ink)] outline-none focus:border-[var(--bs-green)]"
                />
              )}

              <button
                type="button"
                className="bs-mock-primary-btn mt-4"
                disabled={!canCheck}
                onClick={checkAnswer}
              >
                Шалгах
              </button>
            </>
          ) : (
            <>
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-center ${
                  wasCorrect
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p
                  className={`text-sm font-extrabold ${
                    wasCorrect ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {wasCorrect ? "✅ Зөв!" : "❌ Буруу"}
                </p>
                {!wasCorrect ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--bs-muted)]">
                    Таны хариулт:{" "}
                    {mode === "tiles" ? assembled : pinyinInput.trim()}
                  </p>
                ) : null}
                <p className="bs-meaning-hanzi mt-2">{current.hanzi}</p>
                <p className="text-sm font-extrabold text-[var(--bs-green)]">
                  {current.pinyin}
                </p>
                <p className="mt-1 text-sm text-[var(--bs-muted)]">
                  {current.meaning}
                </p>
              </div>
              <button
                type="button"
                className="bs-mock-primary-btn mt-4"
                onClick={nextQuestion}
              >
                {index >= deck.length - 1 ? "Дуусгах" : "Дараагийнх →"}
              </button>
            </>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] font-bold text-[var(--bs-muted)]">
          Зөв {correctCount} / {total}
        </p>
      </div>
    </GameShell>
  );
}
