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
  HskFlashcardVocabularyStudy,
  HskMediaImage,
} from "@/components/lesson/hsk-flashcard-vocabulary-study";
import {
  isHsk1FoundationLesson,
  parseHskStudyContentFromLesson,
  type HskStudyContent,
} from "@/lib/lesson/hsk-lesson-content";
import {
  findHskMediaBySection,
  resolveHskMediaUrl,
} from "@/lib/lesson/hsk-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { LessonContent } from "@/types/lesson-content";

const EMPTY_SECTION =
  "Энэ хэсгийн мэдээлэл package-д хараахан ороогүй байна.";

const TONE_ARROWS = ["→", "↗", "↘↗", "↘"] as const;

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

function HeroLessonCard({
  lesson,
  content,
  adminPreview,
}: {
  lesson: LessonContent;
  content: HskStudyContent;
  adminPreview: boolean;
}) {
  const heroImage = findHskMediaBySection(content.media, "hero");
  const heroUrl = resolveHskMediaUrl(heroImage);
  const hskBadge = content.hskLevel ? `HSK${content.hskLevel}` : "HSK";
  const duration = lesson.duration?.trim() || "5–10 мин";

  const watchHref = lessonPreviewPath(lesson.id, { adminPreview, subpath: "watch" });
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  return (
    <SectionCard className="overflow-hidden !p-0 ring-emerald-200">
      <HskMediaImage
        src={heroUrl}
        alt={lesson.title}
        className="rounded-none rounded-t-2xl"
      />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            {hskBadge}
          </span>
          <span className="text-xs text-slate-500">{duration}</span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{lesson.title}</h2>
        {lesson.chineseTitle ? (
          <p className="mt-0.5 text-base text-slate-600">{lesson.chineseTitle}</p>
        ) : null}
        <CtaButtonRow className="mt-4 !gap-2">
          <Link href={watchHref} className={ctaPrimaryClass}>
            Хичээл судлах
          </Link>
          <Link href={vocabHref} className={ctaSecondaryClass}>
            Үгийн сан
          </Link>
          <Link href={quizHref} className={ctaOutlineClass}>
            Quiz өгөх
          </Link>
        </CtaButtonRow>
      </div>
    </SectionCard>
  );
}

function TeacherExplanationCard({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <SectionCard className="border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/50 ring-amber-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        Багшийн тайлбар
      </p>
      <div className="mt-3 space-y-3">
        {notes.map((note) => (
          <p key={note} className="text-sm leading-7 text-slate-800">
            &ldquo;{note}&rdquo;
          </p>
        ))}
      </div>
    </SectionCard>
  );
}

