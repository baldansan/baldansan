"use client";

import { useEffect, useId, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { localHanziCharDataLoader } from "@/lib/hanzi/character-data-loader";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { LearnWord } from "@/lib/games/learn-session";

type Props = {
  word: LearnWord;
  meaning: string;
  /** Бүх ханзыг зурж дуусахад: тусламжгүй зурсан бол correct=true. */
  onDone: (correct: boolean) => void;
};

/** Нэг зурлага дээр ийм олон алдвал заавар гарч, «цээжлээгүй» гэж тооцно. */
const HINT_AFTER_MISSES = 3;

/**
 * «Ханз зурах» — утга, пиньинийг хараад ханзыг ЗАГВАРГҮЙГЭЭР, зурлагын дарааллаар санаж зурна.
 * Тусламж (заавар / «харуулах») аваагүй бол цээжилснээ баталсан гэж тооцно.
 */
export function WriteRound({ word, meaning, onDone }: Props) {
  const locale = useUiLocale();
  const mountId = useId().replace(/:/g, "");
  const chars = [...(word.simplified ?? "")];
  const [index, setIndex] = useState(0);
  const [helped, setHelped] = useState(false);
  const [state, setState] = useState<"loading" | "draw" | "shown" | "done">("loading");
  const [strokes, setStrokes] = useState({ done: 0, total: 0 });
  const writerRef = useRef<HanziWriter | null>(null);
  const helpedRef = useRef(false);
  const finishedRef = useRef(false);

  const finish = (ok: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setState("done");
    onDone(ok);
  };

  const advance = () => {
    if (index + 1 >= chars.length) finish(!helpedRef.current);
    else setIndex(index + 1);
  };

  useEffect(() => {
    let cancelled = false;
    const char = chars[index];
    writerRef.current = null;
    setState("loading");
    setStrokes({ done: 0, total: 0 });

    void (async () => {
      const mount = document.getElementById(mountId);
      if (!mount || !char) return;
      mount.innerHTML = "";
      let total = 0;
      try {
        const data = await HanziWriter.loadCharacterData(char, {
          charDataLoader: localHanziCharDataLoader,
        });
        total = data?.strokes?.length ?? 0;
      } catch {
        // Зурлагын өгөгдөлгүй ханз (ховор) — алгасна, оноонд нөлөөлөхгүй.
        if (!cancelled) advance();
        return;
      }
      if (cancelled) return;
      const writer = HanziWriter.create(mount, char, {
        width: 260,
        height: 260,
        padding: 16,
        showOutline: false,
        showCharacter: false,
        drawingColor: "#7C4DDB",
        drawingWidth: 12,
        strokeColor: "#4A2A9E",
        highlightColor: "#F47BA5",
        charDataLoader: localHanziCharDataLoader,
      });
      writerRef.current = writer;
      setStrokes({ done: 0, total });
      setState("draw");
      void writer.quiz({
        leniency: 1.25,
        showHintAfterMisses: HINT_AFTER_MISSES,
        markStrokeCorrectAfterMisses: 6,
        highlightOnComplete: true,
        onMistake: (data: { mistakesOnStroke: number }) => {
          if (data.mistakesOnStroke >= HINT_AFTER_MISSES && !helpedRef.current) {
            helpedRef.current = true;
            setHelped(true);
          }
        },
        onCorrectStroke: (data: { strokeNum: number }) => {
          setStrokes({ done: data.strokeNum + 1, total });
        },
        onComplete: () => {
          if (cancelled) return;
          window.setTimeout(() => {
            if (!cancelled) advance();
          }, 650);
        },
      });
    })();

    return () => {
      cancelled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mountId]);

  function showAnswer() {
    const writer = writerRef.current;
    if (!writer || state !== "draw") return;
    helpedRef.current = true;
    setHelped(true);
    writer.cancelQuiz();
    setState("shown");
    void writer.animateCharacter();
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-center text-xs font-semibold text-slate-500">
        {tr(locale, "Утгыг хараад ханзыг санаж зур")}
      </p>
      <p className="mt-2 text-center text-xl font-extrabold text-slate-900" translate="no">
        {meaning}
      </p>
      <p className="mt-0.5 flex items-center justify-center gap-2 text-center text-sm text-slate-500" translate="no">
        <span>{word.pinyin}</span>
        <button
          type="button"
          onClick={() => void playChineseWordAudio(word.simplified ?? "")}
          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
          aria-label={tr(locale, "Сонсох")}
        >
          🔊
        </button>
      </p>

      {chars.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5" translate="no">
          {chars.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold ring-1 ${
                i < index || state === "done"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-300"
                  : i === index
                    ? "bg-white text-slate-400 ring-2 ring-[var(--app-primary)]"
                    : "bg-slate-50 text-slate-300 ring-slate-200"
              }`}
            >
              {i < index || state === "done" ? c : i + 1}
            </span>
          ))}
        </div>
      ) : null}

      <div className="bs-write-grid mx-auto mt-3">
        <div id={mountId} className="bs-write-grid-canvas" />
      </div>

      <p className="mt-2 text-center text-xs font-semibold text-slate-500">
        {state === "loading"
          ? tr(locale, "Ачаалж байна…")
          : state === "shown"
            ? tr(locale, "Зурлагын дарааллыг сайн хараарай")
            : strokes.total > 0
              ? `${tr(locale, "Зурлага")} ${strokes.done}/${strokes.total}`
              : ""}
      </p>
      {helped && state !== "done" ? (
        <p className="mt-1 text-center text-xs font-semibold text-rose-600">
          {tr(locale, "Тусламж авсан тул энэ үг дахин ирнэ.")}
        </p>
      ) : null}

      {state === "shown" ? (
        <button
          type="button"
          onClick={advance}
          className="mt-3 w-full rounded-full bg-emerald-600 py-3.5 text-base font-extrabold text-white"
        >
          {tr(locale, "Үргэлжлүүлэх")}
        </button>
      ) : (
        <button
          type="button"
          disabled={state !== "draw"}
          onClick={showAnswer}
          className="mt-3 w-full rounded-full bg-slate-100 py-3 text-sm font-bold text-slate-600 disabled:opacity-40"
        >
          {tr(locale, "Санахгүй байна — харуулах")}
        </button>
      )}
    </section>
  );
}
