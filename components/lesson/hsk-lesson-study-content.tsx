"use client";

import Link from "next/link";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { SectionCard } from "@/components/ui/section-card";
import {
  CtaButtonRow,
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { romanizationLabel } from "@/lib/course-display";
import { HskMediaImage } from "@/components/lesson/hsk-flashcard-vocabulary-study";
import {
  parseHskStudyContentFromLesson,
  type HskStudyContent,
} from "@/lib/lesson/hsk-lesson-content";
import {
  resolveHskIntroSpeech,
  resolveHskPinyinExplainer,
  resolveHskTeacherAdvice,
  resolveHskWhyImportant,
  resolveHskLessonToneNote,
  resolveKeyVocabularyWords,
} from "@/lib/lesson/hsk-learner-copy";
import {
  findHskMediaBySection,
  resolveHskMediaUrl,
} from "@/lib/lesson/hsk-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { LessonContent } from "@/types/lesson-content";

import {
  HSK_TONE_LEARNER_LABELS,
  parseHskToneItems,
  defaultHskToneItems,
} from "@/lib/lesson/hsk-tone-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
  showBottomCtas?: boolean;
};

function TeacherSpeechBubble({ children }: { children: string }) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 px-4 py-4 ring-1 ring-amber-100">
      <span
        className="absolute -left-1 top-4 h-3 w-3 rotate-45 bg-amber-50 ring-1 ring-amber-100"
        aria-hidden
      />
      <p className="text-sm leading-7 text-slate-800">&ldquo;{children}&rdquo;</p>
    </div>
  );
}

function ToneSection({ content, lessonToneNote }: { content: HskStudyContent; lessonToneNote: string }) {
  const toneImage = findHskMediaBySection(content.media, "tone");
  const toneUrl = resolveHskMediaUrl(toneImage);
  const toneItems = parseHskToneItems(content.tones);
  const tones = toneItems.length > 0 ? toneItems : defaultHskToneItems();

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {tones.map((tone) => (
          <div
            key={`${tone.nameMn}-${tone.example}`}
            className="rounded-xl bg-emerald-50 px-3 py-3 ring-1 ring-emerald-100"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-emerald-800">{tone.nameMn}</p>
              <span className="text-lg text-emerald-600" aria-hidden>
                {tone.motionSymbol}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {HSK_TONE_LEARNER_LABELS.example}
            </p>
            <p className="text-xl font-bold text-slate-900">{tone.example}</p>
            {tone.explanationMn ? (
              <p className="mt-1 text-sm text-slate-600">{tone.explanationMn}</p>
            ) : null}
          </div>
        ))}
      </div>
      <p className="rounded-xl bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-100">
        {lessonToneNote}
      </p>
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
      {toneUrl ? <HskMediaImage src={toneUrl} alt="Хөгний зураглал" /> : null}
    </div>
  );
}

