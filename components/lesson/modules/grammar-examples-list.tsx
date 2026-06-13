"use client";

import { useMemo, useState } from "react";
import {
  WordTapSheet,
  type WordTapAnchorRect,
  type WordTapPayload,
} from "@/components/lesson/word-tap-sheet";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import { coalesceSentenceTokens } from "@/lib/lesson/coalesce-text-tokens";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import type {
  HskPackageGrammarExample,
  HskPackageVocabItem,
} from "@/types/hsk-lesson-package";

type Props = {
  examples: HskPackageGrammarExample[];
  vocabulary?: HskPackageVocabItem[];
};

function buildVocabMap(words: HskPackageVocabItem[]): Map<string, HskPackageVocabItem> {
  const map = new Map<string, HskPackageVocabItem>();
  for (const w of words) {
    const zh = String(w.zh ?? "").trim();
    if (zh) map.set(zh, w);
  }
  return map;
}

export function GrammarExamplesList({ examples, vocabulary = [] }: Props) {
  const vocabByZh = useMemo(() => buildVocabMap(vocabulary), [vocabulary]);
  const vocabWords = useMemo(() => [...vocabByZh.keys()], [vocabByZh]);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [pickedWord, setPickedWord] = useState<WordTapPayload | null>(null);
  const [wordTapAnchor, setWordTapAnchor] = useState<WordTapAnchorRect | null>(
    null
  );

  if (examples.length === 0) return null;

  function toggleReveal(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function pickWord(zh: string, pinyin: string | undefined, el: HTMLElement) {
    void playChineseWordAudio(zh);
    const lesson = vocabByZh.get(zh);
    setPickedWord({
      zh,
      pinyin: pinyin || lesson?.pinyin,
      lessonMn: lesson?.mn,
    });
    setWordTapAnchor(el.getBoundingClientRect());
  }

  return (
    <div className="bs-gr2-examples">
      <p className="bs-gr2-section-label">Жишээ</p>
      <div className="bs-gr2-examples-list">
        {examples.map((ex, idx) => {
          const isOpen = revealed.has(idx);
          const tokens = coalesceSentenceTokens(
            { zh: ex.zh, pinyin: ex.pinyin, mn: ex.mn, tokens: [] },
            vocabWords
          );
          const hasWordTap = vocabWords.length > 0;

          return (
            <div className="bs-gr2-example" key={`${ex.zh}-${idx}`}>
              <div className="bs-gr2-example-zh-line">
                {hasWordTap
                  ? tokens.map((tok, ti) => {
                      const vocab = vocabByZh.get(tok.zh);
                      const py = tok.py || ex.pinyin || vocab?.pinyin;
                      if (vocab) {
                        return (
                          <button
                            key={ti}
                            type="button"
                            className="bs-gr2-word-tap"
                            onClick={(e) =>
                              pickWord(tok.zh, py, e.currentTarget)
                            }
                          >
                            {tok.zh}
                          </button>
                        );
                      }
                      return (
                        <span key={ti} className="bs-gr2-word-plain">
                          {tok.zh}
                        </span>
                      );
                    })
                  : (
                    <span className="bs-gr2-example-zh">{ex.zh}</span>
                  )}
              </div>
              {ex.pinyin ? (
                <p className="bs-gr2-example-py">{ex.pinyin}</p>
              ) : null}
              <button
                type="button"
                className={`bs-gr2-mn-reveal ${isOpen ? "bs-gr2-mn-reveal--open" : ""}`}
                onClick={() => toggleReveal(idx)}
                aria-expanded={isOpen}
              >
                <span
                  className={`bs-gr2-mn-text ${isOpen ? "" : "bs-gr2-mn-text--blur"}`}
                >
                  <MnGrammarTermText text={ex.mn} />
                </span>
                <span className="bs-gr2-mn-hint">
                  {isOpen ? "Нуух" : "Орчуулга харах"}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {pickedWord && wordTapAnchor ? (
        <WordTapSheet
          word={pickedWord}
          anchor={wordTapAnchor}
          onClose={() => {
            setPickedWord(null);
            setWordTapAnchor(null);
          }}
        />
      ) : null}
    </div>
  );
}
