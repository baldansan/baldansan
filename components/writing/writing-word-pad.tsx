"use client";

/**
 * Үгийг ХАМТАД НЬ бичих самбар: холбоо үгийн ханзуудыг нэг алхамд дараалуулан бичүүлнэ
 * (法 → 律), бүгд дуусахад л onDone дуудна. Ганц ханз бол WritingPad-тай адил.
 */
import { useEffect, useRef, useState } from "react";
import { WritingPad, type WritingPadPhase, type WritingPadResult } from "@/components/writing/writing-pad";

export type WritingWordResult = WritingPadResult & {
  /** Нэг ханзан дээр гаргасан хамгийн их алдаа. */
  worstChar: number;
};

type Props = {
  text: string;
  phase: WritingPadPhase;
  onDone: (result: WritingWordResult) => void;
  /** Ханз бүр дуусахад (түүхэнд ханз тус бүрээр бүртгэхэд). */
  onCharDone?: (ch: string, result: WritingPadResult, phase: WritingPadPhase) => void;
  maxSize?: number;
  guide?: boolean;
};

const HAN_RE = /\p{Script=Han}/u;

export function WritingWordPad({ text, phase, onDone, onCharDone, maxSize = 340, guide = true }: Props) {
  const chars = [...text].filter((c) => HAN_RE.test(c));
  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState(0);
  const acc = useRef({ mistakes: 0, usedHint: false, worstChar: 0 });
  const timer = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  const onCharDoneRef = useRef(onCharDone);
  useEffect(() => {
    onDoneRef.current = onDone;
    onCharDoneRef.current = onCharDone;
  });
  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    []
  );

  const ch = chars[idx] ?? chars[0] ?? text;
  const multi = chars.length > 1;

  function handle(result: WritingPadResult) {
    if (phase !== "watch") {
      acc.current = {
        mistakes: acc.current.mistakes + result.mistakes,
        usedHint: acc.current.usedHint || result.usedHint,
        worstChar: Math.max(acc.current.worstChar, result.mistakes),
      };
      onCharDoneRef.current?.(ch, result, phase);
    }
    if (idx < chars.length - 1) {
      if (timer.current != null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setIdx((i) => i + 1), phase === "watch" ? 500 : 420);
    } else {
      onDoneRef.current({ ...acc.current });
    }
  }

  return (
    <div className="w-full">
      {multi ? (
        <div className="wn-word-steps" translate="no">
          {chars.map((c, i) => {
            const state = i === idx ? "is-on" : i < idx ? "is-done" : "";
            const hidden = phase === "memory" && i >= idx;
            return phase === "watch" ? (
              <button
                key={`${c}-${i}`}
                type="button"
                className={state}
                onClick={() => {
                  if (timer.current != null) window.clearTimeout(timer.current);
                  setIdx(i);
                  setRun((r) => r + 1);
                }}
              >
                {c}
              </button>
            ) : (
              <span key={`${c}-${i}`} className={state}>
                {hidden ? "?" : c}
              </span>
            );
          })}
        </div>
      ) : null}
      <WritingPad
        key={`${idx}-${run}`}
        char={ch}
        phase={phase}
        onDone={handle}
        maxSize={maxSize}
        guide={guide}
      />
    </div>
  );
}
