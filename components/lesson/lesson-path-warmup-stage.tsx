"use client";

import DialoguesModule from "@/components/lesson/modules/DialoguesModule";
import PronunciationModule from "@/components/lesson/modules/PronunciationModule";
import type { LessonPathPlan } from "@/lib/lesson/build-lesson-path";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";

type Props = {
  lesson: HskLessonPackage;
  plan: LessonPathPlan;
};

function count<T>(arr: T[] | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

export function LessonPathWarmupStage({ lesson, plan }: Props) {
  const vocabN = count(lesson.vocabulary);
  const textN = count(lesson.texts);
  const grammarN = count(lesson.grammar);

  return (
    <div className="bs-path-warmup">
      <div className="bs-card bs-hero">
        <h2>
          {lesson.level} · Сэдэв: {lesson.theme.mn}
        </h2>
        <div className="bs-zh-title">{lesson.title.zh}</div>
        <div className="bs-mn-title">{lesson.title.mn}</div>
        {lesson.title.pinyin ? (
          <div className="bs-py">{lesson.title.pinyin}</div>
        ) : null}

        <div className="bs-teacher">
          <div className="bs-mascot">🐫</div>
          <div>
            <div className="bs-who">Тэмээ багш</div>
            <p>{lesson.hook.teacher_mn}</p>
          </div>
        </div>

        {lesson.hook.warmup_mn ? (
          <div className="bs-path-warmup-block">
            <div className="bs-label">
              <span className="bs-dot" />
              Халаалт
            </div>
            <p>{lesson.hook.warmup_mn}</p>
          </div>
        ) : null}

        <div className="bs-learn-title">Энэ хичээлээр юу сурах вэ?</div>
        <div className="bs-chips">
          {vocabN > 0 ? (
            <span className="bs-chip">
              <span className="bs-n">{vocabN}</span> шинэ үг
            </span>
          ) : null}
          {textN > 0 ? (
            <span className="bs-chip">
              <span className="bs-n">{textN}</span> богино эх
            </span>
          ) : null}
          {grammarN > 0 ? (
            <span className="bs-chip">
              <span className="bs-n">{grammarN}</span> дүрэм
            </span>
          ) : null}
        </div>
      </div>

      {plan.warmupExtras.includes("dialogues") ? (
        <DialoguesModule lesson={lesson} onDone={() => {}} />
      ) : null}
      {plan.warmupExtras.includes("pronunciation") ? (
        <PronunciationModule lesson={lesson} onDone={() => {}} />
      ) : null}
    </div>
  );
}
