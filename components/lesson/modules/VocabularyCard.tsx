"use client";
// components/lesson/modules/VocabularyCard.tsx
// "vocabulary" модуль — нэг үг, нэг карт.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getBsVocabularyProgress,
  markBsModuleCompleted,
  recordStudiedWordKey,
  saveBsVocabularyProgress,
} from "@/lib/lesson/bs-step-progress";
import type {
  HskLessonPackage as Lesson,
  HskPackageVocabItem as VocabItem,
} from "@/types/hsk-lesson-package";
import { CharacterDecompositionHint } from "@/components/hanzi/CharacterDecompositionHint";
import { ToneHanzi, ToneLegend } from "@/components/hanzi/ToneHanzi";
import { WordWriterPanel } from "@/components/hanzi/WordWriterPanel";
import { resolveDecompositionCharacters } from "@/lib/hanzi/character-decomposition";
import SpeakButton from "../SpeakButton";
import { DeepWordPanel } from "@/components/lesson/deep/deep-teaching-blocks";
import { findDeepWord, type LessonDeepTeaching } from "@/types/lesson-deep-teaching";
import { findImageForWord, type LessonPathImage } from "@/lib/lesson/lesson-path-images";
import { BaldanSay } from "@/components/lesson/baldan-say";
import { baldanLine } from "@/lib/temee/baldan-lines";
import "../lesson-fresh.css";

type RevealStep = "hanzi" | "meaning" | "why" | "example";
const STEP_LABEL: Record<RevealStep, string> = {
  hanzi: "Ханз",
  meaning: "Утга",
  why: "Яагаад",
  example: "Жишээ",
};
const NEXT_LABEL: Record<RevealStep, string> = {
  hanzi: "",
  meaning: "Утгыг харах",
  why: "Яагаад ийм ханз вэ",
  example: "Жишээ өгүүлбэр",
};

function vocabKey(w: VocabItem): string {
  return String(w.id ?? w.zh);
}

/** ref_words frequency rank — lower number = more common in corpus. */
const COMMON_FREQUENCY_MAX = 2500;

function formatHskBadge(hskOld?: string[]): string | null {
  const raw = hskOld?.[0]?.trim();
  if (!raw) return null;
  if (/^hsk/i.test(raw)) return raw.toUpperCase();
  const digits = raw.replace(/\D/g, "");
  return digits ? `HSK${digits}` : raw;
}

/** Нэг амьсгаагаар үзэх үгийн тоо — үүний дараа завсарлагын дэлгэц гарна. */
const VOCAB_CHUNK = 8;

function isCommonFrequency(frequency?: number): boolean {
  return typeof frequency === "number" && frequency > 0 && frequency <= COMMON_FREQUENCY_MAX;
}

