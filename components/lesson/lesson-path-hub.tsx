"use client";

import {
  formatPathDuration,
  formatPathProgress,
  type LessonPathPlan,
  type LessonPathStage,
} from "@/lib/lesson/build-lesson-path";
import {
  getLessonPathStageStatus,
  type LessonPathProgress,
} from "@/lib/lesson/lesson-path-progress";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";

type Props = {
  lesson: HskLessonPackage;
  plan: LessonPathPlan;
  progress: LessonPathProgress;
  onSelectStage: (stage: LessonPathStage, skippedAhead: boolean) => void;
  onExit?: () => void;
};

export function LessonPathHub({
  lesson,
  plan,
  progress,
  onSelectStage,
  onExit,
}: Props) {
  const allIds = plan.stages.map((s) => s.id);
  const completedCount = progress.completedStageIds.length;

  return (
    <div className="bs-path-hub">
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
          <h1>
            {lesson.level} · {lesson.lesson_number}-р хичээл
          </h1>
          <p>{lesson.title.mn}</p>
        </div>
      </div>

      <div className="bs-path-hero">
        <h2 className="bs-path-hero-title">{lesson.title.zh}</h2>
        <p className="bs-path-hero-sub">
          {formatPathProgress(completedCount, plan.stages.length)} ·{" "}
          {formatPathDuration(plan.totalMinutes)}
        </p>
        {lesson.theme?.mn ? (
          <p className="bs-path-theme">Сэдэв: {lesson.theme.mn}</p>
        ) : null}
      </div>

      <div className="bs-path-trail" role="list">
        {plan.stages.map((stage, index) => {
          const status = getLessonPathStageStatus(stage.id, progress, allIds);
          const isLast = index === plan.stages.length - 1;
          const stageIndex = index;
          const firstIncompleteIndex = plan.stages.findIndex(
            (s) => !progress.completedStageIds.includes(s.id)
          );
          const skippedAhead =
            firstIncompleteIndex >= 0 && stageIndex > firstIncompleteIndex;

          return (
            <div key={stage.id} className="bs-path-node-wrap" role="listitem">
              {!isLast ? <span className="bs-path-line" aria-hidden /> : null}
              <button
                type="button"
                className={`bs-path-node bs-path-node--${status}`}
                onClick={() => onSelectStage(stage, skippedAhead)}
              >
                <span className="bs-path-node-icon" aria-hidden>
                  {status === "completed" ? "✓" : stage.icon}
                </span>
                <span className="bs-path-node-body">
                  <span className="bs-path-node-label">
                    {stage.number}-р үе · {stage.label}
                  </span>
                  <span className="bs-path-node-hint">
                    {status === "completed"
                      ? "Дууссан"
                      : status === "current"
                        ? "Үргэлжлүүлэх"
                        : "Эхлээд өмнөхөө дуусга"}
                  </span>
                </span>
                <span className="bs-path-node-go" aria-hidden>
                  {status === "current" ? "▶" : "›"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
