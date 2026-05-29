"use client";

import { SpeakerButton } from "@/components/tts/speaker-button";
import { resolveTtsLang } from "@/lib/tts/infer-lang";
import type { SubtitleExample, VocabularyWord } from "@/types/lesson";

type SubtitleProps = {
  lines: SubtitleExample[];
  courseId: string;
};

export function LessonSubtitlePreviewSection({ lines, courseId }: SubtitleProps) {
  const lang = resolveTtsLang({ courseId });

  return (
    <div className="mt-4 flex flex-col gap-4">
      {lines.map((line) => (
        <div
          key={line.chinese}
          className="rounded-xl bg-emerald-50/50 p-4 ring-1 ring-emerald-100"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-slate-900">{line.chinese}</p>
              <p className="mt-1 text-sm text-emerald-700">{line.pinyin}</p>
              <p className="mt-2 text-sm text-slate-600">{line.mongolian}</p>
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
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {words.map((word) => {
        const lang = resolveTtsLang({ courseId, hskLevel: word.hskLevel });
        return (
          <li
            key={word.id || word.chinese}
            className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-slate-900">
                  {word.chinese}{" "}
                  <span className="font-normal text-emerald-700">/ {word.pinyin}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">{word.mongolian}</p>
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
