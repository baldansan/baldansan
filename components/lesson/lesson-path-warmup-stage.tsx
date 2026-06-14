"use client";

import DialoguesModule from "@/components/lesson/modules/DialoguesModule";
import PronunciationModule from "@/components/lesson/modules/PronunciationModule";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import type { LessonPathPlan } from "@/lib/lesson/build-lesson-path";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";

type Props = {
  lesson: HskLessonPackage;
  plan: LessonPathPlan;
  onStart?: () => void;
  /** Full warmup stage: dialogues / pronunciation modules after intro */
  showWarmupModules?: boolean;
};

function count<T>(arr: T[] | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

function countUnknown(arr: unknown): number {
  return Array.isArray(arr) ? arr.length : 0;
}

export function LessonPathWarmupStage({
  lesson,
  plan,
  onStart,
  showWarmupModules = false,
}: Props) {
  const vocabN = count(lesson.vocabulary);
  const grammarN = count(lesson.grammar);
  const dialogueN = count(lesson.dialogues);
  const exerciseN =
    countUnknown(lesson.exercises_workbook) +
    countUnknown(lesson.exercises_textbook);
  const warmWords = (lesson.vocabulary ?? []).slice(0, 3);

  const goals: { icon: string; bg: string; title: string; sub: string }[] = [];
  if (vocabN > 0) {
    goals.push({
      icon: "💡",
      bg: "#e4f0ff",
      title: `${vocabN} шинэ үг`,
      sub: "Сонсох, унших, бичих",
    });
  }
  if (dialogueN > 0 || plan.warmupExtras.includes("dialogues")) {
    goals.push({
      icon: "🗣️",
      bg: "#e3f7eb",
      title: `${dialogueN || 1} яриа`,
      sub: "Subtitle ба shadowing",
    });
  }
  if (grammarN > 0 || exerciseN > 0) {
    goals.push({
      icon: "🧩",
      bg: "#efe6ff",
      title: "Дүрмийн дасгал",
      sub: `${exerciseN || grammarN} асуулт`,
    });
  }

  return (
    <div className="bs-path-warmup">
      <div className="bs-tm-intro">
        <TemeeEmojiIcon
          variant="teach"
          className="bs-tm-intro-img"
          width={150}
          height={150}
          emojiScale={0.42}
        />
      </div>

      <div className="bs-tm-intro-bubble">
        <p className="bs-tm-intro-bubble-title">
          Сайн уу! Өнөөдөр бид{" "}
          <span className="font-[family-name:var(--font-noto-sc)] text-[#018242]">
            {lesson.title.zh}
          </span>{" "}
          сурна 🌸
        </p>
        <p className="bs-tm-intro-bubble-sub">
          «{lesson.title.mn}» — {lesson.level} {lesson.lesson_number}-р хичээл
        </p>
      </div>

      {goals.length > 0 ? (
        <>
          <p className="bs-tm-sec">🎯 Өнөөдрийн зорилго</p>
          <div className="bs-tm-goal-list">
            {goals.map((goal) => (
              <div key={goal.title} className="bs-tm-goal-item">
                <div
                  className="bs-tm-goal-ic"
                  style={{ background: goal.bg }}
                  aria-hidden
                >
                  {goal.icon}
                </div>
                <div>
                  <div className="bs-tm-goal-title">{goal.title}</div>
                  <div className="bs-tm-goal-sub">{goal.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {warmWords.length > 0 ? (
        <div className="bs-tm-warm">
          <div className="bs-tm-warm-head">🔥 Эхлэхийн өмнө санацгаая</div>
          <div className="bs-tm-warm-words">
            {warmWords.map((word) => (
              <div key={word.id ?? word.zh} className="bs-tm-warm-word">
                <div className="bs-tm-warm-word-zh">{word.zh}</div>
                <div className="bs-tm-warm-word-mn">
                  {word.meaning_mn ?? word.mn}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {onStart ? (
        <button type="button" className="bs-tm-start-btn" onClick={onStart}>
          Эхлэх →
        </button>
      ) : null}

      {showWarmupModules && plan.warmupExtras.includes("dialogues") ? (
        <DialoguesModule lesson={lesson} onDone={() => {}} />
      ) : null}
      {showWarmupModules && plan.warmupExtras.includes("pronunciation") ? (
        <PronunciationModule lesson={lesson} onDone={() => {}} />
      ) : null}
    </div>
  );
}