export default function VocabularyCard({
  lessonId,
  lesson,
  deep = null,
  onDone,
  images = [],
}: {
  lessonId: string;
  lesson: Lesson;
  /** Нэмэлт, гүнзгий тайлбар — байхгүй бол юу ч өөрчлөгдөхгүй. */
  deep?: LessonDeepTeaching | null;
  onDone: () => void;
  /** Багцын зурагт тайлбар — title нь үгтэй таарвал картад харуулна. */
  images?: LessonPathImage[];
}) {
  const words: VocabItem[] = lesson.vocabulary ?? [];
  const [i, setI] = useState(0);
  const [known, setKnown] = useState<Set<number>>(new Set());
  /** 3D flip: эхлээд ханз (урд тал), дарахад утга (ар тал). Үг солигдоход буцна. */
  /** Шатлан нээх: ханз → утга → яагаад ийм ханз вэ → жишээ. Үг солигдоход эхнээсээ. */
  const [step, setStep] = useState(0);
  /** Хоёрдогч хэрэгсэл: бичих / дуудлага шалгах / дэлгэрэнгүй — дарж байж нээгдэнэ. */
  const [tool, setTool] = useState<"write" | "more" | null>(null);
  /** «Яагаад» шатанд олон ханзтай үгийг нэг нэг ханзаар задална. */
  const [whyIdx, setWhyIdx] = useState(0);
  const flipped = step >= 1;
  /** 8 үг тутамд завсарлага: «үргэлжлүүлэх» эсвэл «дараагийн үе рүү» сонгоно (үгс олон үед хүн дундаас нь хаядаг байсан). */
  const [checkpoint, setCheckpoint] = useState(false);
  const hydrateDoneRef = useRef(false);
  const persistReadyRef = useRef(false);

  const total = words.length;
  const w = words[i];
  const deepWord = findDeepWord(deep, w?.zh ?? "");
  const wordImage = w ? findImageForWord(images, w.zh) : null;

  const hasExample = useMemo(
    () => Boolean(w && w.example_zh && w.example_zh.trim().length > 0),
    [w]
  );

  const meaning = useMemo(() => {
    if (!w) return { text: "", pending: false };
    const mn = (w.meaning_mn ?? w.mn)?.trim();
    if (mn) return { text: mn, pending: false };
    const en =
      (w.meaning_en ?? w.en ?? w.meaningsEn?.join("; "))?.trim() || "";
    if (en) return { text: en, pending: true };
    return { text: "", pending: false };
  }, [w]);

  const enrichment = useMemo(() => {
    if (!w) {
      return {
        hskBadge: null as string | null,
        posAuto: [] as string[],
        radical: null as string | null,
        traditional: null as string | null,
        showFrequency: false,
        classifiers: [] as string[],
      };
    }
    const posAuto = (w.posAuto ?? []).map((p) => p.trim()).filter(Boolean);
    const classifiers = (w.classifiers ?? []).map((c) => c.trim()).filter(Boolean);
    return {
      hskBadge: formatHskBadge(w.hskOld),
      posAuto,
      radical: w.radical?.trim() || null,
      traditional: w.traditional?.trim() || null,
      showFrequency: isCommonFrequency(w.frequency),
      classifiers,
    };
  }, [w]);

  const hasEnrichmentMeta =
    enrichment.hskBadge ||
    enrichment.posAuto.length > 0 ||
    enrichment.radical ||
    enrichment.traditional ||
    enrichment.showFrequency ||
    enrichment.classifiers.length > 0;

  const decompositionCharacters = useMemo(
    () => resolveDecompositionCharacters(w?.zh ?? "", lesson.characters?.characters ?? []),
    [w?.zh, lesson.characters?.characters]
  );

  useEffect(() => {
    if (total === 0 || hydrateDoneRef.current) return;
    hydrateDoneRef.current = true;
    const saved = getBsVocabularyProgress(lessonId);
    if (saved) {
      setI(Math.min(Math.max(0, saved.cardIndex), total - 1));
      setKnown(new Set(saved.knownIds ?? []));
    }
    persistReadyRef.current = true;
  }, [lessonId, total]);

  useEffect(() => {
    if (!w || !persistReadyRef.current) return;
    recordStudiedWordKey(lessonId, vocabKey(w));
  }, [lessonId, w?.id, w?.zh]);

  useEffect(() => {
    if (!persistReadyRef.current || total === 0) return;
    const viewedIds = Array.from({ length: i + 1 }, (_, idx) => words[idx]?.id).filter(
      (id): id is number => id != null
    );
    const completed = i >= total - 1 && known.size >= total;
    saveBsVocabularyProgress(lessonId, {
      cardIndex: i,
      viewedIds,
      knownIds: [...known],
      completed,
    });
  }, [lessonId, i, known, total, words]);

  /** Шинэ хэсэг нээгдэхэд түүн рүү зөөлөн гүйлгэнэ (эхний хоёр шат дэлгэцэд багтдаг тул хэрэггүй). */
  const revealRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (step < 2) return;
    revealRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  const hasExtras = hasExample || Boolean(wordImage) || Boolean(deepWord);
  const steps: RevealStep[] = [
    "hanzi",
    "meaning",
    ...(decompositionCharacters.length > 0 ? (["why"] as const) : []),
    ...(hasExtras ? (["example"] as const) : []),
  ];
  const lastStep = steps.length - 1;
  const cur = steps[Math.min(step, lastStep)]!;
  const whyChar = Math.min(whyIdx, Math.max(0, decompositionCharacters.length - 1));
  const moreWhy = cur === "why" && whyChar < decompositionCharacters.length - 1;
  const reached = (name: RevealStep) => steps.indexOf(name) !== -1 && steps.indexOf(name) <= step;
  const resetCard = () => {
    setStep(0);
    setTool(null);
    setWhyIdx(0);
  };

  if (!w) return null;

  function mark(isKnown: boolean) {
    setKnown((prev) => {
      const next = new Set(prev);
      if (isKnown) next.add(w!.id);
      else next.delete(w!.id);
      return next;
    });
    goNext();
  }

  function goNext() {
    resetCard();
    if (i < total - 1) {
      const nextIndex = i + 1;
      setI(nextIndex);
      if (nextIndex % VOCAB_CHUNK === 0 && total - nextIndex >= 3) setCheckpoint(true);
    } else {
      markBsModuleCompleted(lessonId, "vocabulary");
      onDone();
    }
  }

  function goPrev() {
    resetCard();
    if (i > 0) setI(i - 1);
  }

  function restartVocab() {
    resetCard();
    setI(0);
    setKnown(new Set());
    saveBsVocabularyProgress(lessonId, {
      cardIndex: 0,
      viewedIds: [],
      knownIds: [],
      completed: false,
    });
    if (words[0]) recordStudiedWordKey(lessonId, vocabKey(words[0]));
  }

  const allDone = i >= total - 1 && known.size > 0;

  if (checkpoint) {
    const remaining = total - i;
    return (
      <div className="bs-card">
        <div className="bs-vtop">
          <div className="bs-label" style={{ margin: 0 }}>
            <span className="bs-dot" />
            Үгийн сан
          </div>
          <span className="bs-counter">
            {i} / {total}
          </span>
        </div>
        <div className="bs-vcheck">
          <BaldanSay pose="relax" text={baldanLine("vocabBreak", i)} center />
          <p className="bs-vcheck-title">{i} үг үзлээ</p>
          <p className="bs-vcheck-sub">
            Үлдсэн {remaining} үгийг одоо үргэлжлүүлж болно, эсвэл дараагийн үе рүү шилжээд дараа нь буцаж ирж болно.
            Хаана зогссон чинь хадгалагдана.
          </p>
          <button type="button" className="bs-vbtn bs-know" style={{ width: "100%" }} onClick={() => setCheckpoint(false)}>
            Дараагийн {Math.min(VOCAB_CHUNK, remaining)} үг →
          </button>
          <button
            type="button"
            className="bs-navbtn"
            style={{ width: "100%", marginTop: 9 }}
            onClick={() => {
              setCheckpoint(false);
              markBsModuleCompleted(lessonId, "vocabulary");
              onDone();
            }}
          >
            Дараагийн үе рүү шилжих
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bs-card">
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          Үгийн сан
        </div>
        <span className="bs-counter">
          {i + 1} / {total}
        </span>
      </div>

      <div className={`bs-vcard${step >= 2 ? " bs-vcard--compact" : ""}`}>
        {/* 3D flip карт: урд тал — ханз (пиньинь хөгийн өнгөтэй), ар тал — утга */}
        <div className="bs-vflip-scene">
          <button
            type="button"
            className={`bs-vflip ${flipped ? "bs-vflip--flipped" : ""}`}
            onClick={() => setStep((st) => (st === 0 ? 1 : st))}
            aria-pressed={flipped}
            aria-label={flipped ? "Утга нээгдсэн" : "Утгыг харах"}
          >
            <div className="bs-vflip-inner">
              <div className="bs-vflip-face bs-vflip-front">
                <div className="bs-hanzi bs-hanzi--tone">
                  <ToneHanzi word={w.zh} pinyin={w.pinyin} size="xl" />
                </div>
                {meaning.text ? (
                  <p className="bs-vflip-hint">Утгыг нь тааж үзээд дар</p>
                ) : null}
              </div>
              <div className="bs-vflip-face bs-vflip-back" aria-hidden={!flipped}>
                <div className="bs-hanzi bs-hanzi--tone">
                  <ToneHanzi word={w.zh} pinyin={w.pinyin} size="lg" />
                </div>
                {meaning.text ? (
                  <div className={meaning.pending ? "bs-vmn bs-vmn-pending" : "bs-vmn"}>
                    <span translate="no">{meaning.text}</span>
                    {meaning.pending ? (
                      <span className="bs-vmn-badge">орчуулга хүлээгдэж буй</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="bs-vflip-hint">Утга бүртгэгдээгүй</p>
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="bs-vicons">
          <SpeakButton text={w.zh} src={w.audio} title={`${w.zh} дуудлага`} />
          <button type="button" className="bs-vicon" aria-pressed={tool === "write"} onClick={() => setTool(tool === "write" ? null : "write")}>
            ✍️ Бичих
          </button>
          {hasEnrichmentMeta || w.pos || w.beyond_syllabus ? (
            <button type="button" className="bs-vicon" aria-pressed={tool === "more"} aria-label="Дэлгэрэнгүй" onClick={() => setTool(tool === "more" ? null : "more")}>
              ⋯
            </button>
          ) : null}
        </div>

        {tool === "write" ? (
          <div className="bs-vreveal">
            <WordWriterPanel word={w.zh} />
          </div>
        ) : null}
        {tool === "more" ? (
          <div className="bs-vreveal">
            <div className="bs-tone-legend-row">
              <ToneLegend />
            </div>
            {hasEnrichmentMeta ? (
              <div className="bs-vmeta">
                {enrichment.hskBadge ? (
                  <span className="bs-vbadge-hsk">{enrichment.hskBadge}</span>
                ) : null}
                {enrichment.posAuto.map((pos) => (
                  <span key={pos} className="bs-vchip-pos" translate="no">
                    {pos}
                  </span>
                ))}
                {enrichment.radical ? (
                  <span className="bs-vlabel">
                    радикал <b>{enrichment.radical}</b>
                  </span>
                ) : null}
                {enrichment.traditional ? (
                  <span className="bs-vlabel">
                    уламжлалт <b className="bs-vlabel-zh">{enrichment.traditional}</b>
                  </span>
                ) : null}
                {enrichment.showFrequency ? (
                  <span className="bs-vfreq">түгээмэл</span>
                ) : null}
                {enrichment.classifiers.length > 0 ? (
                  <div className="bs-vclassifiers">
                    <span className="bs-vclassifiers-title">тоолох үг</span>
                    {enrichment.classifiers.map((cls) => (
                      <span key={cls} className="bs-vchip-cls">
                        {cls}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div>
              {enrichment.posAuto.length === 0 && w.pos ? (
                <span className="bs-pos" translate="no">{w.pos}</span>
              ) : null}
              {w.beyond_syllabus && <span className="bs-beyond">超纲</span>}
            </div>
          </div>
        ) : null}

        {reached("why") ? (
          <div className="bs-vreveal" key={`why-${w.zh}`}>
            <p className="bs-vwhy-head">Яагаад ийм ханз вэ</p>
            {decompositionCharacters.length > 1 ? (
              <div className="bs-vwhy-tabs" translate="no">
                {decompositionCharacters.map((view, idx) => (
                  <button
                    key={view.char}
                    type="button"
                    aria-pressed={idx === whyChar}
                    onClick={() => setWhyIdx(idx)}
                  >
                    {view.char}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="bs-decomp-hint-stack">
              <CharacterDecompositionHint
                key={decompositionCharacters[whyChar]!.char}
                char={decompositionCharacters[whyChar]!.char}
                showCharLabel={decompositionCharacters.length > 1}
              />
            </div>
            {cur === "why" ? (
              <BaldanSay pose="point" text={baldanLine("vocabWhy", i)} />
            ) : null}
          </div>
        ) : null}

        {reached("example") ? (
          <div className="bs-vreveal" key={`ex-${w.zh}`}>
            {wordImage ? (
              <figure className="bs-vimg">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URL */}
                <img src={wordImage.url} alt={wordImage.title} loading="lazy" decoding="async" />
                <figcaption translate="no">{wordImage.title}</figcaption>
              </figure>
            ) : null}
            {hasExample && (
              <div className="bs-example">
                <div>
                  <div className="bs-ex-zh">{w.example_zh}</div>
                  {w.example_pinyin ? <div className="bs-ex-py">{w.example_pinyin}</div> : null}
                  {w.example_mn ? <div className="bs-ex-mn" translate="no">{w.example_mn}</div> : null}
                </div>
                <SpeakButton text={w.example_zh as string} title="Жишээг сонсох" />
              </div>
            )}
            {deepWord ? <DeepWordPanel key={w.zh} word={deepWord} /> : null}
          </div>
        ) : null}

        <div className="bs-vsteps" aria-hidden ref={revealRef}>
          {steps.map((name, idx) => (
            <span key={name} className={idx < step ? "is-done" : idx === step ? "is-on" : undefined}>
              {idx < step ? "✓ " : ""}
              {STEP_LABEL[name]}
            </span>
          ))}
        </div>
      </div>

      {moreWhy ? (
        <button type="button" className="bs-vbtn bs-know bs-vnext" onClick={() => setWhyIdx(whyChar + 1)}>
          <span translate="no">{decompositionCharacters[whyChar + 1]!.char}</span> — дараагийн ханз →
        </button>
      ) : step < lastStep ? (
        <button type="button" className="bs-vbtn bs-know bs-vnext" onClick={() => setStep(step + 1)}>
          {NEXT_LABEL[steps[step + 1]!]} →
        </button>
      ) : (
        <div className="bs-vbtns">
          <button className="bs-vbtn bs-again" onClick={() => mark(false)}>
            ↻ Дахин давтах
          </button>
          <button className="bs-vbtn bs-know" onClick={() => mark(true)}>
            ✓ Мэднэ
          </button>
        </div>
      )}

      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={i === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {i === total - 1 ? "Дуусгах →" : "Алгасах →"}
        </button>
      </div>

      {allDone ? (
        <button type="button" className="bs-navbtn" onClick={restartVocab} style={{ marginTop: 8 }}>
          Дахин эхлэх
        </button>
      ) : null}
    </div>
  );
}
