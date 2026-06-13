"use client";

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

  return (
    <div className="bs-gr2-point">
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

      <GrammarExamplesList examples={point.examples ?? []} vocabulary={vocabulary} />

      {point.common_mistakes && point.common_mistakes.length > 0 ? (
        <TeacherCommonMistakesSection mistakes={point.common_mistakes} />
      ) : null}

      {point.teacher_notes ? (
        <TeacherNotesBlock notes={point.teacher_notes} variant="warn" />
      ) : null}

      {point.check && point.check.question && point.check.options.length > 0 ? (
        <TeacherCheckQuizSection
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
          lessonId={lessonId}
          pointSlug={slug}
          exercises={exercises}
          isLastPoint={isLastPoint}
          onComplete={onComplete}
        />
      ) : null}
    </div>
  );
}
