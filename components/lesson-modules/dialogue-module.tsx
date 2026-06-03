"use client";

import type { ReactNode } from "react";
import { RevealItem, RevealStagger } from "@/components/motion/reveal";
import { SpeakerButton } from "@/components/tts/speaker-button";
import type { HskDialogueLine } from "@/lib/lesson/hsk-lesson-content";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { LessonContent } from "@/types/lesson-content";
import { ModuleCard } from "./shared/module-card";
import { LESSON_MODULE } from "./shared/module-theme";
import { TeacherSpeechBubble } from "./shared/teacher-speech-bubble";

type Props = {
  lesson: LessonContent;
  lines: HskDialogueLine[];
  title?: string;
  teacherNote?: string;
  mediaSlot?: ReactNode;
};

function resolveSpeakerSide(
  speaker: string | undefined,
  index: number
): "left" | "right" {
  if (!speaker?.trim()) {
    return index % 2 === 0 ? "left" : "right";
  }
  const s = speaker.trim().toLowerCase();
  if (/^b\b|^б\b|2|乙/.test(s)) return "right";
  return "left";
}

function DialogueBubble({
  line,
  side,
  lesson,
}: {
  line: HskDialogueLine;
  side: "left" | "right";
  lesson: LessonContent;
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });
  const isLeft = side === "left";

  return (
    <div className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
      <div
        className="max-w-[88%] rounded-2xl px-4 py-3"
        style={{
          backgroundColor: isLeft ? LESSON_MODULE.primaryMuted : LESSON_MODULE.surface,
          border: isLeft ? "none" : `1px solid ${LESSON_MODULE.border}`,
          boxShadow: isLeft ? "none" : LESSON_MODULE.shadow,
          borderTopLeftRadius: isLeft ? "6px" : undefined,
          borderTopRightRadius: !isLeft ? "6px" : undefined,
        }}
      >
        {line.speaker ? (
          <p
            className="mb-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: LESSON_MODULE.textSubtle }}
          >
            {line.speaker}
          </p>
        ) : null}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {line.pinyin ? (
              <p
                className="text-xs font-medium leading-snug"
                style={{ color: LESSON_MODULE.textSubtle }}
              >
                {line.pinyin}
              </p>
            ) : null}
            <p
              className="zh text-lg font-semibold leading-snug"
              style={{ color: LESSON_MODULE.text }}
            >
              {line.chinese}
            </p>
            {line.mongolian ? (
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ color: LESSON_MODULE.textMuted }}
              >
                {line.mongolian}
              </p>
            ) : null}
          </div>
          {containsTargetScript(line.chinese) ? (
            <SpeakerButton
              text={line.chinese}
              lang={lang}
              courseId={lesson.courseId}
              size="sm"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DialogueModule({
  lesson,
  lines,
  title = "Богино яриа",
  teacherNote,
  mediaSlot,
}: Props) {
  return (
    <ModuleCard className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: LESSON_MODULE.text }}>
          {title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: LESSON_MODULE.textMuted }}>
          Яриаг уншаад, мөр бүрээр дуу сонсоорой
        </p>
      </div>

      {teacherNote ? (
        <TeacherSpeechBubble>{teacherNote}</TeacherSpeechBubble>
      ) : null}

      {mediaSlot}

      <RevealStagger className="space-y-3 pt-1">
        {lines.map((line, index) => (
          <RevealItem key={`${line.chinese}-${index}`}>
            <DialogueBubble
              line={line}
              side={resolveSpeakerSide(line.speaker, index)}
              lesson={lesson}
            />
          </RevealItem>
        ))}
      </RevealStagger>
    </ModuleCard>
  );
}
