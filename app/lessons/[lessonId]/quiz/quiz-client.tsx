"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LocalProgressNote } from "@/components/local-progress-note";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { LessonMobileStepBar } from "@/components/lesson-mobile-step-bar";
import { LearnerPageShell } from "@/components/ui/page-shell";
import {
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { SectionCard } from "@/components/ui/section-card";
import { coursePath, lessonTrainingPath } from "@/lib/content";
import { isKoreanLesson0BeginnerFlow } from "@/lib/lesson/korean-lesson0-flow";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON, LEARNER_QUIZ } from "@/lib/learner-labels";
import {
  clearBsQuizProgress,
  getBsQuizProgress,
  matchVocabularyWordKeyFromAnswer,
  recordStudiedWordKey,
  saveBsQuizProgress,
} from "@/lib/lesson/bs-step-progress";
import {
  getQuizResultSmart,
  markLessonCompletedSmart,
  PASSING_QUIZ_PERCENT,
  saveQuizResultSmart,
  type QuizResult,
} from "@/lib/progress";
import { buildQuizDetailedAnswer, type QuizDetailedAnswer } from "@/lib/quiz-answers";
import { prepareLessonQuizQuestions } from "@/lib/quiz/smart-options";
import {
  gradeQuizSentenceOrder,
  isQuizSentenceOrderQuestion,
} from "@/lib/quiz/sentence-order";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import {
  mapQuizQuestionType,
  mapQuizStage,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import { QuestionFeedbackButtons } from "@/components/feedback/question-feedback-buttons";
import { LessonQuizSentenceOrder } from "@/components/lesson/lesson-quiz-sentence-order";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { containsTargetScript } from "@/lib/tts/infer-lang";
import { resolveKoreanTtsLang } from "@/lib/lesson/teaching-media";
import { QuizAnswerFeedback } from "@/components/lesson/quiz-answer-feedback";
import { QuizAudioButton } from "@/components/lesson/quiz-audio-button";
import type { LessonContent } from "@/types/lesson-content";
import type { QuizQuestion } from "@/types/lesson";

function getResultMessage(percent: number) {
  if (percent >= 90) return "Маш сайн! Дараагийн хичээл рүү орж болно.";
  if (percent >= 70) return "Сайн байна. Алдсан үгээ үгийн сан хэсгээс давтаарай.";
  return "Дахиад нэг удаа үзээд quiz-ээ давтаарай.";
}

type Props = {
  lesson: LessonContent;
  quizQuestions: QuizQuestion[];
  useDatabaseQuizOptions?: boolean;
  nextLessonId: string | null;
  adminPreview?: boolean;
};

export function LessonQuizClient({
  lesson,
  quizQuestions: quizQuestionsProp,
  useDatabaseQuizOptions = false,
  nextLessonId,
  adminPreview = false,
}: Props) {
  const quizQuestions = useMemo(
    () =>
      prepareLessonQuizQuestions(quizQuestionsProp, lesson.vocabulary, {
        rewriteOptions:
          !useDatabaseQuizOptions && isKoreanLesson0BeginnerFlow(lesson),
      }),
    [
      quizQuestionsProp,
      lesson.vocabulary,
      lesson,
      useDatabaseQuizOptions,
    ]
  );
  const total = quizQuestions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerDetails, setAnswerDetails] = useState<QuizDetailedAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const [savedResult, setSavedResult] = useState<QuizResult | null>(null);
  const persistAttemptRef = useRef(false);
  const quizHydratedRef = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const current = quizQuestions[currentIndex];
  const getElapsed = useQuestionTimer(`${lesson.id}:quiz:${currentIndex}`);
  const currentIsSentenceOrder = current
    ? isQuizSentenceOrderQuestion(current)
    : false;
  const isCorrect = current
    ? currentIsSentenceOrder
      ? gradeQuizSentenceOrder(current, selected ?? "")
      : selected === current.correctAnswer
    : false;
  const ttsLang = resolveKoreanTtsLang(lesson);
  const isLesson0 = isKoreanLesson0BeginnerFlow(lesson);

  const questionProgressPercent = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((currentIndex + 1) / total) * 100);
  }, [currentIndex, total]);

  const percent = useMemo(
    () => (total > 0 ? Math.round((correctCount / total) * 100) : 0),
    [correctCount, total]
  );

  useEffect(() => {
    async function load() {
      setSavedResult(await getQuizResultSmart(lesson.id));
    }
    void load();
  }, [lesson.id]);

  useEffect(() => {
    if (quizHydratedRef.current || total === 0) return;
    quizHydratedRef.current = true;
    const saved = getBsQuizProgress(lesson.id);
    if (!saved) return;
    const idx = Math.min(Math.max(0, saved.currentIndex), total - 1);
    setCurrentIndex(idx);
    setCorrectCount(saved.correctCount ?? 0);
    if (saved.finished || saved.completed) {
      setFinished(true);
    }
  }, [lesson.id, total]);

  useEffect(() => {
    if (!quizHydratedRef.current || total === 0) return;
    saveBsQuizProgress(lesson.id, {
      currentIndex,
      correctCount,
      answeredCount: answerDetails.length,
      finished,
      completed: finished,
    });
  }, [
    lesson.id,
    currentIndex,
    correctCount,
    answerDetails.length,
    finished,
    total,
  ]);

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [revealed, currentIndex]);

  useEffect(() => {
    if (!finished || total === 0 || persistAttemptRef.current) {
      return;
    }
    persistAttemptRef.current = true;

    async function save() {
      const result = await saveQuizResultSmart(
        lesson.id,
        correctCount,
        total,
        percent,
        answerDetails
      );
      setSavedResult(result);

      if (percent >= PASSING_QUIZ_PERCENT) {
        await markLessonCompletedSmart(lesson.id);
      }
    }

    void save();
  }, [finished, lesson.id, correctCount, total, percent, answerDetails]);

  function recordAnswer(option: string) {
    if (!current) return;
    setSelected(option);
    setRevealed(true);
    const orderIndex = current.orderIndex ?? currentIndex;
    setAnswerDetails((prev) => [
      ...prev,
      buildQuizDetailedAnswer(current, orderIndex, option),
    ]);
    const correct = isQuizSentenceOrderQuestion(current)
      ? gradeQuizSentenceOrder(current, option)
      : option === current.correctAnswer;
    if (correct) {
      setCorrectCount((c) => c + 1);
      const wordKey = matchVocabularyWordKeyFromAnswer(
        current.correctAnswer,
        lesson.vocabulary
      );
      if (wordKey) recordStudiedWordKey(lesson.id, wordKey);
    }
    recordQuestionAttempt({
      lessonId: lesson.id,
      stage: mapQuizStage(isQuizSentenceOrderQuestion(current)),
      questionId:
        current.dbId != null
          ? `quiz:db:${current.dbId}`
          : `quiz:${current.orderIndex ?? currentIndex}`,
      questionType: mapQuizQuestionType(
        current.type,
        isQuizSentenceOrderQuestion(current)
      ),
      isCorrect: correct,
      selectedAnswer: option,
      correctAnswer: current.correctAnswer,
      timeSpentMs: getElapsed(),
    });
  }

  function handleSelect(option: string) {
    if (!current || revealed) return;
    recordAnswer(option);
  }

  function handleSentenceOrderCheck(answer: string) {
    if (!current || revealed) return;
    recordAnswer(answer);
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    setFinished(true);
  }

  function restartQuiz() {
    clearBsQuizProgress(lesson.id);
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setAnswerDetails([]);
    setFinished(false);
    persistAttemptRef.current = false;
  }

  const nextLabel =
    currentIndex < total - 1 ? LEARNER_QUIZ.next : LEARNER_QUIZ.seeResults;

  function optionClass(option: string) {
    const base =
      "min-h-[48px] w-full rounded-xl px-4 py-3.5 text-left text-sm sm:text-base";
    if (!revealed || !current) {
      return selected === option
        ? `${base} bg-emerald-500 font-semibold text-white ring-2 ring-emerald-400`
        : `${base} border border-slate-200 bg-white text-slate-800 transition-colors hover:border-emerald-200 hover:bg-emerald-50`;
    }
    if (option === current.correctAnswer) {
      return `${base} bg-emerald-100 font-semibold text-emerald-800 ring-2 ring-emerald-400`;
    }
    if (option === selected) {
      return `${base} bg-red-50 font-semibold text-red-700 ring-2 ring-red-300`;
    }
    return `${base} border border-slate-200 bg-slate-50 text-slate-500`;
  }

  const quizInProgress = !finished && total > 0;

  return (
    <LearnerPageShell
      activeTab="games"
      mainClassName={
        quizInProgress && revealed ? "!pb-44 md:!pb-24" : undefined
      }
    >
      {adminPreview ? <AdminPreviewBanner /> : null}
      {isLesson0 ? (
        <Link
          href={lessonTrainingPath(lesson.id, { preview: adminPreview })}
          className="inline-flex w-fit text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← Хичээл рүү буцах
        </Link>
      ) : (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
        <Link
          href={lessonPreviewPath(lesson.id, { adminPreview })}
          className="inline-flex w-fit text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← {LEARNER_LESSON.backToLesson}
        </Link>
        <Link
          href={lessonPreviewPath(lesson.id, {
            adminPreview,
            subpath: "watch",
          })}
          className="inline-flex w-fit text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
        >
          {LEARNER_LESSON.watch}
        </Link>
        <Link
          href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "vocabulary" })}
          className="inline-flex w-fit text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
        >
          {LEARNER_LESSON.vocabulary}
        </Link>
      </div>
      )}

      <section className="overflow-hidden">
        <h1 className="break-words text-xl font-bold leading-snug tracking-tight sm:text-3xl">
          Quiz — {lesson.title}
        </h1>
        <p className="mt-1 break-words text-lg text-slate-700">{lesson.chineseTitle}</p>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Сурсан үг, өгүүлбэрээ шалгаарай.
        </p>
      </section>

      {total === 0 ? (
        <EmptyState
          title="Quiz асуулт байхгүй"
          description="Энэ хичээлд quiz асуулт одоогоор байхгүй байна. Үгийн сан эсвэл хичээл үзэх хэсгээс үргэлжлүүлнэ үү."
          action={
            <>
              <Link
                href={lessonPreviewPath(lesson.id, { adminPreview })}
                className={ctaPrimaryClass}
              >
                {LEARNER_LESSON.backToLesson}
              </Link>
              <Link
                href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "vocabulary" })}
                className={ctaSecondaryClass}
              >
                {LEARNER_QUIZ.reviewVocab}
              </Link>
            </>
          }
        />
      ) : finished ? (
        <SectionCard className="overflow-hidden ring-emerald-200">
          <h2 className="text-xl font-semibold text-slate-900">Үр дүн</h2>
          <p className="mt-4 text-4xl font-bold text-emerald-600">{percent}%</p>
          <p className="mt-2 text-sm text-slate-600">
            {correctCount} / {total} зөв
          </p>
          <p className="mt-4 break-words text-base font-medium leading-snug text-slate-800">
            {getResultMessage(percent)}
          </p>
          {savedResult ? (
            <p className="mt-3 text-sm text-slate-600">
              {LEARNER_QUIZ.bestScore}: {savedResult.bestPercentage}%
              {percent < savedResult.bestPercentage
                ? ` · Энэ удаа: ${percent}%`
                : null}
            </p>
          ) : null}
          {answerDetails.filter((a) => !a.isCorrect).length > 0 ? (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <h3 className="text-sm font-semibold text-amber-900">
                Буруу хариултууд
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-amber-900">
                {answerDetails
                  .filter((a) => !a.isCorrect)
                  .map((a, i) => (
                    <li key={`${a.orderIndex}-${i}`} className="break-words">
                      {a.question}: зөв хариулт — {a.correctAnswer}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-3">
            <LocalProgressNote />
          </div>

          <div className="mt-6 flex w-full max-w-full flex-col gap-3 overflow-hidden">
            <button
              type="button"
              onClick={restartQuiz}
              className={ctaSecondaryClass}
            >
              Дахин эхлэх
            </button>
            <Link
              href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "vocabulary" })}
              className={ctaPrimaryClass}
            >
              {LEARNER_QUIZ.reviewVocab}
            </Link>
            <Link href="/study" className={ctaSecondaryClass}>
              Судлах хэсэг рүү
            </Link>
            <Link
              href={lessonTrainingPath(lesson.id, { preview: adminPreview })}
              className={ctaSecondaryClass}
            >
              Дахин үзэх
            </Link>
            <Link
              href={lessonPreviewPath(lesson.id, {
                adminPreview,
                subpath: "watch",
              })}
              className={ctaOutlineClass}
            >
              {LEARNER_QUIZ.watchLesson}
            </Link>
            {nextLessonId ? (
              <Link
                href={lessonTrainingPath(nextLessonId, { preview: adminPreview })}
                className={ctaPrimaryClass}
              >
                {LEARNER_QUIZ.nextLesson}
              </Link>
            ) : null}
            <Link href={coursePath(lesson.courseId)} className={ctaOutlineClass}>
              {LEARNER_QUIZ.backToCourse}
            </Link>
          </div>
        </SectionCard>
      ) : (
        current && (
          <>
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {LEARNER_QUIZ.question(currentIndex + 1, total)}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${questionProgressPercent}%` }}
                />
              </div>
            </div>

            <SectionCard>
              {currentIsSentenceOrder ? (
                <LessonQuizSentenceOrder
                  question={current}
                  index={currentIndex}
                  total={total}
                  selected={selected}
                  revealed={revealed}
                  ttsLang={ttsLang}
                  courseId={lesson.courseId}
                  onChecked={handleSentenceOrderCheck}
                />
              ) : (
                <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {current.type === "cloze" ? "Нөхөх" : "Сонгох"}
              </p>
              <div className="mt-2 flex items-start gap-2">
                <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
                  {current.question}
                </h2>
                {!current.audioUrl && containsTargetScript(current.question) ? (
                  <SpeakerButton
                    text={current.question}
                    lang={ttsLang}
                    courseId={lesson.courseId}
                    size="sm"
                  />
                ) : null}
              </div>

              {current.audioUrl ? (
                <QuizAudioButton
                  key={current.audioUrl}
                  audioUrl={current.audioUrl}
                  className="mt-4"
                />
              ) : null}

              <div className="mt-5 flex flex-col gap-2.5">
                {current.options.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      disabled={revealed}
                      className={`${optionClass(option)} flex-1`}
                    >
                      {option}
                    </button>
                    {containsTargetScript(option) &&
                    revealed &&
                    (option === current.correctAnswer || option === selected) ? (
                      <SpeakerButton
                        text={option}
                        lang={ttsLang}
                        courseId={lesson.courseId}
                        size="sm"
                        label={`Сонголт уншуулах: ${option}`}
                      />
                    ) : null}
                  </div>
                ))}
              </div>

              {revealed && (
                <div
                  ref={feedbackRef}
                  className={
                    isCorrect
                      ? "mt-4 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200"
                      : "mt-4 rounded-xl bg-red-50 p-4 ring-1 ring-red-200"
                  }
                >
                  <p
                    className={
                      isCorrect
                        ? "text-sm font-semibold text-emerald-800"
                        : "text-sm font-semibold text-red-800"
                    }
                  >
                    {isCorrect ? "Зөв!" : "Буруу"}
                  </p>
                  {isLesson0 ? (
                    <QuizAnswerFeedback
                      question={current}
                      selected={selected}
                      isCorrect={isCorrect}
                      ttsLang={ttsLang}
                      courseId={lesson.courseId}
                      koreanLesson0
                      lesson={lesson}
                      vocabulary={lesson.vocabulary}
                      pronunciationMap={lesson.vocabularyPronunciationMap}
                      showPronunciation
                    />
                  ) : (
                    <QuizAnswerFeedback
                      question={current}
                      selected={selected}
                      isCorrect={isCorrect}
                      ttsLang={ttsLang}
                      courseId={lesson.courseId}
                    />
                  )}
                </div>
              )}
              {revealed && (
                <QuestionFeedbackButtons
                  lessonId={lesson.id}
                  questionId={
                    current.dbId != null
                      ? `quiz:db:${current.dbId}`
                      : `quiz:${current.orderIndex ?? currentIndex}`
                  }
                />
              )}
                </>
              )}

              {revealed && (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`mt-5 hidden md:inline-flex ${ctaPrimaryClass}`}
                >
                  {nextLabel}
                </button>
              )}
            </SectionCard>

            {revealed && (
              <div
                className="pointer-events-none fixed inset-x-0 z-40 flex justify-center md:hidden"
                style={{
                  bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="pointer-events-auto w-full max-w-[430px] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur">
                  <button
                    type="button"
                    onClick={handleNext}
                    className={ctaPrimaryClass}
                  >
                    {nextLabel}
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
      {quizInProgress ? (
        <div className="hidden md:block">
          <LessonMobileStepBar
            lesson={lesson}
            current="quiz"
            adminPreview={adminPreview}
          />
        </div>
      ) : (
        <LessonMobileStepBar
          lesson={lesson}
          current="quiz"
          adminPreview={adminPreview}
        />
      )}
    </LearnerPageShell>
  );
}
