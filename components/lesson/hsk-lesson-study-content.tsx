"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { SectionCard } from "@/components/ui/section-card";
import {
  CtaButtonRow,
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { romanizationLabel } from "@/lib/course-display";
import {
  isHsk1FoundationLesson,
  parseHskStudyContentFromLesson,
  type HskStudyContent,
} from "@/lib/lesson/hsk-lesson-content";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { LessonContent } from "@/types/lesson-content";

const EMPTY_SECTION =
  "Энэ хэсгийн мэдээлэл package-д хараахан ороогүй байна.";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
  showBottomCtas?: boolean;
};

function HskSection({
  title,
  children,
  defaultOpen = true,
  collapsible = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <SectionCard className="overflow-hidden ring-emerald-100">
        <h2 className="text-base font-semibold text-emerald-800">{title}</h2>
        <div className="mt-3">{children}</div>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden ring-emerald-100">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h2 className="text-base font-semibold text-emerald-800">{title}</h2>
        <span className="text-sm text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </SectionCard>
  );
}

function EmptySection() {
  return <p className="text-sm leading-6 text-slate-500">{EMPTY_SECTION}</p>;
}

function TextList({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptySection />;
  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-700">
      {items.map((item) => (
        <li key={item} className="rounded-xl bg-emerald-50/60 px-3 py-2 ring-1 ring-emerald-100">
          {item}
        </li>
      ))}
    </ul>
  );
}

