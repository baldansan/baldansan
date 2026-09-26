"use client";

import { useState, type ReactNode } from "react";
import type {
  DeepCompare,
  DeepExample,
  DeepGrammar,
  DeepHanzi,
  DeepMistake,
  DeepPronunciation,
  DeepWord,
} from "@/types/lesson-deep-teaching";

/* ------------------------------------------------------------------ жижиг --- */

function ExampleRow({ example }: { example: DeepExample }) {
  return (
    <li className="bs-deep-ex">
      <p className="bs-deep-ex-zh hanzi">{example.zh}</p>
      {example.pinyin ? (
        <p className="bs-deep-ex-py">{example.pinyin}</p>
      ) : null}
      <p translate="no" className="bs-deep-ex-mn">{example.mn}</p>
      {example.note_mn ? (
        <p translate="no" className="bs-deep-ex-note">{example.note_mn}</p>
      ) : null}
    </li>
  );
}

function ExampleList({
  examples,
  title = "Жишээ",
}: {
  examples?: DeepExample[];
  title?: string;
}) {
  if (!examples?.length) return null;
  return (
    <div className="bs-deep-block">
      <p className="bs-deep-block-title">{title}</p>
      <ul className="bs-deep-ex-list">
        {examples.map((example, index) => (
          <ExampleRow key={`${example.zh}-${index}`} example={example} />
        ))}
      </ul>
    </div>
  );
}

