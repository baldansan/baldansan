"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  HskPackageParagraphSummary,
  HskPackageShortText,
  HskPackageTextSentence,
  HskPackageTextToken,
  HskPackageVocabItem,
} from "@/types/hsk-lesson-package";
import {
  WordTapSheet,
  type WordTapAnchorRect,
  type WordTapPayload,
} from "@/components/lesson/word-tap-sheet";
import { GrammarPointExercises } from "@/components/lesson/modules/GrammarPointExercises";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import { PronunciationCheck } from "@/components/pronunciation/pronunciation-check";
import { coalesceSentenceTokens } from "@/lib/lesson/coalesce-text-tokens";
import "@/components/lesson/lesson-fresh.css";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";
import { speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";
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

/** «王静：…» хэлбэрийн мөрөөс ярьж буй хүний нэрийг ялгана (яриаг чат хэлбэрээр зурахад). */
// Нэр дотор тоо, хаалт байвал хүн биш («声母(1)：» гэх мэт гарчиг) — чат болгохгүй.
const SPEAKER_RE = /^\s*([^：:，,。！？?!\s（）()\d]{1,8})[：:]/;
function speakerOf(zh: string | undefined): string | null {
  return zh ? (SPEAKER_RE.exec(zh)?.[1] ?? null) : null;
}
/** Эхлээд хэдэн мөр нээлттэй байх вэ — үлдсэнийг сурагч өөрөө нэг нэгээр нээнэ. */
const FIRST_SHOWN = 2;

type Props = {
  text: HskPackageShortText;
  vocabulary?: HskPackageVocabItem[];
  /** Sentence highlighted while 课文 audio plays (subtitle_lines sync). */
  activeSentenceIndex?: number | null;
  /** Ойлголтын асуултын (text.exercises) аналитикт — байхгүй бол асуулт харуулахгүй. */
  lessonId?: string;
};

/** Текст бүрийн ойлголтын асуулт — grammar-ийн choice/judge UI-г дахин ашиглана. */
function TextComprehension({
  lessonId,
  text,
}: {
  lessonId: string;
  text: HskPackageShortText;
}) {
  const [finished, setFinished] = useState(false);
  const exercises = text.exercises ?? [];
  if (exercises.length === 0) return null;
  return (
    <div className="bs-txt-footer-section">
      <p className="bs-txt-footer-title">✅ Ойлголтоо шалгая</p>
      {finished ? (
        <p className="bs-txt-hint">Бүх асуултад хариуллаа 👏</p>
      ) : (
        <GrammarPointExercises
          lessonId={lessonId}
          pointSlug={`text-${text.id}`}
          exercises={exercises}
          isLastPoint
          onComplete={() => setFinished(true)}
        />
      )}
    </div>
  );
}

export function LiveTextReader({
  text,
  vocabulary = [],
  activeSentenceIndex = null,
  lessonId,
}: Props) {
  const vocabByZh = useMemo(() => buildVocabMap(vocabulary), [vocabulary]);
  const vocabWords = useMemo(() => [...vocabByZh.keys()], [vocabByZh]);
  const sentences: HskPackageTextSentence[] = text.sentences ?? [];

  const [showPinyin, setShowPinyin] = useState(true);
  const [showMn, setShowMn] = useState(true);
  const [prefsReady, setPrefsReady] = useState(false);
  const [openNotes, setOpenNotes] = useState<Set<number>>(() => new Set());
  const [pickedWord, setPickedWord] = useState<WordTapPayload | null>(null);
  const [wordTapAnchor, setWordTapAnchor] = useState<WordTapAnchorRect | null>(
    null
  );

  const sentenceRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Яриа уу, богино эх үү: мөрүүдийн ихэнх нь «нэр：» гэж эхэлбэл чат хэлбэрээр зурна.
  const speakers = useMemo(() => sentences.map((sn) => speakerOf(sn.zh)), [sentences]);
  const chat = useMemo(() => {
    const named = speakers.filter(Boolean).length;
    return sentences.length >= 2 && named >= Math.ceil(sentences.length * 0.6);
  }, [speakers, sentences.length]);
  const sideBySpeaker = useMemo(() => {
    const map = new Map<string, "l" | "r">();
    for (const sp of speakers) {
      if (sp && !map.has(sp)) map.set(sp, map.size % 2 === 0 ? "l" : "r");
    }
    return map;
  }, [speakers]);

  // Мөр мөрөөр нээх. Эх солигдоход эхнээс; бүтэн аудио тоглож байвал тоглож буй мөр хүртэл нээнэ.
  const [shown, setShown] = useState(FIRST_SHOWN);
  const [shownFor, setShownFor] = useState(text.id);
  if (shownFor !== text.id) {
    setShownFor(text.id);
    setShown(FIRST_SHOWN);
  }
  const visibleCount = Math.min(
    sentences.length,
    Math.max(shown, activeSentenceIndex != null ? activeSentenceIndex + 1 : 0)
  );
  const allShown = visibleCount >= sentences.length;
  const revealedRef = useRef<number | null>(null);
  useEffect(() => {
    const idx = revealedRef.current;
    if (idx == null) return;
    revealedRef.current = null;
    sentenceRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [shown]);

  function revealNext() {
    const idx = visibleCount;
    if (idx >= sentences.length) return;
    revealedRef.current = idx;
    setShown(idx + 1);
    // Бүтэн аудио тоглоогүй үед шинэ мөрийг уншиж өгнө.
    const zh = sentences[idx]?.zh;
    if (zh && activeSentenceIndex == null) {
      stopPronunciation();
      void speakWithSavedSettings(chat ? zh.replace(SPEAKER_RE, "") : zh, "zh-CN");
    }
  }

  useEffect(() => {
    setShowPinyin(loadTextReaderShowPinyin());
    setShowMn(loadTextReaderShowMn());
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (activeSentenceIndex == null) return;
    sentenceRefs.current[activeSentenceIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeSentenceIndex]);

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

  function pickWord(
    zh: string,
    pinyin?: string,
    anchorEl?: HTMLElement
  ) {
    void playChineseWordAudio(zh);
    const lesson = vocabByZh.get(zh);
    setPickedWord({
      zh,
      pinyin: pinyin || lesson?.pinyin,
      lessonMn: lesson?.mn,
    });
    if (anchorEl) {
      setWordTapAnchor(anchorEl.getBoundingClientRect());
    }
  }

  function closeWordTap() {
    setPickedWord(null);
    setWordTapAnchor(null);
  }

  function renderToken(
    tok: HskPackageTextToken,
    ti2: number,
    allowNonVocabTap: boolean
  ) {
    const vocab = vocabByZh.get(tok.zh);
    const isLessonWord = Boolean(vocab);
    const py = tok.py || (isLessonWord ? vocab!.pinyin : "");
    const tappable = isLessonWord || allowNonVocabTap;

    return (
      <span key={ti2} className="bs-txt-unit">
        {showPinyin && py ? (
          <span className="bs-txt-py-above">{py}</span>
        ) : showPinyin ? (
          <span className="bs-txt-py-above bs-txt-py-empty" aria-hidden>
            &nbsp;
          </span>
        ) : null}
        {tappable ? (
          <button
            type="button"
            className={isLessonWord ? "bs-newword" : "bs-txt-word"}
            onClick={(e) =>
              pickWord(tok.zh, py || vocab?.pinyin, e.currentTarget)
            }
          >
            {tok.zh}
          </button>
        ) : (
          <span className="bs-txt-zh-char">{tok.zh}</span>
        )}
      </span>
    );
  }

  function renderSentence(sentence: HskPackageTextSentence, si: number) {
    const hasNote =
      Boolean(sentence.note?.trim()) ||
      (sentence.key_structures?.length ?? 0) > 0;
    const noteOpen = openNotes.has(si);
    let tokens = coalesceSentenceTokens(sentence, vocabWords);
    const speaker = chat ? speakers[si] : null;
    const side = speaker ? (sideBySpeaker.get(speaker) ?? "l") : null;
    let mnLine = sentence.mn;
    if (speaker) {
      // Нэр нь хөөрөгний дээр гарах тул мөрийн эхний «нэр：»-ийг давхар харуулахгүй.
      let acc = "";
      let cut = 0;
      while (cut < tokens.length && !/[：:]/.test(acc)) {
        acc += tokens[cut]!.zh;
        cut += 1;
      }
      if (/[：:]\s*$/.test(acc) && acc.length <= 10) tokens = tokens.slice(cut);
      mnLine = mnLine?.replace(/^[^:：]{1,24}[:：]\s*/, "");
    }
    const showName = Boolean(speaker) && (si === 0 || speakers[si - 1] !== speaker);
    const allowNonVocabTap = Boolean(sentence.word_tap);

    const isActive = activeSentenceIndex === si;

    return (
      <div
        key={si}
        ref={(el) => {
          sentenceRefs.current[si] = el;
        }}
        className={`bs-txt-sentence bs-vreveal${hasNote ? " bs-txt-sentence--noted" : ""}${
          isActive ? " bs-txt-sentence--active" : ""
        }${chat ? ` bs-txt-bub bs-txt-bub--${side ?? "mid"}` : ""}`}
      >
        {showName ? (
          <div className="bs-txt-spk" translate="no">{speaker}</div>
        ) : null}
        <div className="bs-txt-ruby-line">
          {tokens.map((tok, ti2) =>
            renderToken(tok, ti2, allowNonVocabTap)
          )}
        </div>
        {showMn && mnLine ? (
          <div className="bs-txt-mn-line">
            <MnGrammarTermText text={mnLine} />
          </div>
        ) : null}
        {sentence.zh ? (
          <div className="bs-txt-sent-tools">
            <button
              type="button"
              className="bs-txt-sent-play"
              onClick={() => {
                stopPronunciation();
                void speakWithSavedSettings(sentence.zh, "zh-CN");
              }}
              aria-label="Өгүүлбэрийг сонсох"
              title="Өгүүлбэрийг сонсох"
            >
              <span aria-hidden>🔊</span> Сонсох
            </button>
            <PronunciationCheck compact text={sentence.zh} pinyin={sentence.pinyin} />
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
        <div className={`bs-txt-sentences${chat ? " bs-txt-sentences--chat" : ""}`}>
          {sentences.slice(0, visibleCount).map((sentence, si) => renderSentence(sentence, si))}
        </div>

        {!allShown ? (
          <div className="bs-txt-more">
            <button type="button" className="bs-txt-more-btn" onClick={revealNext}>
              {chat && speakers[visibleCount]
                ? `${speakers[visibleCount]} юу гэж хэлэх бол · дарж үргэлжлүүл ▾`
                : "Дараагийн мөр ▾"}
            </button>
            <div className="bs-txt-more-row">
              <span>
                {visibleCount} / {sentences.length} мөр
              </span>
              <button type="button" onClick={() => setShown(sentences.length)}>
                Бүгдийг нээх
              </button>
            </div>
          </div>
        ) : null}

        {allShown && (text.paragraph_summaries?.length ?? 0) > 0
          ? renderFooterSummaries(text.paragraph_summaries!)
          : null}

        {allShown && (text.reflection?.questions_mn?.length ?? 0) > 0 ? (
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

        {allShown && lessonId && (text.exercises?.length ?? 0) > 0 ? (
          <TextComprehension key={text.id} lessonId={lessonId} text={text} />
        ) : null}
      </div>

      {pickedWord && wordTapAnchor ? (
        <WordTapSheet
          word={pickedWord}
          anchor={wordTapAnchor}
          onClose={closeWordTap}
        />
      ) : null}
    </>
  );
}
