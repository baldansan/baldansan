"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MockTestAnswerSheet } from "@/components/mock-test/mock-test-answer-sheet";
import { MockTestExamOverview } from "@/components/mock-test/mock-test-exam-overview";
import { MockTestExitDialog } from "@/components/mock-test/mock-test-exit-dialog";
import { MockTestListeningAudioOnce } from "@/components/mock-test/mock-test-listening-audio-once";
import { MockTestQuestion } from "@/components/mock-test/mock-test-question";
import { MockTestResultView } from "@/components/mock-test/mock-test-result-view";
import { MockTestSectionReady } from "@/components/mock-test/mock-test-section-ready";
import { MockTestWritingGrade } from "@/components/mock-test/mock-test-writing-grade";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import {
  clearMockExamProgress,
  getMockExamProgress,
  hasMockExamSavedProgress,
  saveMockExamProgress,
} from "@/lib/mock-test/exam-progress";
import {
  buildRandomMockTestAnswers,
  isMockTestDevToolsEnabled,
} from "@/lib/mock-test/dev-quick-fill";
import {
  computeHskScoreBreakdown,
  manualWritingQuestions,
  type HskScoreBreakdown,
  type WritingSelfGrade,
} from "@/lib/mock-test/hsk-scoring";
import {
  orderedSkillsForTest,
  resolveSectionTimeMinutes,
  sectionQuestionCount,
  totalRealExamMinutes,
} from "@/lib/mock-test/section-timing";
import { scoreMockTestAttempt } from "@/lib/mock-test/scoring";
import {
  weakLessonsFromAnswerDetails,
  type LessonTitleRow,
} from "@/lib/mock-test/weak-lessons";
import {
  SKILL_LABELS_MN,
  type MockTestAnswers,
  type MockTestExamMode,
  type MockTestQuestionRow,
  type MockTestRow,
  type MockTestScoreResult,
} from "@/lib/mock-test/types";
import {
  fetchCompletedLessonIdsClient,
  saveCheckpointAttempt,
} from "@/lib/supabase/mock-tests-client";

type Phase = "intro" | "overview" | "section_ready" | "exam" | "writing_grade" | "result";

type Props = {
  test: MockTestRow;
  questions: MockTestQuestionRow[];
  lessonTitles: LessonTitleRow[];
  returnTo?: string;
};

