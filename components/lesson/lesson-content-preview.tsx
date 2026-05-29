"use client";

import { SpeakerButton } from "@/components/tts/speaker-button";
import { romanizationLabel } from "@/lib/course-display";
import { resolveTtsLang } from "@/lib/tts/infer-lang";
import type { SubtitleExample, VocabularyWord } from "@/types/lesson";

type SubtitleProps = {
  lines: SubtitleExample[];
  courseId: string;
};

export function LessonSubtitlePreviewSection({ lines, courseId }: SubtitleProps) {
  const lang = resolveTtsLang({ courseId });
  const romLabel = romanizationLabel(courseId);

  return (
    <div className="flex flex-col gap-3">
      {lines.map((line) => (
        <div
          key={line.chinese}
          className="rounded-[16px] border border-emerald-100 bg-emerald-50/50 p-3.5"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug text-[var(--app-text)]">
                {line.chinese}
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {romLabel}: {line.pinyin}
              </p>
              <p className="mt-1.5 text-sm text-[var(--app-muted)]">
                {line.mongolian}
              </p>
            </div>
            <SpeakerButton text={line.chinese} lang={lang} size="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

type VocabProps = {
  words: VocabularyWord[];
  courseId: string;
};

export function LessonVocabPreviewSection({ words, courseId }: VocabProps) {
  const romLabel = romanizationLabel(courseId);

  return (
    <ul className="flex flex-col gap-2.5">
      {words.map((word) => {
        const lang = resolveTtsLang({ courseId, hskLevel: word.hskLevel });
        return (
          <li
            key={word.id || word.chinese}
            className="rounded-[16px] border border-[var(--app-border)] bg-slate-50/80 p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-[var(--app-text)]">
                  {word.chinese}
                </p>
                <p className="mt-0.5 truncate text-xs text-emerald-700">
                  {romLabel}: {word.pinyin}
                </p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {word.mongolian}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <SpeakerButton
                  text={word.chinese}
                  lang={lang}
                  hskLevel={word.hskLevel}
                  size="sm"
                />
                {word.exampleChinese ? (
                  <SpeakerButton
                    text={word.exampleChinese}
                    lang={lang}
                    hskLevel={word.hskLevel}
                    size="sm"
                    label={`Жишээ уншуулах: ${word.exampleChinese}`}
                  />
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