function VocabularyCards({
  lesson,
}: {
  lesson: LessonContent;
}) {
  const words = lesson.vocabulary;
  const romLabel = romanizationLabel(lesson.courseId);
  const lang = resolveTtsLang({ courseId: lesson.courseId });

  if (words.length === 0) return <EmptySection />;

  return (
    <div className="flex flex-col gap-2.5">
      {words.map((word) => (
        <div
          key={word.id}
          className="rounded-xl border border-emerald-100 bg-white px-3.5 py-3 shadow-sm"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-slate-900">{word.chinese}</p>
              {word.pinyin ? (
                <p className="mt-0.5 text-sm text-emerald-700">
                  {romLabel}: {word.pinyin}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-slate-700">{word.mongolian}</p>
              {word.mongolianPronunciation ||
              word.pronunciationHintMn ||
              word.pronunciationMn ? (
                <p className="mt-1 text-xs text-slate-500">
                  Дуудлага:{" "}
                  {word.mongolianPronunciation ||
                    word.pronunciationHintMn ||
                    word.pronunciationMn}
                </p>
              ) : null}
            </div>
            {containsTargetScript(word.chinese) ? (
              <SpeakerButton
                text={word.chinese}
                lang={lang}
                courseId={lesson.courseId}
                size="sm"
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function DialogueBlock({
  lesson,
  content,
}: {
  lesson: LessonContent;
  content: HskStudyContent;
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });
  const romLabel = romanizationLabel(lesson.courseId);

  if (content.dialogues.length === 0) return <EmptySection />;

  return (
    <div className="flex flex-col gap-4">
      {content.dialogues.map((dialogue, index) => (
        <div key={`${dialogue.title ?? "dialogue"}-${index}`} className="space-y-2">
          {dialogue.title ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {dialogue.title}
            </p>
          ) : null}
          {dialogue.lines.map((line, lineIndex) => (
            <div
              key={`${line.chinese}-${lineIndex}`}
              className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {line.speaker ? (
                    <p className="text-xs font-bold text-slate-500">{line.speaker}</p>
                  ) : null}
                  <p className="text-base font-semibold text-slate-900">{line.chinese}</p>
                  {line.pinyin ? (
                    <p className="mt-0.5 text-sm text-emerald-700">
                      {romLabel}: {line.pinyin}
                    </p>
                  ) : null}
                  {line.mongolian ? (
                    <p className="mt-1 text-sm text-slate-600">{line.mongolian}</p>
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
          ))}
        </div>
      ))}
    </div>
  );
}

function ToneSection({ content }: { content: HskStudyContent }) {
  if (content.tones.length === 0) return <EmptySection />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {content.tones.map((tone) => (
        <div
          key={`${tone.label}-${tone.pinyin}`}
          className="rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100"
        >
          <p className="text-xs font-semibold uppercase text-emerald-800">
            {tone.label}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{tone.example}</p>
          {tone.pinyin && tone.pinyin !== tone.example ? (
            <p className="text-sm text-emerald-700">{tone.pinyin}</p>
          ) : null}
          {tone.mongolian ? (
            <p className="mt-1 text-sm text-slate-600">{tone.mongolian}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CharacterSection({ content }: { content: HskStudyContent }) {
  if (content.characterNotes.length === 0) return <EmptySection />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {content.characterNotes.map((char) => (
        <div
          key={char.chinese}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3"
        >
          <p className="text-2xl font-bold text-slate-900">{char.chinese}</p>
          {char.pinyin ? (
            <p className="mt-1 text-sm text-emerald-700">{char.pinyin}</p>
          ) : null}
          {char.mongolian ? (
            <p className="mt-1 text-sm text-slate-700">{char.mongolian}</p>
          ) : null}
          {char.strokeNote ? (
            <p className="mt-2 text-xs text-slate-500">{char.strokeNote}</p>
          ) : null}
          {char.mnemonic ? (
            <p className="mt-1 text-xs text-amber-800">{char.mnemonic}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function HskLessonStudyContent({
  lesson,
  adminPreview = false,
  showBottomCtas = true,
}: Props) {
  const content = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const isHsk1 = isHsk1FoundationLesson(lesson);

  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  return (
    <div className="flex flex-col gap-4 pb-4">
      {isHsk1 ? (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
            HSK1 Foundation
          </p>
          <p className="mt-1 text-sm leading-6">
            Багшийн номын дагуу pinyin, өнгө, үг, харилцан яриа, hanз — бүгдийг алхам
            алхмаар судлана.
          </p>
        </div>
      ) : null}

      <HskSection title="1. Хичээлийн зорилго">
        <p className="mb-2 text-sm font-medium text-slate-800">
          Энэ хичээлээр юу сурах вэ?
        </p>
        <TextList items={content.objectives} />
      </HskSection>

      <HskSection title="2. Pinyin ба дуудлага" collapsible>
        {content.pinyinIntro.length > 0 || content.pronunciationNotes.length > 0 ? (
          <TextList
            items={[...content.pinyinIntro, ...content.pronunciationNotes]}
          />
        ) : (
          <EmptySection />
        )}
      </HskSection>

      <HskSection title="3. Өнгө / Tone">
        <ToneSection content={content} />
      </HskSection>

      <HskSection title="4. Үндсэн үгс">
        <VocabularyCards lesson={lesson} />
      </HskSection>

      <HskSection title="5. Харилцан яриа" collapsible>
        <DialogueBlock lesson={lesson} content={content} />
      </HskSection>

      <HskSection title="6. Өгүүлбэрийн тайлбар" collapsible>
        <TextList items={content.sentenceExplanations} />
      </HskSection>

      <HskSection title="7. Ханз / бичих суурь">
        <CharacterSection content={content} />
      </HskSection>

      <HskSection title="8. Дасгал хийх заавар">
        <TextList items={content.studyGuideSteps} />
      </HskSection>

      <HskSection title="9. Багшийн тайлбар" collapsible>
        <TextList items={content.teacherNotes} />
      </HskSection>

      {showBottomCtas ? (
        <div className="mt-2">
          <CtaButtonRow className="!gap-2">
            <Link href={vocabHref} className={ctaPrimaryClass}>
              {LEARNER_LESSON.nextVocabulary}
            </Link>
            <Link href={quizHref} className={ctaSecondaryClass}>
              {LEARNER_LESSON.quiz}
            </Link>
            <Link
              href={lessonPreviewPath(lesson.id, { adminPreview })}
              className={ctaOutlineClass}
            >
              {LEARNER_LESSON.backToLesson}
            </Link>
          </CtaButtonRow>
        </div>
      ) : null}
    </div>
  );
}