type ShellOptions = {
  immersive?: boolean;
  hideSidebar?: boolean;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function countUnanswered(
  sectionQuestions: MockTestQuestionRow[],
  answers: MockTestAnswers
): number {
  return sectionQuestions.filter((question) => {
    const value = answers[String(question.q_no)] ?? "";
    return !value.trim();
  }).length;
}

export function MockTestExamClient({
  test,
  questions,
  lessonTitles,
  returnTo = "/test",
}: Props) {
  const router = useRouter();
  const skills = useMemo(() => orderedSkillsForTest(test), [test]);
  const realTotalMinutes = useMemo(() => totalRealExamMinutes(test), [test]);
  const backLabel = returnTo.startsWith("/review") ? "← Давтах" : "← Тестүүд";

  const [phase, setPhase] = useState<Phase>("intro");
  const [examMode, setExamMode] = useState<MockTestExamMode>("practice");
  const [skill, setSkill] = useState(skills[0] ?? "listening");
  const [currentQNo, setCurrentQNo] = useState(questions[0]?.q_no ?? 1);
  const [answers, setAnswers] = useState<MockTestAnswers>({});
  const [secondsLeft, setSecondsLeft] = useState(test.time_limit_min * 60);
  const [sectionTotalSeconds, setSectionTotalSeconds] = useState(0);
  const [listeningAudioKey, setListeningAudioKey] = useState(0);
  const [showUnansweredPrompt, setShowUnansweredPrompt] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [result, setResult] = useState<MockTestScoreResult | null>(null);
  const [hskBreakdown, setHskBreakdown] = useState<HskScoreBreakdown | null>(
    null
  );
  const [writingGrades, setWritingGrades] = useState<
    Record<number, WritingSelfGrade>
  >({});
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    () => new Set()
  );
  const overviewPreviewRef = useRef<MockTestAnswers>({});
  const skipOverviewPersistRef = useRef(false);
  const [overviewPreviewAnswers, setOverviewPreviewAnswers] = useState<MockTestAnswers>(
    {}
  );

  const sectionMeta = useMemo(
    () => test.sections.find((section) => section.skill === skill),
    [test.sections, skill]
  );

  const skillQuestions = useMemo(
    () => questions.filter((question) => question.skill === skill),
    [questions, skill]
  );

  const sectionIndex = skills.indexOf(skill);
  const isRealMode = examMode === "real";
  const isLastSection = sectionIndex >= skills.length - 1;
  const unansweredCount = useMemo(
    () => countUnanswered(skillQuestions, answers),
    [skillQuestions, answers]
  );

  const writingQuestions = useMemo(
    () => manualWritingQuestions(questions),
    [questions]
  );

  const currentQuestion = useMemo(
    () => skillQuestions.find((question) => question.q_no === currentQNo) ?? null,
    [skillQuestions, currentQNo]
  );

  const currentQuestionIndex = useMemo(
    () => skillQuestions.findIndex((question) => question.q_no === currentQNo),
    [skillQuestions, currentQNo]
  );

  const isExamFullscreen =
    phase === "overview" ||
    phase === "section_ready" ||
    phase === "exam" ||
    phase === "writing_grade";

  const finalizeResult = useCallback(
    async (
      scored: MockTestScoreResult,
      grades: Record<number, WritingSelfGrade>,
      skippedWriting = false
    ) => {
      const effectiveGrades = skippedWriting ? {} : grades;
      const hsk = computeHskScoreBreakdown(
        test,
        questions,
        scored,
        effectiveGrades
      );
      setResult(scored);
      setHskBreakdown(hsk);
      setPhase("result");
      setShowUnansweredPrompt(false);
      clearMockExamProgress(test.id);

      const save = await saveCheckpointAttempt(
        test.id,
        scored,
        hsk,
        examMode,
        effectiveGrades
      );
      if (save.ok) {
        setSaveNote("Оролдлого бүртгэгдлээ.");
      } else if (save.error === "Нэвтрээгүй хэрэглэгч.") {
        setSaveNote("Зочин горим — оноо зөвхөн энэ удаа харагдана.");
      } else if (save.error) {
        setSaveNote(save.error);
      }
    },
    [examMode, questions, test]
  );

  const finishExam = useCallback(
    async (overrideAnswers?: MockTestAnswers) => {
      const finalAnswers = overrideAnswers ?? answers;
      if (overrideAnswers) setAnswers(finalAnswers);

      const scored = scoreMockTestAttempt(questions, finalAnswers);
      if (writingQuestions.length > 0) {
        setResult(scored);
        setWritingGrades({});
        setPhase("writing_grade");
        setShowUnansweredPrompt(false);
        return;
      }

      await finalizeResult(scored, {});
    },
    [answers, finalizeResult, questions, writingQuestions.length]
  );

  const showDevTools = isMockTestDevToolsEnabled();

  function handleDevQuickFill() {
    void finishExam(buildRandomMockTestAnswers(questions));
  }

  const advanceAfterSection = useCallback(() => {
    setShowUnansweredPrompt(false);
    if (isLastSection) {
      void finishExam();
      return;
    }
    const nextSkill = skills[sectionIndex + 1];
    if (!nextSkill) {
      void finishExam();
      return;
    }
    setSkill(nextSkill);
    setPhase("section_ready");
  }, [finishExam, isLastSection, sectionIndex, skills]);

  useEffect(() => {
    if (phase !== "exam" && phase !== "section_ready") return;
    const first = skillQuestions[0]?.q_no;
    if (first != null) setCurrentQNo(first);
  }, [phase, skill, skillQuestions]);

  const startSectionExam = useCallback(() => {
    if (isRealMode) {
      const mins = resolveSectionTimeMinutes(test, skill);
      const total = mins * 60;
      setSectionTotalSeconds(total);
      setSecondsLeft(total);
      if (skill === "listening") {
        setListeningAudioKey((key) => key + 1);
      }
    }
    const first = skillQuestions[0]?.q_no;
    if (first != null) setCurrentQNo(first);
    setPhase("exam");
    setShowUnansweredPrompt(false);
  }, [isRealMode, skill, skillQuestions, test]);

  useEffect(() => {
    if (!isExamFullscreen) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isExamFullscreen]);

  useEffect(() => {
    if (phase !== "exam") return;
    if (secondsLeft > 0) return;

    if (isRealMode) {
      advanceAfterSection();
      return;
    }

    void finishExam();
  }, [phase, secondsLeft, isRealMode, advanceAfterSection, finishExam]);

  useEffect(() => {
    if (phase !== "exam") return;
    if (secondsLeft <= 0) return;

    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  function setAnswer(qNo: number, value: string) {
    setAnswers((prev) => ({ ...prev, [String(qNo)]: value }));
  }

  useEffect(() => {
    if (phase !== "exam") return;
    saveMockExamProgress({
      testId: test.id,
      examMode,
      answers,
      skill,
      currentQNo,
      secondsLeft,
      sectionTotalSeconds,
    });
  }, [
    phase,
    test.id,
    examMode,
    answers,
    skill,
    currentQNo,
    secondsLeft,
    sectionTotalSeconds,
  ]);

  function selectQuestion(qNo: number) {
    setCurrentQNo(qNo);
    if (!isRealMode) {
      requestAnimationFrame(() => {
        document
          .getElementById(`bs-mt-q-${qNo}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function goToQuestionOffset(offset: number) {
    const next = skillQuestions[currentQuestionIndex + offset];
    if (!next) return;
    selectQuestion(next.q_no);
  }

  function advanceFromQuestion(qNo: number) {
    const index = skillQuestions.findIndex((item) => item.q_no === qNo);
    const next = skillQuestions[index + 1];
    if (!next) return;
    selectQuestion(next.q_no);
  }

  function confirmExitExam() {
    setShowExitDialog(false);
    router.push(returnTo);
  }

  function beginExam(mode: MockTestExamMode) {
    setExamMode(mode);
    setShowUnansweredPrompt(false);
    const saved = getMockExamProgress(test.id);
    const preview =
      saved && saved.examMode === mode ? saved.answers : {};
    overviewPreviewRef.current = preview;
    setOverviewPreviewAnswers(preview);
    setPhase("overview");
  }

  function resetExamStateForFreshStart() {
    clearMockExamProgress(test.id);
    overviewPreviewRef.current = {};
    setOverviewPreviewAnswers({});
    setAnswers({});
    setWritingGrades({});
    setResult(null);
    setHskBreakdown(null);
    setSaveNote(null);
    setShowUnansweredPrompt(false);
    setSkill(skills[0] ?? "listening");
    const firstQ = questions.find((q) => q.skill === (skills[0] ?? "listening"))?.q_no
      ?? questions[0]?.q_no
      ?? 1;
    setCurrentQNo(firstQ);
    if (examMode === "real") {
      const mins = resolveSectionTimeMinutes(test, skills[0] ?? "listening");
      const total = mins * 60;
      setSectionTotalSeconds(total);
      setSecondsLeft(total);
    } else {
      const total = test.time_limit_min * 60;
      setSectionTotalSeconds(total);
      setSecondsLeft(total);
    }
  }

  function applySavedExamProgress(saved: ReturnType<typeof getMockExamProgress>) {
    if (!saved) return;
    setAnswers(saved.answers);
    overviewPreviewRef.current = saved.answers;
    setSkill(saved.skill);
    setCurrentQNo(saved.currentQNo);
    setSectionTotalSeconds(saved.sectionTotalSeconds);
    setSecondsLeft(saved.secondsLeft);
  }

  function startExamFresh() {
    resetExamStateForFreshStart();
    if (examMode === "real") {
      setPhase("section_ready");
      return;
    }
    setPhase("exam");
  }

  function continueExam() {
    const saved = getMockExamProgress(test.id);
    if (!saved || saved.examMode !== examMode) return;
    applySavedExamProgress(saved);
    if (examMode === "real") {
      setPhase("exam");
      return;
    }
    setPhase("exam");
  }

  function jumpToQuestionFromOverview(skillKey: string, qNo: number) {
    skipOverviewPersistRef.current = true;
    const saved = getMockExamProgress(test.id);
    if (saved && saved.examMode === examMode) {
      applySavedExamProgress(saved);
    } else {
      setAnswers(overviewPreviewRef.current);
    }
    setSkill(skillKey);
    setCurrentQNo(qNo);
    if (examMode === "real") {
      const mins = resolveSectionTimeMinutes(test, skillKey);
      const total = mins * 60;
      setSectionTotalSeconds(total);
      if (!saved || saved.skill !== skillKey) {
        setSecondsLeft(total);
      }
      setPhase("exam");
      return;
    }
    setPhase("exam");
  }

  const canContinueFromOverview = hasMockExamSavedProgress(test.id, examMode);

  function requestFinishSection() {
    if (!isRealMode) {
      void finishExam();
      return;
    }
    if (unansweredCount > 0) {
      setShowUnansweredPrompt(true);
      return;
    }
    advanceAfterSection();
  }

  const weakLessonsForResult = useMemo(() => {
    if (!result) return [];
    return weakLessonsFromAnswerDetails(result.details, questions, lessonTitles);
  }, [result, questions, lessonTitles]);

  useEffect(() => {
    if (phase !== "result" || weakLessonsForResult.length === 0) {
      setCompletedLessonIds(new Set());
      return;
    }
    let cancelled = false;
    void fetchCompletedLessonIdsClient(
      weakLessonsForResult.map((lesson) => lesson.lessonId)
    ).then((ids) => {
      if (!cancelled) setCompletedLessonIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, weakLessonsForResult]);

  const shell = (children: ReactNode, options: ShellOptions = {}) => (
    <MobileAppShell
      activeTab="games"
      showBottomNav={false}
      immersive={options.immersive}
      hideSidebar={options.hideSidebar}
      mainClassName={
        options.immersive
          ? "bs-mt-exam-shell"
          : "mx-auto w-full max-w-[430px] lg:max-w-none px-0 pb-8"
      }
    >
      {children}
    </MobileAppShell>
  );

  const examChrome = (children: ReactNode) => (
    <>
      <div className="bs-mt-exam-topbar">
        <button
          type="button"
          className="bs-mt-exit-link"
          onClick={() => setShowExitDialog(true)}
        >
          Гарах
        </button>
        <span className="bs-mt-exam-topbar-title">{test.title}</span>
      </div>
      {children}
      {showExitDialog ? (
        <MockTestExitDialog
          onCancel={() => setShowExitDialog(false)}
          onConfirm={confirmExitExam}
        />
      ) : null}
    </>
  );

  if (phase === "intro") {
    return shell(
      <div className="bs-mt-intro px-4">
        <Link href={returnTo} className="bs-mem-back">
          {backLabel}
        </Link>
        <h1 className="bs-mt-title mt-3">{test.title}</h1>
        <p className="bs-mt-sub">
          HSK {test.hsk_level} · {test.id}
        </p>
        <div className="bs-mock-info-card mt-4">
          <p className="bs-mock-info-row">
            <span>Асуулт</span>
            <strong>{test.total_questions}</strong>
          </p>
          <p className="bs-mock-info-row">
            <span>Хэсэг</span>
            <strong>
              {skills.map((item) => SKILL_LABELS_MN[item] ?? item).join(", ")}
            </strong>
          </p>
        </div>

        <p className="bs-mt-mode-label mt-5">Горим сонгох</p>
        <div className="bs-mt-mode-grid">
          <button
            type="button"
            className="bs-mt-mode-card"
            onClick={() => beginExam("real")}
          >
            <span className="bs-mt-mode-card-title">Жинхэнэ горим</span>
            <span className="bs-mt-mode-card-meta">
              ~{realTotalMinutes} мин · хэсэг тус бүр өөрийн цагтай
            </span>
            <span className="bs-mt-mode-card-desc">
              Сонсгол → Унших → Бичих дарааллаар. Аудио нэг удаа. Буцах боломжгүй.
            </span>
          </button>
          <button
            type="button"
            className="bs-mt-mode-card bs-mt-mode-card--practice"
            onClick={() => beginExam("practice")}
          >
            <span className="bs-mt-mode-card-title">Дадлагын горим</span>
            <span className="bs-mt-mode-card-meta">
              {test.time_limit_min} мин · нийт цаг
            </span>
            <span className="bs-mt-mode-card-desc">
              Табаар чөлөөтэй шилжинэ. Аудио дахин сонсоно.
            </span>
          </button>
        </div>

        {showDevTools ? (
          <button
            type="button"
            className="bs-mt-dev-btn mt-4"
            onClick={handleDevQuickFill}
          >
            Хурдан бөглөх (dev)
          </button>
        ) : null}
      </div>
    );
  }

  if (phase === "overview") {
    return shell(
      examChrome(
        <MockTestExamOverview
          test={test}
          questions={questions}
          skills={skills}
          examMode={examMode}
          previewAnswers={overviewPreviewAnswers}
          canContinue={canContinueFromOverview}
          onFreshStart={startExamFresh}
          onContinue={continueExam}
          onJumpToQuestion={jumpToQuestionFromOverview}
        />
      ),
      { immersive: true, hideSidebar: true }
    );
  }

  if (phase === "section_ready") {
    const minutes = resolveSectionTimeMinutes(test, skill);
    const questionCount = sectionQuestionCount(questions, skill);
    return shell(
      examChrome(
        <MockTestSectionReady
          skillLabel={SKILL_LABELS_MN[skill] ?? skill}
          questionCount={questionCount}
          minutes={minutes}
          sectionIndex={Math.max(0, sectionIndex)}
          totalSections={skills.length}
          isRealMode={isRealMode}
          onStart={startSectionExam}
        />
      ),
      { immersive: true, hideSidebar: true }
    );
  }

  if (phase === "writing_grade" && result) {
    return shell(
      examChrome(
        <MockTestWritingGrade
        questions={writingQuestions}
        answers={answers}
        grades={writingGrades}
        onGrade={(qNo, grade) =>
          setWritingGrades((prev) => ({ ...prev, [qNo]: grade }))
        }
        onComplete={() => void finalizeResult(result, writingGrades)}
        onSkip={() => void finalizeResult(result, {}, true)}
        />
      ),
      { immersive: true, hideSidebar: true }
    );
  }

  if (phase === "result" && result && hskBreakdown) {
    return shell(
      <MockTestResultView
        test={test}
        result={result}
        hsk={hskBreakdown}
        questions={questions}
        weakLessons={weakLessonsForResult}
        completedLessonIds={completedLessonIds}
        saveNote={saveNote}
        backHref={returnTo}
        backLabel={returnTo.startsWith("/review") ? "Давтах руу буцах" : "Тестүүд рүү буцах"}
      />
    );
  }

  const timerPct = Math.max(
    0,
    Math.min(
      100,
      sectionTotalSeconds > 0 ? (secondsLeft / sectionTotalSeconds) * 100 : 0
    )
  );
  const warn = secondsLeft < 300;
  const hideQuestionAudio = isRealMode && skill === "listening";
  const showSectionAudio =
    isRealMode && skill === "listening" && sectionMeta?.audio_url;
  const showPracticeAudio =
    !isRealMode && skill === "listening" && sectionMeta?.audio_url;

  const showSingleQuestion = isRealMode;
  const canGoPrev = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < skillQuestions.length - 1;

  return shell(
    examChrome(
    <div className="bs-mt-exam bs-mt-exam--fullscreen">
      <div className="bs-mt-exam-body">
      <div className="bs-mt-timer-bar">
        <span className="bs-mt-timer-text">
          {isRealMode ? (
            <>
              {SKILL_LABELS_MN[skill] ?? skill} · {formatTime(secondsLeft)} үлдсэн
            </>
          ) : (
            <>{formatTime(secondsLeft)} үлдсэн</>
          )}
        </span>
        <div className="bs-mt-timer-track">
          <div
            className={`bs-mt-timer-fill ${warn ? "bs-mt-timer-fill--warn" : ""}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </div>

      {isRealMode ? (
        <p className="bs-mt-real-progress">
          {sectionIndex + 1}/{skills.length} хэсэг · {SKILL_LABELS_MN[skill] ?? skill}
          {unansweredCount > 0 ? ` · ${unansweredCount} хариулаагүй` : ""}
        </p>
      ) : (
        <div className="bs-mt-section-nav">
          {skills.map((item) => (
            <button
              key={item}
              type="button"
              className={`bs-mt-section-btn ${skill === item ? "bs-mt-section-btn--active" : ""}`}
              onClick={() => setSkill(item)}
            >
              {SKILL_LABELS_MN[item] ?? item}
            </button>
          ))}
        </div>
      )}

      {showSectionAudio ? (
        <div className="bs-mt-audio-wrap">
          <p className="bs-mt-audio-label">Сонсгол — нэг удаа</p>
          <MockTestListeningAudioOnce
            url={sectionMeta!.audio_url!}
            playKey={listeningAudioKey}
          />
        </div>
      ) : null}

      {showPracticeAudio ? (
        <div className="bs-mt-audio-wrap">
          <p className="bs-mt-audio-label">Сонсгол — бүтэн аудио</p>
          <audio controls src={sectionMeta!.audio_url!} className="bs-mt-audio" />
        </div>
      ) : null}

      <div className={`bs-mt-questions ${showSingleQuestion ? "bs-mt-questions--single" : ""}`}>
        {showSingleQuestion && currentQuestion ? (
          <div className="bs-mt-single-question">
            <MockTestQuestion
              key={currentQuestion.id}
              question={currentQuestion}
              answers={answers}
              onAnswer={setAnswer}
              hideQuestionAudio={hideQuestionAudio}
              onAdvanceNext={
                currentQuestionIndex < skillQuestions.length - 1
                  ? () => goToQuestionOffset(1)
                  : undefined
              }
            />
            <div className="bs-mt-q-nav">
              <button
                type="button"
                className="bs-mt-q-nav-btn"
                disabled={!canGoPrev}
                onClick={() => goToQuestionOffset(-1)}
              >
                ← Өмнөх
              </button>
              <span className="bs-mt-q-nav-pos">
                {currentQuestionIndex + 1} / {skillQuestions.length}
              </span>
              <button
                type="button"
                className="bs-mt-q-nav-btn"
                disabled={!canGoNext}
                onClick={() => goToQuestionOffset(1)}
              >
                Дараах →
              </button>
            </div>
          </div>
        ) : (
          skillQuestions.map((question) => (
            <div key={question.id} id={`bs-mt-q-${question.q_no}`}>
              <MockTestQuestion
                question={question}
                answers={answers}
                onAnswer={setAnswer}
                hideQuestionAudio={hideQuestionAudio}
                onAdvanceNext={() => advanceFromQuestion(question.q_no)}
              />
            </div>
          ))
        )}
      </div>

      {showUnansweredPrompt ? (
        <div className="bs-mt-unanswered-prompt" role="alertdialog">
          <p className="bs-mt-unanswered-title">
            {unansweredCount} асуултанд хариулаагүй байна
          </p>
          <p className="bs-mt-unanswered-text">
            Үргэлжлүүлбэл эдгээр асуулт хоосон үлдэнэ.
          </p>
          <div className="bs-mt-unanswered-actions">
            <button
              type="button"
              className="bs-mt-link-btn"
              onClick={() => setShowUnansweredPrompt(false)}
            >
              Буцах
            </button>
            <button
              type="button"
              className="bs-mock-primary-btn bs-mt-unanswered-confirm"
              onClick={advanceAfterSection}
            >
              Үргэлжлүүлэх
            </button>
          </div>
        </div>
      ) : null}

      {showDevTools ? (
        <button
          type="button"
          className="bs-mt-dev-btn mt-4 w-full"
          onClick={handleDevQuickFill}
        >
          Хурдан бөглөх (dev)
        </button>
      ) : null}

      <button
        type="button"
        className="bs-mock-primary-btn bs-mt-finish-btn"
        onClick={requestFinishSection}
      >
        {isRealMode
          ? isLastSection
            ? "Шалгалт дуусгах"
            : "Дараагийн хэсэг →"
          : "Дуусгах"}
      </button>
      </div>

      <MockTestAnswerSheet
        questions={skillQuestions}
        answers={answers}
        activeQNo={currentQNo}
        onSelect={selectQuestion}
      />
    </div>
    ),
    { immersive: true, hideSidebar: true }
  );
}
