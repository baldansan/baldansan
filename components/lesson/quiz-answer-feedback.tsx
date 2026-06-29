import { KoreanAnswerPronunciationBlock } from "@/components/lesson/korean-pronunciation-feedback";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { resolveQuizFeedbackTexts } from "@/lib/quiz/option-feedback";
import type { KoreanLesson0LessonPick } from "@/lib/lesson/korean-pronunciation-hints";
import { containsTargetScript } from "@/lib/tts/infer-lang";
import type { QuizQuestion, VocabularyWord } from "@/types/lesson";

type Props = {
  question: QuizQuestion;
  selected: string | null;
  isCorrect: boolean;
  ttsLang: string;
  courseId: string;
  className?: string;
  koreanLesson0?: boolean;
  lesson?: KoreanLesson0LessonPick;
  vocabulary?: VocabularyWord[];
  pronunciationMap?: Record<string, string>;
  showPronunciation?: boolean;
};

function FeedbackParagraph({
  text,
  ttsLang,
  courseId,
  className = "",
}: {
  text: string;
  ttsLang: string;
  courseId: string;
  className?: string;
}) {
  if (!text) return null;

  return (
    <div className={`flex items-start gap-2 ${className}`.trim()}>
      <p className="min-w-0 flex-1 text-sm leading-6 text-slate-700">{text}</p>
      {containsTargetScript(text) ? (
        <SpeakerButton
          text={text}
          lang={ttsLang}
          courseId={courseId}
          size="sm"
          label="Тайлбар уншуулах"
        />
      ) : null}
    </div>
  );
}

export function QuizAnswerFeedback({
  question,
  selected,
  isCorrect,
  ttsLang,
  courseId,
  className = "mt-2",
  koreanLesson0 = false,
  lesson,
  vocabulary = [],
  pronunciationMap,
  showPronunciation = false,
}: Props) {
  const { primary, secondary, usesOptionFeedback } = resolveQuizFeedbackTexts(
    question,
    selected,
    isCorrect
  );

  if (koreanLesson0 && lesson && !usesOptionFeedback) {
    return (
      <KoreanAnswerPronunciationBlock
        correctAnswer={question.correctAnswer}
        explanation={question.explanation}
        lesson={lesson}
        vocabulary={vocabulary}
        pronunciationMap={pronunciationMap}
        showPronunciation={showPronunciation}
        className={className}
      />
    );
  }

  if (koreanLesson0 && lesson && usesOptionFeedback) {
    return (
      <div className={className}>
        <FeedbackParagraph
          text={primary}
          ttsLang={ttsLang}
          courseId={courseId}
        />
        {!isCorrect && secondary ? (
          <KoreanAnswerPronunciationBlock
            correctAnswer={question.correctAnswer}
            explanation={secondary}
            lesson={lesson}
            vocabulary={vocabulary}
            pronunciationMap={pronunciationMap}
            showPronunciation={showPronunciation}
            className="mt-2"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <FeedbackParagraph text={primary} ttsLang={ttsLang} courseId={courseId} />
      {!isCorrect && secondary ? (
        <FeedbackParagraph
          text={secondary}
          ttsLang={ttsLang}
          courseId={courseId}
          className="mt-2"
        />
      ) : null}
    </div>
  );
}
