"use client";

/**
 * «Зурлагын үндэс» — анх ханз бичихийн өмнөх богино хичээл.
 *   1) 8 үндсэн зурлага: тус бүрийг харна → дагаж зурна
 *   2) Бичих дарааллын 6 дүрэм
 *   3) Дөрвөн энгийн ханзыг дагаж зурна (зурлага бүрийн нэр, чиглэл хажууд гарна)
 * Сурагчид хятад нэр томьёо харуулахгүй.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { HanziGlyph } from "@/components/writing/hanzi-glyph";
import { StrokePad } from "@/components/writing/stroke-pad";
import { WritingPad } from "@/components/writing/writing-pad";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { recordHanziWrite } from "@/lib/writing/hanzi-history";
import {
  readStrokeLessonState,
  STROKE_LESSON,
  STROKE_LESSON_TRY,
  STROKE_ORDER_RULES,
  writeStrokeLessonState,
} from "@/lib/writing/stroke-lesson";
import type { StrokeKindId } from "@/lib/writing/stroke-kind";
import "@/components/writing/writing.css";

type Part = "strokes" | "rules" | "try" | "end";

export function StrokesLessonClient() {
  const locale = useUiLocale();
  const [part, setPart] = useState<Part>("strokes");
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"watch" | "trace">("watch");
  const [runKey, setRunKey] = useState(0);
  const [traced, setTraced] = useState(false);
  const [done, setDone] = useState<StrokeKindId[]>([]);
  const [openRule, setOpenRule] = useState<number | null>(null);
  const [tryIndex, setTryIndex] = useState(0);
  const [tryKey, setTryKey] = useState(0);
  const [tryDone, setTryDone] = useState(false);

  useEffect(() => {
    const saved = readStrokeLessonState();
    setDone(saved.done);
    const firstTodo = STROKE_LESSON.findIndex((s) => !saved.done.includes(s.id));
    if (firstTodo > 0) setIndex(firstTodo);
  }, []);

  const stroke = STROKE_LESSON[index]!;

  function openStroke(i: number) {
    setPart("strokes");
    setIndex(i);
    setMode("watch");
    setTraced(false);
    setRunKey((k) => k + 1);
  }

  function markStrokeDone() {
    setTraced(true);
    if (!done.includes(stroke.id)) {
      const next = [...done, stroke.id];
      setDone(next);
      writeStrokeLessonState({ done: next, finished: readStrokeLessonState().finished });
    }
  }

  function nextStroke() {
    if (index < STROKE_LESSON.length - 1) openStroke(index + 1);
    else setPart("rules");
  }

  function finish() {
    writeStrokeLessonState({ done: STROKE_LESSON.map((s) => s.id), finished: true });
    setPart("end");
  }

  const partNo = part === "strokes" ? 1 : part === "rules" ? 2 : 3;

  return (
    <MobileAppShell activeTab="study">
      <Link
        href="/writing"
        className="mb-2 inline-flex items-center text-sm font-medium text-[var(--app-muted)]"
      >
        {tr(locale, "← Дэвтэр рүү")}
      </Link>
      <h1 className="text-[22px] font-black leading-tight text-[var(--app-text)]">
        {tr(locale, "Зурлагын үндэс")}
      </h1>
      {part !== "end" ? (
        <div className="wn-sl-tabs" role="tablist">
          {(
            [
              ["strokes", "8 зурлага"],
              ["rules", "Бичих дараалал"],
              ["try", "Өөрөө бичих"],
            ] as [Part, string][]
          ).map(([id, label], i) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={part === id}
              className={part === id ? "is-on" : i + 1 < partNo ? "is-done" : ""}
              onClick={() => {
                if (id === "strokes") openStroke(index);
                else {
                  setPart(id);
                  if (id === "try") {
                    setTryDone(false);
                    setTryKey((k) => k + 1);
                  }
                }
              }}
            >
              <span>{i + 1}</span> {tr(locale, label)}
            </button>
          ))}
        </div>
      ) : null}

      {part === "strokes" ? (
        <>
          <div className="mb-3 text-center">
            <p className="text-xl font-black text-[var(--app-text)]">
              {index + 1}. {tr(locale, stroke.name)}
            </p>
            <p className="mx-auto mt-0.5 max-w-[330px] text-sm leading-snug text-[var(--app-muted)]">
              {tr(locale, stroke.how)}
            </p>
          </div>
          <StrokePad
            ch={stroke.ch}
            idx={stroke.idx}
            mode={mode}
            runKey={runKey}
            maxSize={260}
            onDone={() => {
              if (mode === "trace") markStrokeDone();
            }}
          />
          <div className="mt-3 flex gap-2">
            {mode === "watch" ? (
              <>
                <button type="button" className="wn-btn-ghost flex-1" onClick={() => setRunKey((k) => k + 1)}>
                  {tr(locale, "Дахин үзэх")}
                </button>
                <button
                  type="button"
                  className="app-btn-primary flex-[1.4]"
                  onClick={() => {
                    setMode("trace");
                    setTraced(false);
                    setRunKey((k) => k + 1);
                  }}
                >
                  ✍️ {tr(locale, "Дагаж зурах")}
                </button>
              </>
            ) : traced ? (
              <>
                <button
                  type="button"
                  className="wn-btn-ghost flex-1"
                  onClick={() => {
                    setTraced(false);
                    setRunKey((k) => k + 1);
                  }}
                >
                  {tr(locale, "Дахин зурах")}
                </button>
                <button type="button" className="app-btn-primary flex-[1.4]" onClick={nextStroke}>
                  ✓ {index < STROKE_LESSON.length - 1 ? tr(locale, "Дараагийн зурлага") : tr(locale, "Бичих дараалал руу")} →
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="wn-btn-ghost flex-1"
                  onClick={() => {
                    setMode("watch");
                    setRunKey((k) => k + 1);
                  }}
                >
                  👀 {tr(locale, "Дахин харах")}
                </button>
                <p className="flex flex-[1.4] items-center justify-center text-sm font-semibold text-[var(--app-primary)]">
                  {tr(locale, "Улбар шар цэгээс эхэлж зур")}
                </p>
              </>
            )}
          </div>

          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-xs text-[var(--app-muted)]">
            <span className="wn-sl-legend" aria-hidden />
            {tr(locale, "эхлэх цэг ба чиглэл")}
            <span aria-hidden>·</span>
            {tr(locale, "ийм зурлагатай ханз")}:
            <b className="text-base font-semibold text-[var(--app-text)]" translate="no">
              {stroke.seenIn.join(" ")}
            </b>
          </p>

          <div className="mb-2 mt-5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--app-text)]">{tr(locale, "8 зурлага")}</h2>
            <span className="text-xs font-semibold text-[var(--app-muted)]">
              {done.length} / {STROKE_LESSON.length}
            </span>
          </div>
          <div className="wn-sl-grid mb-6">
            {STROKE_LESSON.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openStroke(i)}
                className={i === index ? "is-on" : done.includes(s.id) ? "is-done" : ""}
              >
                <HanziGlyph ch={s.ch} only={s.idx} size={44} />
                <span>
                  {done.includes(s.id) ? "✓ " : ""}
                  {tr(locale, s.name)}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {part === "rules" ? (
        <>
          <p className="mb-3 text-sm text-[var(--app-muted)]">
            {tr(locale, "Зурлагуудыг тогтсон дарааллаар бичдэг. Тод өнгөтэй нь эхэлж бичигдэнэ. Мөр дээр дарж хөдөлгөөнөөр үз.")}
          </p>
          <MobileCard padding="sm" className="mb-4 !py-1">
            {STROKE_ORDER_RULES.map((r, i) => (
              <div key={r.ch} className="wn-sl-rule">
                <button
                  type="button"
                  className="wn-sl-rule-head"
                  aria-expanded={openRule === i}
                  onClick={() => setOpenRule(openRule === i ? null : i)}
                >
                  <span className="wn-sl-num">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-left">
                    <b className="block text-sm text-[var(--app-text)]">{tr(locale, r.title)}</b>
                    <small className="block text-xs text-[var(--app-muted)]">{tr(locale, r.detail)}</small>
                  </span>
                  <HanziGlyph ch={r.ch} highlight={r.first} size={48} />
                </button>
                {openRule === i ? (
                  <div className="pb-3">
                    <WritingPad char={r.ch} phase="watch" onDone={() => {}} maxSize={200} guide={false} />
                  </div>
                ) : null}
              </div>
            ))}
          </MobileCard>
          <button
            type="button"
            className="app-btn-primary mb-6 w-full"
            onClick={() => {
              setPart("try");
              setTryIndex(0);
              setTryDone(false);
              setTryKey((k) => k + 1);
            }}
          >
            ✍️ {tr(locale, "Одоо өөрөө бичээд үзье")} →
          </button>
        </>
      ) : null}

      {part === "try" ? (
        <>
          <div className="mb-3 flex justify-center gap-2">
            {STROKE_LESSON_TRY.map((c, i) => (
              <span
                key={c}
                translate="no"
                className={`wn-sl-try ${i === tryIndex ? "is-on" : i < tryIndex ? "is-done" : ""}`}
              >
                {c}
              </span>
            ))}
          </div>
          <WritingPad
            key={`${tryIndex}-${tryKey}`}
            char={STROKE_LESSON_TRY[tryIndex]!}
            phase="trace"
            maxSize={260}
            onDone={(result) => {
              recordHanziWrite({
                ch: STROKE_LESSON_TRY[tryIndex]!,
                source: "book",
                mistakes: result.mistakes,
                recalled: null,
              });
              setTryDone(true);
            }}
          />
          <div className="mb-6 mt-3 flex gap-2">
            <button
              type="button"
              className="wn-btn-ghost flex-1"
              onClick={() => {
                setTryDone(false);
                setTryKey((k) => k + 1);
              }}
            >
              {tr(locale, "Дахин зурах")}
            </button>
            <button
              type="button"
              disabled={!tryDone}
              className="app-btn-primary flex-[1.4] disabled:opacity-40"
              onClick={() => {
                if (tryIndex < STROKE_LESSON_TRY.length - 1) {
                  setTryIndex(tryIndex + 1);
                  setTryDone(false);
                } else finish();
              }}
            >
              {tryIndex < STROKE_LESSON_TRY.length - 1 ? tr(locale, "Дараагийн ханз") : tr(locale, "Дуусгах")} →
            </button>
          </div>
        </>
      ) : null}

      {part === "end" ? (
        <MobileCard padding="lg" className="mt-4 text-center">
          <p className="text-4xl" aria-hidden>
            🎉
          </p>
          <p className="mt-2 text-lg font-black text-[var(--app-text)]">
            {tr(locale, "Зурлагын үндсээ мэддэг боллоо")}
          </p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {tr(locale, "Одооноос ханз дагаж зурахад зурлага бүрийн нэр, чиглэл хажууд нь гарч байх болно.")}
          </p>
          <Link href="/writing" className="app-btn-primary mt-4 inline-flex w-full justify-center">
            {tr(locale, "Ханзны дэвтэр рүү")} →
          </Link>
          <button type="button" className="wn-btn-ghost mt-2 w-full" onClick={() => openStroke(0)}>
            {tr(locale, "Дахин үзэх")}
          </button>
        </MobileCard>
      ) : null}
    </MobileAppShell>
  );
}
