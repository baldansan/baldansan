"use client";

import { useEffect, useState } from "react";
import type {
  HskPackageParagraphSummary,
  HskPackageShortText,
  HskPackageTextSentence,
  HskPackageVocabItem,
} from "@/types/hsk-lesson-package";
import { WordTapSheet, type WordTapPayload } from "@/components/lesson/word-tap-sheet";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import {
  loadTextReaderShowMn,
  loadTextReaderShowPinyin,
  saveTextReaderShowMn,
  saveTextReaderShowPinyin,
} from "@/lib/lesson/text-reader-prefs";

type VocabHint = { zh: string; pinyin: string; mn: string };

function buildVocabMap(words: HskPackageVocabItem[]): Map<string, VocabHint> {
  const map = new Map<string, VocabHint>();
  for (const w of words) {
    const zh = String(w.zh ?? "").trim();
    if (!zh) continue;
    map.set(zh, {
      zh,
      pinyin: String(w.pinyin ?? "").trim(),
      mn: String(w.mn ?? "").trim(),
    });
  }
  return map;
}

type Props = {
  text: HskPackageShortText;
  vocabulary?: HskPackageVocabItem[];
};

export function LiveTextReader({ text, vocabulary = [] }: Props) {
  const vocabByZh = buildVocabMap(vocabulary);
  const sentences: HskPackageTextSentence[] = text.sentences ?? [];

  const [showPinyin, setShowPinyin] = useState(true);
  const [showMn, setShowMn] = useState(true);
  const [prefsReady, setPrefsReady] = useState(false);
  const [openNotes, setOpenNotes] = useState<Set<number>>(() => new Set());
  const [pickedWord, setPickedWord] = useState<WordTapPayload | null>(null);

  useEffect(() => {
    setShowPinyin(loadTextReaderShowPinyin());
    setShowMn(loadTextReaderShowMn());
    setPrefsReady(true);
  }, []);

  function togglePinyin() {
    setShowPinyin((prev) => {
      const next = !prev;
      saveTextReaderShowPinyin(next);
      return next;
    });
  }

  function toggleMn() {
    setShowMn((prev) => {
      const next = !prev;
      saveTextReaderShowMn(next);
      return next;
    });
  }

  function pickWord(zh: string, pinyin?: string) {
    void playChineseWordAudio(zh);
    const lesson = vocabByZh.get(zh);
    setPickedWord({
      zh,
      pinyin: pinyin || lesson?.pinyin,
      lessonMn: lesson?.mn,
    });
  }

  function renderLegacySentence(sentence: HskPackageTextSentence, si: number) {
    const hasNote =
      Boolean(sentence.note?.trim()) ||
      (sentence.key_structures?.length ?? 0) > 0;
    const noteOpen = openNotes.has(si);

    return (
      <div
        key={si}
        className={`bs-txt-sentence${hasNote ? " bs-txt-sentence--noted" : ""}`}
      >
        <div className="bs-txt-ruby-line">
          {sentence.tokens.map((tok, ti2) => {
            const vocab = vocabByZh.get(tok.zh);
            const isLessonWord = Boolean(vocab);
            const py = tok.py || (isLessonWord ? vocab!.pinyin : "");
            return (
              <span key={ti2} className="bs-txt-unit">
                {showPinyin && py ? (
                  <span className="bs-txt-py-above">{py}</span>
                ) : showPinyin ? (
                  <span className="bs-txt-py-above bs-txt-py-empty" aria-hidden>
                    &nbsp;
                  </span>
                ) : null}
                {isLessonWord ? (
                  <button
                    type="button"
                    className="bs-newword"
                    onClick={() => pickWord(tok.zh, py || vocab!.pinyin)}
                  >
                    {tok.zh}
                  </button>
                ) : (
                  <span className="bs-txt-zh-char">{tok.zh}</span>
                )}
              </span>
            );
          })}
        </div>
        {showMn && sentence.mn ? (
          <div className="bs-txt-mn-line">
            <MnGrammarTermText text={sentence.mn} />
          </div>
        ) : null}
        {renderSentenceNote(sentence, si, hasNote, noteOpen)}
      </div>
    );
  }

  function renderTappableSentence(sentence: HskPackageTextSentence, si: number) {
    const hasNote =
      Boolean(sentence.note?.trim()) ||
      (sentence.key_structures?.length ?? 0) > 0;
    const noteOpen = openNotes.has(si);

    return (
      <div
        key={si}
        className={`bs-txt-sentence${hasNote ? " bs-txt-sentence--noted" : ""}`}
      >
        <div className="bs-txt-ruby-line">
          {sentence.tokens.map((tok, ti2) => {
            const py = tok.py || vocabByZh.get(tok.zh)?.pinyin || "";
            return (
              <span key={ti2} className="bs-txt-unit">
                {showPinyin && py ? (
                  <span className="bs-txt-py-above">{py}</span>
                ) : showPinyin ? (
                  <span className="bs-txt-py-above bs-txt-py-empty" aria-hidden>
                    &nbsp;
                  </span>
                ) : null}
                <button
                  type="button"
                  className="bs-txt-word"
                  onClick={() => pickWord(tok.zh, py)}
                >
                  {tok.zh}
                </button>
              </span>
            );
          })}
        </div>
        {showMn && sentence.mn ? (
          <div className="bs-txt-mn-line">
            <MnGrammarTermText text={sentence.mn} />
          </div>
        ) : null}
        {renderSentenceNote(sentence, si, hasNote, noteOpen)}
      </div>
    );
  }

  function renderSentenceNote(
    sentence: HskPackageTextSentence,
    si: number,
    hasNote: boolean,
    noteOpen: boolean
  ) {
    if (!hasNote) return null;
    return (
      <>
        <button
          type="button"
          className="bs-txt-note-toggle"
          onClick={() =>
            setOpenNotes((prev) => {
              const next = new Set(prev);
              if (next.has(si)) next.delete(si);
              else next.add(si);
              return next;
            })
          }
          aria-expanded={noteOpen}
          aria-label={noteOpen ? "Тэмдэглэл нуух" : "Тэмдэглэл харах"}
        >
          <span aria-hidden>💡</span>
          {noteOpen ? "Нуух" : "Тайлбар"}
        </button>
        {noteOpen ? (
          <div className="bs-txt-note-panel">
            {sentence.note ? (
              <p>
                <MnGrammarTermText text={sentence.note} />
              </p>
            ) : null}
            {(sentence.key_structures?.length ?? 0) > 0 ? (
              <div className="bs-txt-note-chips">
                {sentence.key_structures!.map((chip) => (
                  <span key={chip} className="bs-txt-note-chip">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </>
    );
  }

  function renderFooterSummaries(items: HskPackageParagraphSummary[]) {
    return (
      <div className="bs-txt-footer-section">
        <p className="bs-txt-footer-title">Догол мөрийн утга</p>
        <ol className="bs-txt-summary-list">
          {items.map((item) => (
            <li
              key={`${item.paragraph}-${item.mn}`}
              className="bs-txt-summary-item"
            >
              <span className="bs-txt-summary-num">{item.paragraph}.</span>
              <span>
                <MnGrammarTermText text={item.mn} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (!prefsReady) return null;

  return (
    <>
      <div className="bs-txt-reader-controls">
        <button
          type="button"
          className={`bs-txt-ctrl-btn ${showPinyin ? "bs-txt-ctrl-btn--on" : ""}`}
          aria-pressed={showPinyin}
          onClick={togglePinyin}
        >
          Пиньинь
        </button>
        <button
          type="button"
          className={`bs-txt-ctrl-btn ${showMn ? "bs-txt-ctrl-btn--on" : ""}`}
          aria-pressed={showMn}
          onClick={toggleMn}
        >
          Орчуулга
        </button>
      </div>

      <p className="bs-txt-hint">Үг дээр дарж утга, задаргааг хараарай.</p>

      <div className="bs-txt-body">
        <div className="bs-txt-sentences">
          {sentences.map((sentence, si) =>
            sentence.word_tap
              ? renderTappableSentence(sentence, si)
              : renderLegacySentence(sentence, si)
          )}
        </div>

        {(text.paragraph_summaries?.length ?? 0) > 0
          ? renderFooterSummaries(text.paragraph_summaries!)
          : null}

        {(text.reflection?.questions_mn?.length ?? 0) > 0 ? (
          <div className="bs-txt-footer-section">
            <p className="bs-txt-footer-title">Эргэцүүлье</p>
            <ul className="bs-txt-reflect-list">
              {text.reflection!.questions_mn!.map((q, i) => (
                <li key={i} className="bs-txt-reflect-item">
                  <MnGrammarTermText text={q} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {pickedWord ? (
        <WordTapSheet word={pickedWord} onClose={() => setPickedWord(null)} />
      ) : null}
    </>
  );
}