function KeyWordsPreview({
  lesson,
  adminPreview,
}: {
  lesson: LessonContent;
  adminPreview: boolean;
}) {
  const words = resolveKeyVocabularyWords(lesson.vocabulary, 3);
  const lang = resolveTtsLang({ courseId: lesson.courseId });
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });

  if (words.length === 0) {
    return (
      <p className="text-sm text-slate-500">Үгийн сан хараахан ороогүй байна.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {words.map((word) => (
          <div
            key={word.id || word.chinese}
            className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-emerald-100"
          >
            <div className="min-w-0">
              <p className="text-xl font-bold text-slate-900">{word.chinese}</p>
              <p className="text-sm text-emerald-700">{word.pinyin}</p>
              <p className="text-sm text-slate-600">{word.mongolian}</p>
            </div>
            {containsTargetScript(word.chinese) ? (
              <SpeakerButton
                text={word.chinese}
                lang={lang}
                courseId={lesson.courseId}
                hskLevel={word.hskLevel}
                size="sm"
              />
            ) : null}
          </div>
        ))}
      </div>
      <Link href={vocabHref} className={ctaPrimaryClass}>
        🃏 {LEARNER_LESSON.vocabularyFlashcard}
      </Link>
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

  if (content.dialogues.length === 0) {
    const fallback = [
      { speaker: "A", chinese: "你好！", pinyin: "nǐ hǎo!", mongolian: "Сайн байна уу!" },
      { speaker: "B", chinese: "你好！", pinyin: "nǐ hǎo!", mongolian: "Сайн байна уу!" },
      { speaker: "A", chinese: "对不起！", pinyin: "duìbuqǐ!", mongolian: "Уучлаарай!" },
      { speaker: "B", chinese: "没关系！", pinyin: "méi guānxi!", mongolian: "Зүгээр!" },
    ];
    return (
      <div className="space-y-2">
        {fallback.map((line, lineIndex) => {
          const isLeft = lineIndex % 2 === 0;
          return (
            <div
              key={`${line.chinese}-${lineIndex}`}
              className={`flex ${isLeft ? "justify-start" : "justify-end"}`}
            >
              <DialogueBubble
                line={line}
                isLeft={isLeft}
                lang={lang}
                courseId={lesson.courseId}
                romLabel={romLabel}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {content.dialogues.map((dialogue, index) => (
        <div key={`${dialogue.title ?? "dialogue"}-${index}`} className="space-y-2">
          {dialogue.lines.map((line, lineIndex) => {
            const isLeft = lineIndex % 2 === 0;
            return (
              <div
                key={`${line.chinese}-${lineIndex}`}
                className={`flex ${isLeft ? "justify-start" : "justify-end"}`}
              >
                <DialogueBubble
                  line={{
                    speaker: line.speaker ?? (isLeft ? "A" : "B"),
                    chinese: line.chinese,
                    pinyin: line.pinyin,
                    mongolian: line.mongolian,
                  }}
                  isLeft={isLeft}
                  lang={lang}
                  courseId={lesson.courseId}
                  romLabel={romLabel}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DialogueBubble({
  line,
  isLeft,
  lang,
  courseId,
  romLabel,
}: {
  line: {
    speaker?: string;
    chinese: string;
    pinyin?: string;
    mongolian?: string;
  };
  isLeft: boolean;
  lang: ReturnType<typeof resolveTtsLang>;
  courseId: string;
  romLabel: string;
}) {
  return (
    <div
      className={
        isLeft
          ? "max-w-[85%] rounded-2xl rounded-bl-md bg-emerald-50 px-3.5 py-3 ring-1 ring-emerald-100"
          : "max-w-[85%] rounded-2xl rounded-br-md bg-white px-3.5 py-3 ring-1 ring-slate-200"
      }
    >
      <p className="text-xs font-bold text-slate-500">{line.speaker ?? (isLeft ? "A" : "B")}</p>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
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
          <SpeakerButton text={line.chinese} lang={lang} courseId={courseId} size="sm" />
        ) : null}
      </div>
    </div>
  );
}

export function HskLessonStudyContent({
  lesson,
  adminPreview = false,
  showBottomCtas = true,
}: Props) {
  const content = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const intro = resolveHskIntroSpeech(lesson, content);
  const whyImportant = resolveHskWhyImportant(lesson, content);
  const pinyinExplainer = resolveHskPinyinExplainer(content);
  const teacherAdvice = resolveHskTeacherAdvice(content);
  const toneNote = resolveHskLessonToneNote(lesson, content);
  const pinyinImage = findHskMediaBySection(content.media, "pinyin");
  const pinyinUrl = resolveHskMediaUrl(pinyinImage);
  const lang = resolveTtsLang({ courseId: lesson.courseId });

  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });
  const detailHref = lessonPreviewPath(lesson.id, { adminPreview });

  return (
    <div className="flex flex-col gap-4 pb-4">
      <SectionCard className="border-emerald-100 bg-white ring-emerald-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Багшийн эхний тайлбар
        </p>
        <div className="mt-3">
          <TeacherSpeechBubble>{intro}</TeacherSpeechBubble>
        </div>
      </SectionCard>

      <SectionCard className="ring-emerald-100">
        <h2 className="text-base font-semibold text-emerald-800">
          Яагаад энэ үг чухал вэ?
        </h2>
        <ul className="mt-3 space-y-2">
          {whyImportant.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-sm leading-6 text-slate-700"
            >
              <span className="text-emerald-500" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard className="ring-emerald-100">
        <h2 className="text-base font-semibold text-emerald-800">Pinyin гэж юу вэ?</h2>
        <ul className="mt-3 space-y-2.5">
          {pinyinExplainer.map((line) => (
            <li
              key={line}
              className="rounded-xl bg-emerald-50/60 px-3 py-2.5 text-sm leading-6 text-slate-700 ring-1 ring-emerald-100"
            >
              {line}
            </li>
          ))}
        </ul>
        {lesson.chineseTitle ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-3 ring-1 ring-emerald-100">
            <div>
              <p className="text-2xl font-bold text-slate-900">{lesson.chineseTitle}</p>
              <p className="text-sm text-emerald-700">
                {lesson.vocabulary[0]?.pinyin || "nǐ hǎo"}
              </p>
            </div>
            {containsTargetScript(lesson.chineseTitle) ? (
              <SpeakerButton
                text={lesson.chineseTitle}
                lang={lang}
                courseId={lesson.courseId}
                size="md"
              />
            ) : null}
          </div>
        ) : null}
        {pinyinUrl ? (
          <div className="mt-3">
            <HskMediaImage src={pinyinUrl} alt="Pinyin зураг" />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard className="ring-emerald-100">
        <h2 className="text-base font-semibold text-emerald-800">
          {HSK_TONE_LEARNER_LABELS.sectionTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Хятад хэлний 4 tone — аяны өөрчлөлт утгыг тодорхойлно.
        </p>
        <div className="mt-3">
          <ToneSection content={content} lessonToneNote={toneNote} />
        </div>
      </SectionCard>

      <SectionCard className="ring-emerald-100">
        <h2 className="text-base font-semibold text-emerald-800">Үгсийн тайлбар</h2>
        <p className="mt-1 text-sm text-slate-600">
          Эхний гол үгс — бүрэн жагсаалтыг flashcard-аар давтана.
        </p>
        <div className="mt-3">
          <KeyWordsPreview lesson={lesson} adminPreview={adminPreview} />
        </div>
      </SectionCard>

      <SectionCard className="ring-emerald-100">
        <h2 className="text-base font-semibold text-emerald-800">Богино яриа</h2>
        <div className="mt-3">
          <DialogueBlock lesson={lesson} content={content} />
        </div>
      </SectionCard>

      <SectionCard className="border-amber-100 bg-amber-50/30 ring-amber-100">
        <h2 className="text-base font-semibold text-amber-900">Багшийн зөвлөгөө</h2>
        <div className="mt-3">
          <TeacherSpeechBubble>{teacherAdvice}</TeacherSpeechBubble>
        </div>
      </SectionCard>

      {showBottomCtas ? (
        <SectionCard className="ring-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
          <h2 className="text-base font-semibold text-emerald-800">Бататгах алхам</h2>
          <CtaButtonRow className="mt-3 !gap-2">
            <Link href={vocabHref} className={ctaPrimaryClass}>
              Үгийн сан давтах
            </Link>
            <Link href={quizHref} className={ctaSecondaryClass}>
              Quiz өгөх
            </Link>
            <Link href={vocabHref} className={ctaOutlineClass}>
              Сонсож давтах
            </Link>
            <Link href={detailHref} className={ctaOutlineClass}>
              Дараагийн хичээл
            </Link>
          </CtaButtonRow>
        </SectionCard>
      ) : null}
    </div>
  );
}