function PinyinSection({
  lesson,
  content,
}: {
  lesson: LessonContent;
  content: HskStudyContent;
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });
  const romLabel = romanizationLabel(lesson.courseId);
  const pinyinImage = findHskMediaBySection(content.media, "pinyin");
  const pinyinUrl = resolveHskMediaUrl(pinyinImage);
  const lines = [...content.pinyinIntro, ...content.pronunciationNotes];

  if (lines.length === 0 && !pinyinUrl) return <EmptySection />;

  return (
    <div className="space-y-3">
      {lines.length > 0 ? (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li
              key={line}
              className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/60 px-3 py-2.5 ring-1 ring-emerald-100"
            >
              <span className="text-base font-medium text-slate-900">{line}</span>
              {containsTargetScript(line) ? (
                <SpeakerButton
                  text={line.replace(/[^\u4e00-\u9fff]+/g, "").trim() || line}
                  lang={lang}
                  courseId={lesson.courseId}
                  size="sm"
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {pinyinUrl ? (
        <HskMediaImage src={pinyinUrl} alt={`${romLabel} зураг`} />
      ) : null}
      <p className="text-xs text-slate-500">
        {romLabel} — Монгол дуудлага: эхлээд сонсоод, дараа нь дуурайж хэлээрэй.
      </p>
    </div>
  );
}

function ToneSection({ content }: { content: HskStudyContent }) {
  const toneImage = findHskMediaBySection(content.media, "tone");
  const toneUrl = resolveHskMediaUrl(toneImage);
  const tones =
    content.tones.length > 0
      ? content.tones
      : [1, 2, 3, 4].map((num, index) => ({
          label: `${num}-р өнгө`,
          example: ["mā", "má", "mǎ", "mà"][index],
          pinyin: ["mā", "má", "mǎ", "mà"][index],
          mongolian: ["өндөр, тэгш", "дээшлэх", "доошлоод дээшлэх", "огцом буух"][
            index
          ],
        }));

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {tones.map((tone, index) => (
          <div
            key={`${tone.label}-${tone.example}`}
            className="rounded-xl bg-emerald-50 px-3 py-3 ring-1 ring-emerald-100"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-emerald-800">{tone.label}</p>
              <span className="text-lg text-emerald-600" aria-hidden>
                {TONE_ARROWS[index] ?? "→"}
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900">{tone.example}</p>
            {tone.mongolian ? (
              <p className="mt-1 text-sm text-slate-600">{tone.mongolian}</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
        {["mā", "má", "mǎ", "mà"].map((sample) => (
          <span
            key={sample}
            className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100"
          >
            {sample}
          </span>
        ))}
      </div>
      {toneUrl ? <HskMediaImage src={toneUrl} alt="Өнгийн диаграм" /> : null}
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
  const dialogueImage = findHskMediaBySection(content.media, "dialogue");
  const dialogueUrl = resolveHskMediaUrl(dialogueImage);

  if (content.dialogues.length === 0) return <EmptySection />;

  return (
    <div className="flex flex-col gap-3">
      {dialogueUrl ? (
        <HskMediaImage src={dialogueUrl} alt="Харилцан яриа" />
      ) : null}
      {content.dialogues.map((dialogue, index) => (
        <div key={`${dialogue.title ?? "dialogue"}-${index}`} className="space-y-2">
          {dialogue.title ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {dialogue.title}
            </p>
          ) : null}
          {dialogue.lines.map((line, lineIndex) => {
            const isLeft = lineIndex % 2 === 0;
            return (
              <div
                key={`${line.chinese}-${lineIndex}`}
                className={`flex ${isLeft ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={
                    isLeft
                      ? "max-w-[85%] rounded-2xl rounded-bl-md bg-emerald-50 px-3.5 py-3 ring-1 ring-emerald-100"
                      : "max-w-[85%] rounded-2xl rounded-br-md bg-white px-3.5 py-3 ring-1 ring-slate-200"
                  }
                >
                  {line.speaker ? (
                    <p className="text-xs font-bold text-slate-500">{line.speaker}</p>
                  ) : (
                    <p className="text-xs font-bold text-slate-400">
                      {isLeft ? "A" : "B"}
                    </p>
                  )}
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-900">
                        {line.chinese}
                      </p>
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
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PracticeActivityCards({
  lesson,
  adminPreview,
}: {
  lesson: LessonContent;
  adminPreview: boolean;
}) {
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  const activities = [
    { label: "Сонсоод давт", href: vocabHref, icon: "🔊" },
    { label: "Pinyin сонго", href: quizHref, icon: "✏️" },
    { label: "Ханз тань", href: vocabHref, icon: "字" },
    { label: "Богино quiz", href: quizHref, icon: "📝" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {activities.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-emerald-200"
        >
          <span className="text-xl" aria-hidden>
            {item.icon}
          </span>
          <span className="text-xs font-semibold text-slate-800">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

function HskSectionDebugPanel({
  debug,
  vocabularyCount,
}: {
  debug: NonNullable<HskStudyContent["sectionDebug"]>;
  vocabularyCount: number;
}) {
  const rows = [
    ["1. objectives", debug.objectives],
    ["2. pinyin", debug.pinyin],
    ["3. tones", debug.tones],
    ["4. vocabulary", { source: "vocabulary_words", count: vocabularyCount }],
    ["5. dialogues", debug.dialogues],
    ["6. sentences", debug.sentenceExplanations],
    ["7. characters", debug.characterNotes],
    ["8. study guide", debug.studyGuideSteps],
    ["9. teacher notes", debug.teacherNotes],
  ] as const;

  return (
    <SectionCard className="border-dashed border-amber-300 bg-amber-50/50 ring-amber-100">
      <h2 className="text-sm font-semibold text-amber-900">HSK section mapping (dev)</h2>
      <div className="mt-2 space-y-1.5 text-xs text-amber-950">
        {rows.map(([label, meta]) => (
          <div key={label} className="rounded-lg bg-white/80 px-2.5 py-1.5 ring-1 ring-amber-100">
            <span className="font-semibold">{label}</span>
            <span className="text-amber-800"> — source: </span>
            <span className="break-all">{meta.source}</span>
            <span className="text-amber-800"> · count: {meta.count}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function HskLessonStudyContent({
  lesson,
  adminPreview = false,
  showBottomCtas = true,
}: Props) {
  const content = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);

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
      <HeroLessonCard lesson={lesson} content={content} adminPreview={adminPreview} />

      <TeacherExplanationCard notes={content.teacherNotes} />

      {content.objectives.length > 0 ? (
        <HskSection title="Хичээлийн зорилго" collapsible defaultOpen={false}>
          <ul className="space-y-2 text-sm leading-6 text-slate-700">
            {content.objectives.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-emerald-50/60 px-3 py-2 ring-1 ring-emerald-100"
              >
                {item}
              </li>
            ))}
          </ul>
        </HskSection>
      ) : null}

      <HskSection title="Pinyin ба дуудлага">
        <PinyinSection lesson={lesson} content={content} />
      </HskSection>

      <HskSection title="Өнгө / Tone">
        <ToneSection content={content} />
      </HskSection>

      <HskSection title="Үгийн сан">
        {lesson.vocabulary.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Нэг нэгээр картаар сур — урт жагсаалт биш, товч алхам.
            </p>
            <HskFlashcardVocabularyStudy
              lesson={lesson}
              vocabulary={lesson.vocabulary}
              adminPreview={adminPreview}
              compact
            />
            <Link
              href={vocabHref}
              className="block text-center text-sm font-medium text-emerald-700 hover:underline"
            >
              Бүтэн үгийн сан →
            </Link>
          </div>
        ) : (
          <EmptySection />
        )}
      </HskSection>

      <HskSection title="Богино яриа" collapsible>
        <DialogueBlock lesson={lesson} content={content} />
      </HskSection>

      {content.characterNotes.length > 0 ? (
        <HskSection title="Ханз / бичих суурь" collapsible defaultOpen={false}>
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
              </div>
            ))}
          </div>
        </HskSection>
      ) : null}

      <HskSection title="Практик дадлага">
        <PracticeActivityCards lesson={lesson} adminPreview={adminPreview} />
      </HskSection>

      {showBottomCtas ? (
        <SectionCard className="ring-emerald-100">
          <h2 className="text-base font-semibold text-emerald-800">Дараагийн алхам</h2>
          <CtaButtonRow className="mt-3 !gap-2">
            <Link href={quizHref} className={ctaPrimaryClass}>
              Quiz өгөх
            </Link>
            <Link href={vocabHref} className={ctaSecondaryClass}>
              Үгийн сан руу буцах
            </Link>
            <Link
              href={lessonPreviewPath(lesson.id, { adminPreview })}
              className={ctaOutlineClass}
            >
              {LEARNER_LESSON.backToLesson}
            </Link>
          </CtaButtonRow>
        </SectionCard>
      ) : null}

      {content.sectionDebug ? (
        <HskSectionDebugPanel
          debug={content.sectionDebug}
          vocabularyCount={lesson.vocabulary.length}
        />
      ) : null}
    </div>
  );
}
