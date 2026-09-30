"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  buildLessonPathPlan,
  type LessonPathPlan,
  type LessonPathStage,
} from "@/lib/lesson/build-lesson-path";
import {
  allLessonPathStagesCompleted,
  hydrateLessonPathProgressSmart,
  markLessonPathStageCompletedSmart,
  setLessonPathLastStage,
  type LessonPathProgress,
} from "@/lib/lesson/lesson-path-progress";
import {
  markLessonCompletedSmart,
  markLessonStartedSmart,
} from "@/lib/progress";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import type { LessonDeepTeaching } from "@/types/lesson-deep-teaching";
import type { LessonContent } from "@/types/lesson-content";
import type { QuizQuestion } from "@/types/lesson";
import { LessonPathHub } from "./lesson-path-hub";
import { LessonPathWarmupStage } from "./lesson-path-warmup-stage";
import { LessonPathQuizStage } from "./lesson-path-quiz-stage";
import { LessonPathSummaryStage } from "./lesson-path-summary-stage";
import VocabularyCard from "./modules/VocabularyCard";
import SpeakButton from "./SpeakButton";
import CharactersModule from "./modules/CharactersModule";
import TextsModule from "./modules/TextsModule";
import GrammarModule from "./modules/GrammarModule";
import ExercisesModule, {
  type PathExerciseFooterMeta,
} from "./modules/ExercisesModule";
import { moduleHasContent } from "@/lib/lesson/resolve-hsk-lesson-package";
import "./lesson-player.css";
import "./lesson-path.css";

type View = "intro" | "hub" | "stage";

type Props = {
  lessonId: string;
  lesson: HskLessonPackage;
  lessonContent: LessonContent;
  quizQuestions?: QuizQuestion[];
  useDatabaseQuizOptions?: boolean;
  nextLessonId?: string | null;
  adminPreview?: boolean;
  /** Нэмэлт, гүнзгий заах агуулга — байхгүй бол хичээл урьдын адил. */
  deep?: LessonDeepTeaching | null;
  onExit?: () => void;
};

