"use client";

import { useCallback, useRef, useState } from "react";
import { ExerciseFeedback } from "@/components/motion/exercise-feedback";
import { MotionButton } from "@/components/motion/motion-pressable";
import type {  ExerciseOnResult,
  LessonV2ListeningItem,
  ListeningQuestionType,
} from "@/types/lesson-v2";
import { EXERCISE_PRIMARY, EXERCISE_PRIMARY_DARK, EXERCISE_PRIMARY_LIGHT } from "./exercise-theme";

type Props = {
  item: LessonV2ListeningItem;
  type: ListeningQuestionType;
  instructionMn?: string;
  /** Fully resolved audio URL */
  audioUrl?: string;
  onResult?: ExerciseOnResult;
};

const MC_LABELS = ["A", "B", "C", "D"] as const;

function normalizeMcAnswer(value: string): string {
  return value.trim().toUpperCase();
}

function isTrueAnswer(answer: string | boolean | undefined): boolean | null {
  if (typeof answer === "boolean") return answer;
  if (answer == null) return null;
  const lower = String(answer).trim().toLowerCase();
  if (["true", "t", "yes", "y", "1", "对", "對", "зөв", "zov"].includes(lower)) {
    return true;
  }
  if (["false", "f", "no", "n", "0", "错", "錯", "буруу"].includes(lower)) {
    return false;
  }
  return null;
}

export function ListeningQuestion({
  item,
  type,
  instructionMn,
  audioUrl,
  onResult,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");

  const playAudio = useCallback(async () => {
    if (!audioUrl) return;
    const audio = audioRef.current ?? new Audio(audioUrl);
    audioRef.current = audio;
    setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }, [audioUrl]);

  const evaluate = (choice: string) => {
    if (feedback !== "idle") return;

    let correct = false;

    if (type === "true_false") {
      const userTrue = choice === "true";
      const expected = isTrueAnswer(item.answer);
      correct = expected !== null && userTrue === expected;
    } else {
      const expected = normalizeMcAnswer(String(item.answer ?? ""));
      correct = normalizeMcAnswer(choice) === expected;
    }

    setSelected(choice);
    setFeedback(correct ? "correct" : "wrong");
    onResult?.({ correct });
  };

  const optionButtonClass = (choice: string) => {
    const isSelected = selected === choice;
    if (feedback === "idle") {
      return "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50";
    }
    if (!isSelected) {
      return "border-slate-100 bg-slate-50 text-slate-400 opacity-60";
    }
    return feedback === "correct"
      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
      : "border-red-300 bg-red-50 text-red-900";
  };

  return (
    <ExerciseFeedback
      status={feedback}
      className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
    >      <div
        className="mb-1 text-xs font-semibold uppercase tracking-wide"
        style={{ color: EXERCISE_PRIMARY }}
      >
        Сонсох дасгал
      </div>
      {instructionMn ? (
        <p className="mb-3 text-sm text-slate-600">{instructionMn}</p>
      ) : null}

      <div className="mb-4 flex justify-center">
        <MotionButton
          onClick={() => void playAudio()}
          disabled={!audioUrl || playing}
          className="inline-flex min-h-[48px] min-w-[140px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: EXERCISE_PRIMARY }}
        >
          {playing ? "▶ Тоглож байна…" : "▶ Сонсох"}
        </MotionButton>
      </div>
      {!audioUrl ? (
        <p className="mb-3 text-center text-xs text-amber-700">
          Audio URL байхгүй — demo-д TTS эсвэл файл нэмнэ үү.
        </p>
      ) : null}

      {type === "true_false" && item.statement_zh ? (
        <p className="mb-4 text-center text-lg font-medium text-slate-900">
          {item.statement_zh}
        </p>
      ) : null}

      {type === "true_false" ? (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { key: "true", label: "Зөв" },
              { key: "false", label: "Буруу" },
            ] as const
          ).map(({ key, label }) => (
            <MotionButton
              key={key}
              disabled={feedback !== "idle"}
              onClick={() => evaluate(key)}
              className={`min-h-[52px] rounded-2xl border-2 text-base font-bold transition-colors ${optionButtonClass(key)}`}
            >
              {label}
            </MotionButton>
          ))}        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(item.options ?? []).slice(0, 4).map((text, index) => {
            const label = MC_LABELS[index];
            return (
              <MotionButton
                key={label}
                disabled={feedback !== "idle"}
                onClick={() => evaluate(label)}
                className={`flex min-h-[52px] items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${optionButtonClass(label)}`}
              >                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: EXERCISE_PRIMARY_DARK }}
                >
                  {label}
                </span>
                <span className="pt-0.5 text-base leading-snug">{text}</span>
              </MotionButton>
            );          })}
        </div>
      )}

      {feedback === "correct" ? (
        <p className="mt-8 text-center text-sm font-semibold text-emerald-600">✓ Зөв!</p>
      ) : null}
      {feedback === "wrong" ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">✗ Буруу</p>
      ) : null}
    </ExerciseFeedback>
  );
}