function MistakeList({ mistakes }: { mistakes?: DeepMistake[] }) {
  if (!mistakes?.length) return null;
  return (
    <div className="bs-deep-block">
      <p className="bs-deep-block-title">Түгээмэл алдаа</p>
      <ul className="bs-deep-mistakes">
        {mistakes.map((mistake, index) => (
          <li key={`${mistake.wrong}-${index}`} className="bs-deep-mistake">
            <p className="bs-deep-wrong hanzi">
              <span aria-hidden>✗</span> {mistake.wrong}
            </p>
            <p className="bs-deep-right hanzi">
              <span aria-hidden>✓</span> {mistake.right}
            </p>
            <p translate="no" className="bs-deep-why">{mistake.why_mn}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareList({
  compare,
  title,
}: {
  compare?: DeepCompare[];
  title: string;
}) {
  if (!compare?.length) return null;
  return (
    <div className="bs-deep-block">
      <p className="bs-deep-block-title">{title}</p>
      <ul className="bs-deep-compare">
        {compare.map((row, index) => (
          <li key={`${row.zh}-${index}`} className="bs-deep-compare-row">
            <span className="bs-deep-compare-zh hanzi">{row.zh}</span>
            <span translate="no" className="bs-deep-compare-meta">
              {row.pinyin ? `${row.pinyin} · ` : ""}
              {row.mn}
            </span>
            <span translate="no" className="bs-deep-compare-diff">{row.diff_mn}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Нээгддэг хэсэг — дэлгэц дүүрэн текстээр дарахгүйн тулд. */
export function DeepDisclosure({
  label,
  children,
  defaultOpen = false,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "accent";
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`bs-deep bs-deep--${tone}`}>
      <button
        type="button"
        className="bs-deep-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="bs-deep-toggle-icon" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="bs-deep-body">{children}</div> : null}
    </section>
  );
}

/* -------------------------------------------------------------------- үг --- */

export function DeepWordPanel({ word }: { word: DeepWord }) {
  return (
    <DeepDisclosure label="Дэлгэрэнгүй тайлбар" tone="accent">
      <p translate="no" className="bs-deep-teach">{word.teach_mn}</p>

      {word.usage_mn?.length ? (
        <div className="bs-deep-block">
          <p className="bs-deep-block-title">Хэрэглээ</p>
          <ul translate="no" className="bs-deep-bullets">
            {word.usage_mn.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ExampleList examples={word.examples} />
      <MistakeList mistakes={word.mistakes} />
      <CompareList compare={word.compare} title="Ойролцоо үгтэй харьцуулбал" />
    </DeepDisclosure>
  );
}

/* ----------------------------------------------------------------- дүрэм --- */

export function DeepGrammarPanel({ grammar }: { grammar: DeepGrammar }) {
  return (
    <div className="bs-deep-grammar">
      {grammar.structure ? (
        <p className="bs-deep-structure hanzi">{grammar.structure}</p>
      ) : null}

      {grammar.steps?.length ? (
        <ol className="bs-deep-steps">
          {grammar.steps.map((step, index) => (
            <li key={index} className="bs-deep-step">
              <p translate="no" className="bs-deep-step-title">{step.title_mn}</p>
              <p translate="no" className="bs-deep-step-body">{step.body_mn}</p>
              {step.example ? (
                <div className="bs-deep-step-example">
                  <p className="bs-deep-ex-zh hanzi">{step.example.zh}</p>
                  {step.example.pinyin ? (
                    <p className="bs-deep-ex-py">{step.example.pinyin}</p>
                  ) : null}
                  <p translate="no" className="bs-deep-ex-mn">{step.example.mn}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      <ExampleList examples={grammar.examples} title="Бусад жишээ" />
      <MistakeList mistakes={grammar.mistakes} />
    </div>
  );
}

/* ------------------------------------------------------------------ ханз --- */

export function DeepHanziPanel({ hanzi }: { hanzi: DeepHanzi }) {
  const parts = [
    ...(hanzi.radical ? [{ ...hanzi.radical, isRadical: true }] : []),
    ...(hanzi.components ?? []).map((c) => ({ ...c, isRadical: false })),
  ];

  return (
    <DeepDisclosure label="Ханзны бүтэц, түүх">
      {hanzi.meaning_mn ? (
        <p translate="no" className="bs-deep-teach">
          <span className="hanzi">{hanzi.hanzi}</span>
          {hanzi.pinyin ? ` (${hanzi.pinyin})` : ""} — {hanzi.meaning_mn}
        </p>
      ) : null}

      {parts.length > 0 ? (
        <div className="bs-deep-block">
          <p className="bs-deep-block-title">Бүрэлдэхүүн хэсэг</p>
          <ul className="bs-deep-parts">
            {parts.map((part, index) => (
              <li key={`${part.c}-${index}`} className="bs-deep-part">
                <span className="bs-deep-part-c hanzi">{part.c}</span>
                <span translate="no" className="bs-deep-part-meaning">{part.meaning_mn}</span>
                {part.role_mn ? (
                  <span translate="no" className="bs-deep-part-role">{part.role_mn}</span>
                ) : null}
                {part.isRadical ? (
                  <span className="bs-deep-part-badge">язгуур</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hanzi.story_mn ? (
        <div className="bs-deep-block">
          <p className="bs-deep-block-title">Санахад тус болох нь</p>
          <p translate="no" className="bs-deep-step-body">{hanzi.story_mn}</p>
        </div>
      ) : null}

      {hanzi.stroke_tips_mn?.length ? (
        <div className="bs-deep-block">
          <p className="bs-deep-block-title">
            Бичих дараалал
            {hanzi.stroke_count ? ` · ${hanzi.stroke_count} зурлага` : ""}
          </p>
          <ul translate="no" className="bs-deep-bullets">
            {hanzi.stroke_tips_mn.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <CompareList
        compare={hanzi.confusable}
        title="Андуурч болзошгүй ханз"
      />

      {hanzi.words?.length ? (
        <div className="bs-deep-block">
          <p className="bs-deep-block-title">Энэ ханз орсон үгс</p>
          <ul className="bs-deep-words">
            {hanzi.words.map((word, index) => (
              <li key={`${word.zh}-${index}`}>
                <span className="hanzi">{word.zh}</span>
                <span translate="no" className="bs-deep-compare-meta">
                  {word.pinyin ? `${word.pinyin} · ` : ""}
                  {word.mn}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DeepDisclosure>
  );
}

/* -------------------------------------------------------------- дуудлага --- */

export function DeepPronunciationPanel({
  pronunciation,
}: {
  pronunciation: DeepPronunciation;
}) {
  const hasDrills = (pronunciation.drills?.length ?? 0) > 0;
  if (!pronunciation.focus_mn && !hasDrills && !pronunciation.tips_mn?.length) {
    return null;
  }

  return (
    <DeepDisclosure label="Дуудлагын дасгал" tone="accent">
      {pronunciation.focus_mn ? (
        <p translate="no" className="bs-deep-teach">{pronunciation.focus_mn}</p>
      ) : null}

      {pronunciation.drills?.map((drill, index) => (
        <div key={index} className="bs-deep-block">
          <p translate="no" className="bs-deep-block-title">{drill.title_mn}</p>
          {drill.instruction_mn ? (
            <p translate="no" className="bs-deep-step-body">{drill.instruction_mn}</p>
          ) : null}
          <ul className="bs-deep-pairs">
            {drill.pairs.map((pair, pairIndex) => (
              <li key={pairIndex} className="bs-deep-pair">
                <div className="bs-deep-pair-row">
                  <span className="bs-deep-pair-side">
                    <b className="hanzi">{pair.a.zh}</b>
                    <span>{pair.a.pinyin}</span>
                    <span translate="no" className="bs-deep-pair-mn">{pair.a.mn}</span>
                  </span>
                  <span className="bs-deep-pair-vs" aria-hidden>
                    ↔
                  </span>
                  <span className="bs-deep-pair-side">
                    <b className="hanzi">{pair.b.zh}</b>
                    <span>{pair.b.pinyin}</span>
                    <span translate="no" className="bs-deep-pair-mn">{pair.b.mn}</span>
                  </span>
                </div>
                {pair.note_mn ? (
                  <p translate="no" className="bs-deep-why">{pair.note_mn}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {pronunciation.tips_mn?.length ? (
        <div className="bs-deep-block">
          <p className="bs-deep-block-title">Зөвлөгөө</p>
          <ul translate="no" className="bs-deep-bullets">
            {pronunciation.tips_mn.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </DeepDisclosure>
  );
}
