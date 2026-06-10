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
import { resolveDecompositionCharacters } from "@/lib/hanzi/character-decomposition";
import SpeakButton from "../SpeakButton";

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

function isCommonFrequency(frequency?: number): boolean {
  return typeof frequency === "number" && frequency > 0 && frequency <= COMMON_FREQUENCY_MAX;
}

export default function VocabularyCard({
  lessonId,
  lesson,
  onDone,
}: {
  lessonId: string;
  lesson: Lesson;
  onDone: () => void;
}) {
  const words: VocabItem[] = lesson.vocabulary ?? [];
  const [i, setI] = useState(0);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const hydrateDoneRef = useRef(false);
  const persistReadyRef = useRef(false);

  const total = words.length;
  const w = words[i];

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
    if (i < total - 1) setI(i + 1);
    else {
      markBsModuleCompleted(lessonId, "vocabulary");
      onDone();
    }
  }

  function goPrev() {
    if (i > 0) setI(i - 1);
  }

  function restartVocab() {
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

      <div className="bs-vcard">
        <div className="bs-hanzi">{w.zh}</div>
        {decompositionCharacters.length > 0 ? (
          <div className="bs-decomp-hint-stack">
            {decompositionCharacters.map((view) => (
              <CharacterDecompositionHint
                key={view.char}
                char={view.char}
                showCharLabel={decompositionCharacters.length > 1}
              />
            ))}
          </div>
        ) : null}
        <div className="bs-vpy">{w.pinyin}</div>
        {meaning.text ? (
          <div className={meaning.pending ? "bs-vmn bs-vmn-pending" : "bs-vmn"}>
            {meaning.text}
            {meaning.pending ? (
              <span className="bs-vmn-badge">орчуулга хүлээгдэж буй</span>
            ) : null}
          </div>
        ) : null}

        {hasEnrichmentMeta ? (
          <div className="bs-vmeta">
            {enrichment.hskBadge ? (
              <span className="bs-vbadge-hsk">{enrichment.hskBadge}</span>
            ) : null}
            {enrichment.posAuto.map((pos) => (
              <span key={pos} className="bs-vchip-pos">
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
            <span className="bs-pos">{w.pos}</span>
          ) : null}
          {w.beyond_syllabus && <span className="bs-beyond">超纲</span>}
        </div>

        <SpeakButton text={w.zh} large title={`${w.zh} дуудлага`} />

        {hasExample && (
          <div className="bs-example">
            <div>
              <div className="bs-ex-zh">{w.example_zh}</div>
              {w.example_pinyin ? <div className="bs-ex-py">{w.example_pinyin}</div> : null}
              {w.example_mn ? <div className="bs-ex-mn">{w.example_mn}</div> : null}
            </div>
            <SpeakButton text={w.example_zh as string} title="Жишээг сонсох" />
          </div>
        )}
      </div>

      <div className="bs-vbtns">
        <button className="bs-vbtn bs-again" onClick={() => mark(false)}>
          ↻ Дахин давтах
        </button>
        <button className="bs-vbtn bs-know" onClick={() => mark(true)}>
          ✓ Мэднэ
        </button>
      </div>

      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={i === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {i === total - 1 ? "Дуусгах →" : "Дараагийнх →"}
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