export default function LessonPathPlayer({
  lessonId,
  lesson,
  lessonContent,
  quizQuestions = [],
  useDatabaseQuizOptions = false,
  nextLessonId = null,
  adminPreview = false,
  deep = null,
  onExit,
}: Props) {
  const plan = useMemo(
    () => buildLessonPathPlan(lesson, quizQuestions),
    [lesson, quizQuestions]
  );

  const [view, setView] = useState<View>("hub");
  const [activeStage, setActiveStage] = useState<LessonPathStage | null>(null);
  const [progress, setProgress] = useState<LessonPathProgress>({
    completedStageIds: [],
    lastStageId: null,
    updatedAt: "",
  });
  const [hydrated, setHydrated] = useState(false);
  const [skipWarning, setSkipWarning] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [practiceFooter, setPracticeFooter] = useState<PathExerciseFooterMeta | null>(
    null
  );
  const practiceFooterActionRef = useRef<(() => void) | null>(null);

  const allStageIds = useMemo(() => plan.stages.map((s) => s.id), [plan.stages]);
  const activeIndex = activeStage
    ? plan.stages.findIndex((s) => s.id === activeStage.id)
    : -1;

  useEffect(() => {
    let cancelled = false;
    void hydrateLessonPathProgressSmart(lessonId, allStageIds).then((next) => {
      if (!cancelled) {
        setProgress(next);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId, allStageIds]);

  useEffect(() => {
    if (!hydrated) return;
    const warmupStage = plan.stages.find((s) => s.id === "goal_warmup");
    if (
      warmupStage &&
      !progress.completedStageIds.includes("goal_warmup")
    ) {
      setView("intro");
    }
  }, [hydrated, plan.stages, progress.completedStageIds]);

  useEffect(() => {
    if (!hydrated) return;
    void markLessonStartedSmart(lessonId);
  }, [hydrated, lessonId]);

  const goToHub = useCallback(() => {
    setView("hub");
    setActiveStage(null);
    setSkipWarning(null);
    setPracticeFooter(null);
    practiceFooterActionRef.current = null;
  }, []);

  const openStage = useCallback(
    (stage: LessonPathStage, skippedAhead: boolean) => {
      if (skippedAhead) {
        setSkipWarning("Эхлээд өмнөх үеүүдээ дуусгавал илүү сайн суралцана.");
      } else {
        setSkipWarning(null);
      }
      if (stage.id !== "practice") {
        setPracticeFooter(null);
        practiceFooterActionRef.current = null;
      }
      setActiveStage(stage);
      setView("stage");
      setLessonPathLastStage(lessonId, stage.id);
    },
    [lessonId]
  );

  const completeStage = useCallback(
    async (stage: LessonPathStage) => {
      const next = await markLessonPathStageCompletedSmart(
        lessonId,
        stage.id,
        allStageIds
      );
      setProgress(next);
      setJustCompleted(true);

      const allDone = allLessonPathStagesCompleted(next, allStageIds);
      if (allDone) {
        await markLessonCompletedSmart(lessonId);
        setShowCelebration(true);
        window.setTimeout(() => setShowCelebration(false), 1000);
      }

      const stageIdx = plan.stages.findIndex((s) => s.id === stage.id);
      const nextStage = plan.stages[stageIdx + 1];

      window.setTimeout(() => {
        setJustCompleted(false);
        if (nextStage) {
          openStage(nextStage, false);
        } else {
          goToHub();
        }
      }, allDone ? 1000 : 700);
    },
    [lessonId, allStageIds, plan.stages, openStage, goToHub]
  );

  const handleFinishStage = useCallback(() => {
    if (!activeStage) return;
    if (activeStage.id === "quiz") return;
    void completeStage(activeStage);
  }, [activeStage, completeStage]);

  const warmupStage = plan.stages.find((s) => s.id === "goal_warmup");

  const handleIntroStart = useCallback(() => {
    if (warmupStage) {
      void completeStage(warmupStage);
    } else {
      const first = plan.stages[0];
      if (first) openStage(first, false);
    }
  }, [warmupStage, completeStage, plan.stages, openStage]);

  const handleRegisterPracticeFooter = useCallback(
    (meta: PathExerciseFooterMeta | null) => {
      setPracticeFooter(meta);
      practiceFooterActionRef.current = meta?.onAction ?? null;
    },
    []
  );

  const handlePracticeFooterClick = useCallback(() => {
    if (!practiceFooter || practiceFooter.disabled) return;
    if (practiceFooter.action === "finish-stage") {
      handleFinishStage();
      return;
    }
    practiceFooterActionRef.current?.();
  }, [practiceFooter, handleFinishStage]);

  const handleQuizFinished = useCallback(() => {
    if (activeStage) {
      void completeStage(activeStage);
    }
  }, [activeStage, completeStage]);

  function renderStageContent(stage: LessonPathStage, pathPlan: LessonPathPlan) {
    const finishModuleStage = () => {
      handleFinishStage();
    };

    switch (stage.id) {
      case "goal_warmup":
        return (
          <LessonPathWarmupStage
            lesson={lesson}
            plan={pathPlan}
            onStart={handleFinishStage}
            showWarmupModules
            deep={deep}
          />
        );
      case "vocabulary":
        return (
          <>
            {moduleHasContent(lesson, "vocabulary") ? (
              <VocabularyCard
                lessonId={lessonId}
                lesson={lesson}
                deep={deep}
                onDone={finishModuleStage}
              />
            ) : null}
            {moduleHasContent(lesson, "characters") ? (
              <CharactersModule
                lessonId={lessonId}
                lesson={lesson}
                deep={deep}
                onDone={finishModuleStage}
              />
            ) : null}
          </>
        );
      case "text":
        return (
          <TextsModule
            lesson={lesson}
            timedSubtitles={lessonContent.timedSubtitles}
            onDone={finishModuleStage}
          />
        );
      case "grammar":
        return (
          <GrammarModule
            lessonId={lessonId}
            lesson={lesson}
            deep={deep}
            onDone={finishModuleStage}
          />
        );
      case "practice":
        return pathPlan.practiceSource ? (
          <ExercisesModule
            key={`practice-${pathPlan.practiceSource}`}
            lessonId={lessonId}
            lesson={lesson}
            source={pathPlan.practiceSource}
            active
            embeddedInPath
            onRegisterPathFooter={handleRegisterPracticeFooter}
            onDone={finishModuleStage}
          />
        ) : null;
      case "quiz":
        return (
          <LessonPathQuizStage
            key="lesson-path-quiz"
            lessonId={lessonId}
            lesson={lessonContent}
            quizQuestions={quizQuestions}
            useDatabaseQuizOptions={useDatabaseQuizOptions}
            onFinished={handleQuizFinished}
          />
        );
      case "summary":
        return (
          <LessonPathSummaryStage
            lessonId={lessonId}
            lesson={lesson}
            courseId={lessonContent.courseId}
            nextLessonId={nextLessonId}
            adminPreview={adminPreview}
            quizTotal={quizQuestions.length}
          />
        );
      default:
        return null;
    }
  }

  const isPracticeStage = activeStage?.id === "practice";
  const showStageFinishChip =
    activeStage &&
    activeStage.id !== "quiz" &&
    activeStage.id !== "summary" &&
    activeStage.id !== "goal_warmup";
  const showPracticeStageFooter = isPracticeStage && practiceFooter != null;

  /* ---- PC (≥920px) хажуугийн самбарууд — утсан дээр CSS-ээр нуугдана (lesson-player.css .bs-lp-*) ---- */
  const firstIncompleteIndex = plan.stages.findIndex(
    (s) => !progress.completedStageIds.includes(s.id)
  );
  const deskNav = (
    <aside className="bs-lp-nav" aria-label="Хичээлийн үеүүд">
      <div className="bs-lp-nav-head">
        <p className="bs-lp-nav-kicker">{lesson.level} · {lesson.lesson_number}-р хичээл</p>
        <p className="bs-lp-nav-title" translate="no">{lesson.title.mn}</p>
        <p className="bs-lp-nav-zh" translate="no">{lesson.title.zh}</p>
        <div className="bs-progress" style={{ margin: "10px 0 0" }}>
          <span
            style={{
              width: `${plan.stages.length ? (progress.completedStageIds.length / plan.stages.length) * 100 : 0}%`,
            }}
          />
        </div>
        <p className="bs-lp-nav-meta">
          {progress.completedStageIds.length}/{plan.stages.length} үе дууссан
        </p>
      </div>
      <button type="button" className="bs-lp-nav-item" onClick={goToHub}>
        <span className="bs-lp-nav-dot">☰</span>
        <span className="bs-lp-nav-label">Хичээлийн зам</span>
      </button>
      {plan.stages.map((stage, index) => {
        const done = progress.completedStageIds.includes(stage.id);
        const active = view === "stage" && activeStage?.id === stage.id;
        const skippedAhead = firstIncompleteIndex >= 0 && index > firstIncompleteIndex;
        return (
          <button
            key={stage.id}
            type="button"
            className={`bs-lp-nav-item${active ? " bs-lp-nav-item--on" : ""}${done ? " bs-lp-nav-item--done" : ""}`}
            onClick={() => openStage(stage, skippedAhead)}
            aria-current={active ? "step" : undefined}
          >
            <span className="bs-lp-nav-dot">{done ? "✓" : stage.number}</span>
            <span className="bs-lp-nav-label">
              {stage.label}
              <small>{stage.minutes} мин · {stage.hint}</small>
            </span>
          </button>
        );
      })}
    </aside>
  );
  const deskVocab = (
    <aside className="bs-lp-vocab" aria-label="Энэ хичээлийн үгс">
      <div className="bs-lp-vocab-head">
        <span>Энэ хичээлийн үгс</span>
        <span className="bs-lp-vocab-count">{lesson.vocabulary.length}</span>
      </div>
      <ul className="bs-lp-vocab-list">
        {lesson.vocabulary.map((w) => (
          <li key={w.id} className="bs-lp-vocab-row" translate="no">
            <span className="bs-lp-vocab-zh">{w.zh}</span>
            <span className="bs-lp-vocab-body">
              <span className="bs-lp-vocab-py">{w.pinyin}{w.pos ? ` · ${w.pos}` : ""}</span>
              <span className="bs-lp-vocab-mn">{w.meaning_mn ?? w.mn}</span>
            </span>
            <SpeakButton text={w.zh} />
          </li>
        ))}
      </ul>
    </aside>
  );
  const withDesk = (node: ReactNode) => (
    <div className="bs-lp-grid">
      {deskNav}
      {node}
      {deskVocab}
    </div>
  );

  if (!hydrated) {
    return (
      <div className="bs-root">
        <p className="py-16 text-center text-sm text-[var(--bs-muted)]">
          Хичээл ачаалж байна...
        </p>
      </div>
    );
  }

  if (view === "intro") {
    return withDesk(
      <div className="bs-root">
        <div className="bs-topbar">
          <button
            type="button"
            className="bs-iconbtn"
            onClick={() => onExit?.()}
            aria-label="Буцах"
          >
            ←
          </button>
          <div className="bs-ttl">
            <h1>{lesson.level} · {lesson.lesson_number}-р хичээл</h1>
            <p translate="no">{lesson.title.mn}</p>
          </div>
        </div>
        <LessonPathWarmupStage
          lesson={lesson}
          plan={plan}
          onStart={handleIntroStart}
        />
      </div>
    );
  }

  if (view === "hub" || !activeStage) {
    return withDesk(
      <div className="bs-root">
        <LessonPathHub
          lesson={lesson}
          plan={plan}
          progress={progress}
          onSelectStage={openStage}
          onExit={onExit}
        />
      </div>
    );
  }

  return withDesk(
    <div className="bs-root bs-path-active">
      <div className="bs-path-stage-header">
        <button
          type="button"
          className="bs-iconbtn"
          onClick={goToHub}
          aria-label="Зам руу буцах"
        >
          ←
        </button>
        <div className="bs-path-stage-title">
          <span className="bs-path-stage-name">
            {activeStage.number}-р үе · {activeStage.label}
          </span>
          <div className="bs-path-dots" aria-label="Үеийн явц">
            {plan.stages.map((s, i) => (
              <span
                key={s.id}
                className={
                  i < activeIndex
                    ? "bs-path-dot bs-path-dot--done"
                    : i === activeIndex
                      ? "bs-path-dot bs-path-dot--active"
                      : "bs-path-dot"
                }
                aria-hidden
              />
            ))}
          </div>
        </div>
        {showStageFinishChip ? (
          <button
            type="button"
            className="bs-path-finish-chip"
            onClick={handleFinishStage}
            aria-label="Үе дуусгах"
          >
            Үе дуусгах
          </button>
        ) : null}
      </div>

      {skipWarning ? (
        <p className="bs-path-skip-hint" role="status">
          {skipWarning}
        </p>
      ) : null}

      {justCompleted ? (
        <div className="bs-path-complete-toast" aria-live="polite">
          ✓ Үе дууслаа
        </div>
      ) : null}

      {showCelebration ? (
        <div className="bs-path-celebration" aria-hidden>
          ✨
        </div>
      ) : null}

      <div className="bs-path-stage-content" key={activeStage.id}>
        {renderStageContent(activeStage, plan)}
      </div>

      {showPracticeStageFooter && practiceFooter ? (
        <div className="bs-path-footer bs-path-footer--practice">
          <button
            type="button"
            className={`bs-cta bs-path-footer-cta bs-path-practice-footer-cta${
              practiceFooter.action === "finish-stage"
                ? " bs-path-practice-footer-cta--finish"
                : ""
            }`}
            onClick={handlePracticeFooterClick}
            disabled={practiceFooter.disabled}
          >
            {practiceFooter.label}
          </button>
        </div>
      ) : null}
    </div>
  );
}
