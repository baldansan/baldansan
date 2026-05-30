import {
  formatPronunciationLine,
  resolveHangulAnswerPronunciation,
  resolveVocabRomanizationForAnswer,
  type KoreanLesson0LessonPick,
} from "@/lib/lesson/korean-pronunciation-hints";
import { MongolianPronunciationHint } from "@/components/lesson/mongolian-pronunciation-hint";
import type { VocabularyWord } from "@/types/lesson";

type Props = {
  correctAnswer: string;
  explanation?: string | null;
  lesson: KoreanLesson0LessonPick;
  vocabulary?: VocabularyWord[];
  pronunciationMap?: Record<string, string>;
  showPronunciation?: boolean;
  className?: string;
};

/** Quiz/practice feedback block with optional Mongolian pronunciation for Korean answers. */
export function KoreanAnswerPronunciationBlock({
  correctAnswer,
  explanation,
  lesson,
  vocabulary = [],
  pronunciationMap,
  showPronunciation = true,
  className = "",
}: Props) {
  const romanization = resolveVocabRomanizationForAnswer(correctAnswer, vocabulary);
  const pronunciation = showPronunciation
    ? resolveHangulAnswerPronunciation(correctAnswer, lesson, pronunciationMap)
    : null;
  const pronunciationLine = formatPronunciationLine(pronunciation);

  return (
    <div className={className}>
      <p className="text-sm font-medium text-slate-800">{correctAnswer}</p>
      {romanization ? (
        <p className="mt-0.5 text-sm text-slate-600">{romanization}</p>
      ) : null}
      {pronunciationLine ? (
        <p className="mt-1 text-sm font-medium text-sky-800">{pronunciationLine}</p>
      ) : null}
      {explanation ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{explanation}</p>
      ) : null}
    </div>
  );
}

type InlineProps = {
  pronunciation: string | null;
  className?: string;
};

export function KoreanInlinePronunciation({ pronunciation, className = "" }: InlineProps) {
  if (!pronunciation) return null;
  return (
    <MongolianPronunciationHint pronunciation={pronunciation} className={className} />
  );
}
