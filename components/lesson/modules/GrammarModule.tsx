"use client";
// components/lesson/modules/GrammarModule.tsx
// Дүрэм бүр — нэг дэлгэц дээр бүх хэсэг (прототип шиг).

import { useState } from "react";
import { GrammarPointView } from "@/components/lesson/modules/grammar-point-view";
import { DeepGrammarPanel } from "@/components/lesson/deep/deep-teaching-blocks";
import { DeepGrammarDrill } from "@/components/lesson/deep/deep-grammar-drill";
import type { LessonDeepTeaching } from "@/types/lesson-deep-teaching";
import type { HskLessonPackage, HskPackageGrammarPoint } from "@/types/hsk-lesson-package";
import "./grammar-module.css";
import "./teacher-overlay.css";
import "./exercises-module.css";

export default function GrammarModule({
  lessonId,
  lesson,
  deep = null,
  onDone,
}: {
  lessonId: string;
  lesson: HskLessonPackage;
  /** Нэмэлт, гүнзгий тайлбар — байхгүй бол юу ч өөрчлөгдөхгүй. */
  deep?: LessonDeepTeaching | null;
  onDone: () => void;
}) {
  const points: HskPackageGrammarPoint[] = [
    ...(lesson.grammar ?? []),
    ...(lesson.word_explanation ?? []),
  ];

  const [gi, setGi] = useState(0);
  const point = points[gi];
  const total = points.length;

  function goNextPoint() {
    if (gi < total - 1) {
      setGi(gi + 1);
    } else {
      onDone();
    }
  }

  function goPrev() {
    if (gi > 0) setGi(gi - 1);
  }

  if (!point) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">📐</div>
          <p>Энэ хичээлд дүрэм алга.</p>
        </div>
        <button
          className="bs-cta bs-path-visible-cta"
          onClick={onDone}
          style={{ marginTop: 4 }}
        >
          Дараагийнх →
        </button>
      </div>
    );
  }

  const showCollocations =
    gi === 0 && lesson.collocations && lesson.collocations.length > 0;

  // Нэмэлт тайлбарыг дүрмийн НЭРЭЭР нь тааруулна; олдохгүй бол дараалалаар.
  const deepPoint =
    deep?.grammar?.find((row) => row.point.trim() === point.point.trim()) ??
    deep?.grammar?.[gi] ??
    null;

  const exercises = point.exercises ?? [];
  const needsManualAdvance = exercises.length === 0;

  return (
    <div className="bs-card bs-gr bs-gr2">
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          Дүрэм
        </div>
        <span className="bs-counter">
          {gi + 1} / {total}
        </span>
      </div>

      <GrammarPointView
        lessonId={lessonId}
        point={point}
        pointIndex={gi}
        vocabulary={lesson.vocabulary}
        collocations={showCollocations ? lesson.collocations : null}
        isLastPoint={gi === total - 1}
        onComplete={goNextPoint}
      />

      {deepPoint ? (
        <>
          <DeepGrammarPanel grammar={deepPoint} />
          {deepPoint.drills?.length ? (
            <DeepGrammarDrill
              key={`${lessonId}-${gi}`}
              lessonId={lessonId}
              pointKey={deepPoint.point}
              drills={deepPoint.drills}
            />
          ) : null}
        </>
      ) : null}

      {needsManualAdvance ? (
        <div className="bs-navrow">
          <button className="bs-navbtn" onClick={goPrev} disabled={gi === 0}>
            ← Өмнөх
          </button>
          <button className="bs-navbtn" onClick={goNextPoint}>
            {gi === total - 1 ? "Дуусгах →" : "Дараагийн дүрэм →"}
          </button>
        </div>
      ) : (
        <div className="bs-navrow">
          <button className="bs-navbtn" onClick={goPrev} disabled={gi === 0}>
            ← Өмнөх дүрэм
          </button>
        </div>
      )}
    </div>
  );
}
