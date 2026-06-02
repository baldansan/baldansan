"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { MotionCard } from "@/components/motion/motion-pressable";
import { RevealItem, RevealStagger } from "@/components/motion/reveal";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";
import { ModuleCard } from "./shared/module-card";
import { LESSON_MODULE } from "./shared/module-theme";
import { TeacherSpeechBubble } from "./shared/teacher-speech-bubble";

type Props = {
  lesson: LessonContent;
  words: VocabularyWord[];
  title?: string;
  teacherNote?: string;
  mediaSlot?: ReactNode;
  footerCta?: { label: string; href: string };
};

function VocabWordCard({
  word,
  lesson,
  expanded,
  onToggle,
}: {
  word: VocabularyWord;
  lesson: LessonContent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId, hskLevel: word.hskLevel });

  return (
    <MotionCard
      as="button"
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl p-4 text-left transition-colors"
      style={{
        backgroundColor: expanded ? LESSON_MODULE.primaryMuted : LESSON_MODULE.background,
        border: `1px solid ${expanded ? `${LESSON_MODULE.primary}40` : LESSON_MODULE.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {word.pinyin ? (
            <p
              className="text-sm font-medium"
              style={{ color: LESSON_MODULE.textSubtle }}
            >
              {word.pinyin}
            </p>
          ) : null}
          <p
            className="zh mt-0.5 text-4xl font-bold leading-none tracking-tight"
            style={{ color: LESSON_MODULE.text }}
          >
            {word.chinese}
          </p>
          <p
            className="mt-2 text-base leading-snug"
            style={{ color: LESSON_MODULE.textMuted }}
          >
            {word.mongolian}
          </p>
          {expanded && word.exampleChinese ? (
            <p
              className="zh mt-3 rounded-xl px-3 py-2 text-sm leading-relaxed"
              style={{
                backgroundColor: LESSON_MODULE.surface,
                color: LESSON_MODULE.textMuted,
              }}
            >
              {word.exampleChinese}
            </p>
          ) : null}
        </div>
        {containsTargetScript(word.chinese) ? (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <SpeakerButton
              text={word.chinese}
              lang={lang}
              courseId={lesson.courseId}
              hskLevel={word.hskLevel}
              audioUrl={word.audioUrl}
              size="md"
              stopPropagation
            />
          </div>
        ) : null}
      </div>
    </MotionCard>
  );
}

export function VocabularyModule({
  lesson,
  words,
  title = "Үгийн сан",
  teacherNote,
  mediaSlot,
  footerCta,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    words[0]?.id ?? words[0]?.chinese ?? null
  );

  return (
    <ModuleCard className="space-y-5">
      <div>
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: LESSON_MODULE.primaryDark }}
        >
          {title}
        </p>
        <p className="mt-1 text-sm" style={{ color: LESSON_MODULE.textMuted }}>
          Картаар дарж жишээ өгүүлбэр харна · 🔊 дуу сонсоно
        </p>
      </div>

      {teacherNote ? (
        <TeacherSpeechBubble>{teacherNote}</TeacherSpeechBubble>
      ) : null}

      {mediaSlot}

      {words.length === 0 ? (
        <p className="text-sm" style={{ color: LESSON_MODULE.textMuted }}>
          Үгийн сан хараахан байхгүй.
        </p>
      ) : (
        <RevealStagger className="space-y-3">
          {words.map((word) => {
            const key = word.id || word.chinese;
            return (
              <RevealItem key={key}>
                <VocabWordCard
                  word={word}
                  lesson={lesson}
                  expanded={expandedId === key}
                  onToggle={() =>
                    setExpandedId((current) => (current === key ? null : key))
                  }
                />
              </RevealItem>
            );
          })}
        </RevealStagger>
      )}

      {footerCta ? (
        <Link
          href={footerCta.href}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: LESSON_MODULE.primary }}
        >
          {footerCta.label}
        </Link>
      ) : null}
    </ModuleCard>
  );
}
