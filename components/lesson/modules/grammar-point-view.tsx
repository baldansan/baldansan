"use client";

import { useRef, useState } from "react";
import "@/components/lesson/lesson-fresh.css";
import { CollocationsSection } from "@/components/lesson/modules/CollocationsSection";
import { GrammarExamplesList } from "@/components/lesson/modules/grammar-examples-list";
import { GrammarPointExercises } from "@/components/lesson/modules/GrammarPointExercises";
import {
  TeacherCheckQuizSection,
  TeacherCommonMistakesSection,
  TeacherNotesBlock,
  TeacherStructureBlock,
} from "@/components/lesson/modules/teacher-overlay-fields";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import { grammarPointSlug } from "@/lib/lesson/grammar-question-id";
import type {
  HskPackageCollocation,
  HskPackageGrammarPoint,
  HskPackageVocabItem,
} from "@/types/hsk-lesson-package";

type Props = {
  lessonId: string;
  point: HskPackageGrammarPoint;
  pointIndex: number;
  vocabulary?: HskPackageVocabItem[];
  collocations?: HskPackageCollocation[] | null;
  isLastPoint: boolean;
  onComplete: () => void;
};

export function GrammarPointView({
  lessonId,
  point,
  pointIndex,
  vocabulary = [],
  collocations,
  isLastPoint,
  onComplete,
}: Props) {
  const slug = grammarPointSlug(point, pointIndex);
  const exercises = point.exercises ?? [];
  const hasExercises = exercises.length > 0;

  const hasWatch =
    (point.common_mistakes?.length ?? 0) > 0 || Boolean(point.teacher_notes);
  const hasCheck =
    Boolean(point.check && point.check.question && point.check.options.length > 0) ||
    Boolean(collocations && collocations.length > 0) ||
    hasExercises;
  // Нэг дэлгэц — нэг зүйл: тайлбар → жишээ → анхаарах → шалгах. Байхгүй хэсгийг алгасна.
  const steps: { id: "explain" | "examples" | "watch" | "check"; label: string }[] = [
    { id: "explain", label: "Тайлбар" },
    ...((point.examples?.length ?? 0) > 0 ? [{ id: "examples" as const, label: "Жишээ" }] : []),
    ...(hasWatch ? [{ id: "watch" as const, label: "Анхаар" }] : []),
    ...(hasCheck ? [{ id: "check" as const, label: "Шалга" }] : []),
  ];
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;
  const isLastStep = stepIndex >= steps.length - 1;
  const topRef = useRef<HTMLDivElement | null>(null);
  function goStep(next: number) {
    setStepIndex(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bs-gr2-point" ref={topRef}>
      <header className="bs-gr2-head">
        <p className="bs-gr2-point-zh">{point.point}</p>
        {point.pinyin ? (
          <p className="bs-gr2-point-py">{point.pinyin}</p>
        ) : null}
        {point.gloss_mn ? (
          <p className="bs-gr2-point-mn">
            <MnGrammarTermText text={point.gloss_mn} />
          </p>
        ) : null}
      </header>

      {steps.length > 1 ? (
        <div className="bs-vsteps bs-gr2-steps">
          {steps.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              className={idx < stepIndex ? "is-done" : idx === stepIndex ? "is-on" : undefined}
              onClick={() => goStep(idx)}
            >
              {idx < stepIndex ? "✓ " : ""}
              {st.label}
            </button>
          ))}
        </div>
      ) : null}

      {step.id === "explain" ? (
        <div className="bs-vreveal" key="explain">
          {point.teacher_mn ? (
            <div className="bs-gr2-teacher">
              <div className="bs-gr2-teacher-ava" aria-hidden>
                🐫
              </div>
              <div>
                <p className="bs-gr2-teacher-name">Тэмээ багш</p>
                <p className="bs-gr2-teacher-txt">
                  <MnGrammarTermText text={point.teacher_mn} />
                </p>
              </div>
            </div>
          ) : null}
          {point.structure ? (
            <TeacherStructureBlock structure={point.structure} variant="formula" />
          ) : null}
        </div>
      ) : null}

      {step.id === "examples" ? (
        <div className="bs-vreveal" key="examples">
          <GrammarExamplesList examples={point.examples ?? []} vocabulary={vocabulary} />
        </div>
      ) : null}

      {step.id === "watch" ? (
        <div className="bs-vreveal" key="watch">
          {point.common_mistakes && point.common_mistakes.length > 0 ? (
            <TeacherCommonMistakesSection mistakes={point.common_mistakes} />
          ) : null}
          {point.teacher_notes ? (
            <TeacherNotesBlock notes={point.teacher_notes} variant="warn" />
          ) : null}
        </div>
      ) : null}

      {step.id === "check" ? (
        <div className="bs-vreveal" key="check">
          {point.check && point.check.question && point.check.options.length > 0 ? (
            <TeacherCheckQuizSection
              key={`check-${slug}`}
              check={point.check}
              lessonId={lessonId}
              pointSlug={slug}
            />
          ) : null}
          {collocations && collocations.length > 0 ? (
            <CollocationsSection collocations={collocations} />
          ) : null}
          {hasExercises ? (
            <GrammarPointExercises
              key={`ex-${slug}`}
              lessonId={lessonId}
              pointSlug={slug}
              exercises={exercises}
              isLastPoint={isLastPoint}
              onComplete={onComplete}
            />
          ) : null}
        </div>
      ) : null}

      {!isLastStep ? (
        <button type="button" className="bs-vbtn bs-know bs-vnext" onClick={() => goStep(stepIndex + 1)}>
          {steps[stepIndex + 1]!.label} →
        </button>
      ) : null}
    </div>
  );
}
