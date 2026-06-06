"use client";
// components/lesson/modules/VocabularyCard.tsx
// "vocabulary" модуль — нэг үг, нэг карт.
// 汉字 + пиньинь + монгол + (байвал) жишээ өгүүлбэр + дуудлага (TTS).
// "Мэднэ / Дахин давтах" нь одоохондоо локал тэмдэглэгээ (SRS-ийг дараа холбоно).

import { useMemo, useState } from "react";
import type { Lesson, VocabItem } from "@/types/lesson";
import SpeakButton from "../SpeakButton";

export default function VocabularyCard({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: () => void; // бүх үг дуусахад дараагийн модуль руу
}) {
  const words: VocabItem[] = lesson.vocabulary ?? [];
  const [i, setI] = useState(0);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const total = words.length;
  const w = words[i];

  // Жишээ өгүүлбэрт пиньинь/монгол байгаа эсэх (өгөгдлөөс хамаарна — зохиохгүй)
  const hasExample = useMemo(
    () => Boolean(w && w.example_zh && w.example_zh.trim().length > 0),
    [w]
  );

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
    else onDone(); // сүүлийн үг → дараагийн модуль
  }
  function goPrev() {
    if (i > 0) setI(i - 1);
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

      <div className="bs-vcard">
        <div className="bs-hanzi">{w.zh}</div>
        <div className="bs-vpy">{w.pinyin}</div>
        <div className="bs-vmn">{w.mn}</div>
        <div>
          {w.pos && <span className="bs-pos">{w.pos}</span>}
          {w.beyond_syllabus && <span className="bs-beyond">超纲</span>}
        </div>

        {/* үгийн дуудлага (аудио файл байхгүй бол хөтчийн TTS) */}
        <SpeakButton text={w.zh} large title={`${w.zh} дуудлага`} />

        {hasExample && (
          <div className="bs-example">
            <div>
              {w.example_pinyin && <div className="bs-ex-py">{w.example_pinyin}</div>}
              <div className="bs-ex-zh">{w.example_zh}</div>
              {w.example_mn && <div className="bs-ex-mn">{w.example_mn}</div>}
            </div>
            <SpeakButton text={w.example_zh as string} title="Жишээг сонсох" />
          </div>
        )}
      </div>

      {/* Мэднэ / Дахин давтах */}
      <div className="bs-vbtns">
        <button className="bs-vbtn bs-again" onClick={() => mark(false)}>
          ↻ Дахин давтах
        </button>
        <button className="bs-vbtn bs-know" onClick={() => mark(true)}>
          ✓ Мэднэ
        </button>
      </div>

      {/* Өмнөх / Дараагийнх */}
      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={i === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {i === total - 1 ? "Дуусгах →" : "Дараагийнх →"}
        </button>
      </div>
    </div>
  );
}
