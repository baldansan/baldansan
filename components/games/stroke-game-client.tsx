"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameOptionButton } from "@/components/games/game-option-button";
import { GameProgressPill } from "@/components/games/game-progress-pill";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { buildStrokeGameItems } from "@/lib/games/game-data";
import { resolveGameLabels, type GameLabels } from "@/lib/games/game-lesson-meta";
import { saveGameResult } from "@/lib/games/game-progress";
import {
  extractHanziCharacters,
  HANZI_WRITING_LABELS,
  resolveLessonPracticeHanzi,
} from "@/lib/hanzi/writing-practice";
import type { GameVocabItem, StrokeQuestion } from "@/lib/games/game-types";
import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";
import { pickBreakdownLabel } from "@/components/hanzi/hanzi-breakdown-parts";
import { HanziPartPopover } from "@/components/hanzi/hanzi-part-popover";

type Props = {
  lessonId: string;
  vocabulary: GameVocabItem[];
  isKorean?: boolean;
  isPrelesson?: boolean;
  labels?: GameLabels;
  hskCharacterNotes?: HskCharacterNote[];
  /** Precomputed on the server (full breakdown catalog); client fallback otherwise. */
  initialQuestions?: StrokeQuestion[];
};

export function StrokeGameClient({
  lessonId,
  vocabulary,
  isKorean = false,
  isPrelesson = false,
  labels: labelsProp,
  hskCharacterNotes = [],
  initialQuestions,
}: Props) {
  useActivityTracker("game", "stroke");
  const locale = useUiLocale();
  const labels = labelsProp ?? resolveGameLabels(isKorean, isPrelesson);
  const gameContext = { isKorean, isPrelesson, hskCharacterNotes };
  const questions = useMemo(
    () =>
      initialQuestions && initialQuestions.length > 0
        ? initialQuestions
        : buildStrokeGameItems(vocabulary, 6, gameContext),
    [initialQuestions, vocabulary, isKorean, isPrelesson, hskCharacterNotes]
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  /** Index of the formula part whose info card is open (never an answer). */
  const [partPop, setPartPop] = useState<number | null>(null);

  const current = questions[index];
  const total = questions.length;
  const isHangul = current?.mode === "hangul";
  const isStrokeOrder = current?.mode === "stroke-order";
  const isComponent = current?.mode === "component";
  const structureLabel =
    current && current.mode === "component" && current.questionType !== "structure"
      ? pickBreakdownLabel(locale, current.structure, current.structureZh)
      : "";
  const lessonPracticeHanzi = useMemo(
    () => resolveLessonPracticeHanzi(lessonId, vocabulary),
    [lessonId, vocabulary]
  );
  /** Formula glyphs; the hidden slot shows its answer only after answering. */
  const formulaGlyphs =
    current?.parts?.map((p) =>
      p.hidden ? (revealed ? current.correctComponent : "?") : p.glyph
    ) ?? [];
  const popGlyph = partPop != null ? formulaGlyphs[partPop] : undefined;
  const popPartData = partPop != null ? current?.parts?.[partPop] : undefined;
  const writingChar =
    current && !isHangul
      ? extractHanziCharacters(current.chinese)[0] ?? current.chinese
      : null;
  const writingHref =
    writingChar && lessonPracticeHanzi.includes(writingChar)
      ? `/kanji/${encodeURIComponent(writingChar)}?lessonId=${encodeURIComponent(lessonId)}&write=1`
      : null;

  function finishGame(finalCorrect: number) {
    const finalScore = finalCorrect * 10;
    saveGameResult({
      gameType: "stroke",
      lessonId,
      score: finalScore,
      correct: finalCorrect,
      total,
      accuracy: Math.round((finalCorrect / total) * 100),
      playedAt: new Date().toISOString(),
    });
    setScore(finalScore);
    setFinished(true);
  }

  function handleSelect(option: string) {
    if (!current || revealed) return;
    setSelected(option);
    setRevealed(true);
    const isCorrect = option === current.correctComponent;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setScore((s) => s + 10);
    }
  }

  function handleNext() {
    if (index >= total - 1) {
      finishGame(correctCount);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setPartPop(null);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setScore(0);
    setFinished(false);
    setPartPop(null);
  }

  if (questions.length === 0) {
    return (
      <GameShell>
        <GameHeader title={labels.strokeTitle} />
        <GameEmptyState
          lessonId={lessonId}
          message={labels.strokeEmptyMessage}
        />
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell>
        <GameHeader title={labels.strokeTitle} score={score} />
        <GameResultCard
          score={score}
          correct={correctCount}
          total={total}
          accuracy={Math.round((correctCount / total) * 100)}
          xpGained={score}
          lessonId={lessonId}
          onPlayAgain={restart}
        />
      </GameShell>
    );
  }

  return (
    <GameShell>
      <GameHeader
        title={labels.strokeTitle}
        progress={`${index + 1}/${total}`}
        score={score}
      />
      <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-[11px] leading-snug text-amber-800 ring-1 ring-amber-200">
        {labels.strokeDesc}
      </p>
      <GameProgressPill current={index + 1} total={total} />
      {current ? (
        <>
          <GameCard className="mb-4 text-center">
            {isHangul ? (
              <>
                <p className="text-3xl font-bold tracking-wide text-[var(--app-text)]">
                  {current.prompt}
                </p>
                <p className="mt-3 text-lg text-purple-700">{current.chinese}</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]" translate="no">
                  {current.mongolian}
                </p>
              </>
            ) : (
              <>
                <p className="text-5xl font-bold text-[var(--app-text)]">
                  {current.chinese}
                </p>
                <p className="mt-2 text-lg text-emerald-700">{current.pinyin}</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]" translate="no">
                  {current.mongolian}
                </p>
                {current.charType ? (
                  <p className="mt-2">
                    <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                      {current.charType === "形声"
                        ? tr(locale, "Утга-дуудлагын ханз")
                        : current.charType === "会意"
                          ? tr(locale, "Утга нийлсэн ханз")
                          : tr(locale, "Зураг ханз")}
                      {locale === "zh" ? null : (
                        <span translate="no"> · {current.charType}字</span>
                      )}
                    </span>
                  </p>
                ) : null}
                {current.parts && current.parts.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-start justify-center gap-x-2 gap-y-3 text-purple-700">
                    {current.parts.map((part, i) => {
                      const label = pickBreakdownLabel(
                        locale,
                        part.labelMn,
                        part.labelZh
                      );
                      const glyph = formulaGlyphs[i] ?? part.glyph;
                      const tappable = glyph !== "?";
                      const glyphClass = `text-3xl font-bold ${
                        part.hidden
                          ? revealed
                            ? "rounded-lg bg-emerald-50 px-2 text-emerald-700 ring-1 ring-emerald-200"
                            : "rounded-lg bg-amber-50 px-2 text-amber-600 ring-1 ring-amber-200"
                          : ""
                      }`;
                      const inner = (
                        <>
                          <span className={glyphClass} translate="no">
                            {glyph}
                          </span>
                          {label ? (
                            <span
                              className="text-[11px] leading-tight text-[var(--app-muted)]"
                              translate="no"
                            >
                              {label}
                            </span>
                          ) : null}
                          {part.role ? (
                            <span
                              className={`rounded-full px-2 text-[10px] font-bold leading-relaxed ${
                                part.role === "sem"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                              }`}
                            >
                              {part.role === "sem"
                                ? tr(locale, "утга заагч")
                                : tr(locale, "дуудлага заагч")}
                            </span>
                          ) : null}
                        </>
                      );
                      return (
                        <Fragment key={`${part.glyph}-${i}`}>
                          {i > 0 ? (
                            <span className="pt-2 text-2xl font-semibold" aria-hidden>
                              +
                            </span>
                          ) : null}
                          {tappable ? (
                            <button
                              type="button"
                              aria-haspopup="dialog"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPartPop(i);
                              }}
                              className="flex min-w-[56px] cursor-pointer flex-col items-center gap-0.5 rounded-xl border border-dashed border-purple-200 bg-white/60 px-1.5 py-1 text-purple-700 transition active:scale-95"
                            >
                              {inner}
                            </button>
                          ) : (
                            <span className="flex min-w-[56px] flex-col items-center gap-0.5 py-1">
                              {inner}
                            </span>
                          )}
                        </Fragment>
                      );
                    })}
                    <span className="pt-2 text-2xl font-semibold" translate="no">
                      = {current.chinese}
                    </span>
                  </div>
                ) : current.formulaPrompt ? (
                  <p className="mt-4 text-xl font-semibold tracking-wide text-purple-700">
                    {current.formulaPrompt}
                  </p>
                ) : null}
                <p className="mt-2 text-sm font-medium text-[var(--app-text)]">
                  {tr(locale, current.prompt)}
                </p>
                {isStrokeOrder ? (
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    {tr(locale, "Зураасны дараалал")}
                  </p>
                ) : null}
                {isComponent ? (
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    {tr(locale, "偏旁 / бүрдэл")}
                  </p>
                ) : null}
              </>
            )}
          </GameCard>
          <div
            className={`grid gap-2 ${
              isComponent && current.questionType !== "structure"
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {current.options.map((option) => {
              let state: "default" | "correct" | "wrong" | "selected" =
                "default";
              if (revealed) {
                if (option === current.correctComponent) state = "correct";
                else if (option === selected) state = "wrong";
              } else if (option === selected) {
                state = "selected";
              }
              const isLargeComponentOption =
                isComponent &&
                (current.questionType === "completion" ||
                  current.questionType === "reverse");
              return (
                <GameOptionButton
                  key={option}
                  label={
                    current.optionLabels?.[option]
                      ? pickBreakdownLabel(
                          locale,
                          current.optionLabels[option]!.mn,
                          current.optionLabels[option]!.zh
                        ) || option
                      : option
                  }
                  state={state}
                  disabled={revealed}
                  onClick={() => handleSelect(option)}
                  className={
                    isLargeComponentOption
                      ? "!text-2xl !font-bold"
                      : "!text-sm !font-medium !leading-snug"
                  }
                />
              );
            })}
          </div>
          {revealed && (current.explanation || current.explanationZh) ? (
            <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
              <p translate="no">
                {locale === "zh"
                  ? current.explanationZh || current.explanation
                  : current.explanation || current.explanationZh}
              </p>
              {current.formula ? (
                <p className="mt-1 text-base font-semibold tracking-wide" translate="no">
                  {current.formula}
                </p>
              ) : null}
              {structureLabel ? (
                <p className="mt-1 text-xs text-emerald-800">
                  {tr(locale, "Бүтэц")}:{" "}
                  <span translate="no">{structureLabel}</span>
                </p>
              ) : null}
            </div>
          ) : null}
          {popGlyph && popGlyph !== "?" && current ? (
            <HanziPartPopover
              glyph={popGlyph}
              parent={current.chinese}
              parts={formulaGlyphs}
              partIndex={partPop ?? undefined}
              fallbackMn={popPartData?.labelMn}
              fallbackZh={popPartData?.labelZh}
              role={popPartData?.role}
              onClose={() => setPartPop(null)}
            />
          ) : null}
          {revealed && writingHref ? (
            <Link
              href={writingHref}
              className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {HANZI_WRITING_LABELS.traceWriteLong}
            </Link>
          ) : null}
          {revealed ? (
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 min-h-[48px] w-full app-btn-primary py-3"
            >
              {tr(locale, index < total - 1 ? "Дараах" : "Дуусгах")}
            </button>
          ) : null}
        </>
      ) : null}
    </GameShell>
  );
}
