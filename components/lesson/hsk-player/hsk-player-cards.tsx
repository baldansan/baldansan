"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { HskMediaImage } from "@/components/lesson/hsk-flashcard-vocabulary-study";
import { HskOptionalVideoCard } from "@/components/lesson/hsk-optional-video-card";
import {
  findHskMediaForGuidedStep,
  resolveHskGuidedStepMediaDisplay,
  type HskGuidedStepMediaRef,
} from "@/lib/lesson/hsk-media";
import type { HskGuidedStep } from "@/lib/lesson/hsk-guided-step";
import { HSK_PLAYER } from "@/lib/lesson/hsk-player/hsk-player-theme";
import { resolveHskStepImageDisplay } from "@/lib/lesson/hsk-player/hsk-step-image-policy";
import type { HskDialogueLine } from "@/lib/lesson/hsk-lesson-content";
import type { HskStudyContent } from "@/lib/lesson/hsk-lesson-content";
import {
  defaultHskToneItems,
  HSK_TONE_LEARNER_LABELS,
  parseHskToneItems,
  resolveToneHowToSay,
  type HskToneItem,
} from "@/lib/lesson/hsk-tone-content";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { TeachingImage } from "@/lib/lesson/teaching-media";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

function HskStepImageSlot({
  stepType,
  media,
  stepMedia,
  teachingImages,
  alt = "",
}: {
  stepType?: string;
  media?: HskStudyContent["media"];
  stepMedia: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
  alt?: string;
}) {
  const image = findHskMediaForGuidedStep(media, stepMedia);
  const { imageUrl, packageLabel } = resolveHskGuidedStepMediaDisplay(
    media,
    stepMedia,
    teachingImages
  );
  const display = resolveHskStepImageDisplay({ stepType, image });

  if (display.mode === "hidden") return null;
  if (!imageUrl && !packageLabel) return null;

  return (
    <div className="mt-3">
      <HskMediaImage
        src={imageUrl}
        alt={display.mode === "illustration" ? "Багшийн туслах зураг" : alt}
        packageLabel={packageLabel}
        variant={display.variant}
      />
      {display.caption ? (
        <p
          className="mt-1.5 text-center text-xs leading-5"
          style={{ color: HSK_PLAYER.muted }}
        >
          {display.caption}
        </p>
      ) : null}
    </div>
  );
}

export function HskPlayerCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`font-sans mx-auto w-full max-w-[430px] overflow-hidden bg-white p-5 shadow-[0_8px_24px_rgba(16,32,51,0.06)] sm:p-6 ${className}`}
      style={{ borderRadius: HSK_PLAYER.radius }}
    >
      {children}
    </article>
  );
}

export function TeacherSpeechCard({
  title,
  bullets,
  tip,
  media,
  stepMedia,
  teachingImages,
}: {
  title: string;
  bullets: string[];
  tip?: string;
  media?: HskStudyContent["media"];
  stepMedia: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
}) {
  return (
    <HskPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HSK_PLAYER.muted }}>
        {title}
      </p>
      <HskStepImageSlot
        stepType="teacher-intro"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt={title}
      />
      <div className="mt-4 flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow-sm"
          style={{ backgroundColor: HSK_PLAYER.accent }}
          aria-hidden
        >
          🐫
        </span>
        <div
          className="relative min-w-0 flex-1 rounded-2xl rounded-tl-md px-4 py-3"
          style={{ backgroundColor: HSK_PLAYER.softYellow }}
        >
          <ul className="space-y-2 text-sm leading-6" style={{ color: HSK_PLAYER.text }}>
            {bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
      {tip ? (
        <p
          className="mt-3 rounded-xl px-3 py-2 text-xs leading-5"
          style={{ backgroundColor: HSK_PLAYER.softBlue, color: HSK_PLAYER.text }}
        >
          💡 {tip}
        </p>
      ) : null}
    </HskPlayerCard>
  );
}

export function KeyPhraseCard({
  lesson,
  chinese,
  pinyin,
  mongolian,
  breakdown,
  usage,
  media,
  stepMedia,
  teachingImages,
}: {
  lesson: LessonContent;
  chinese: string;
  pinyin: string;
  mongolian: string;
  breakdown: string;
  usage: string;
  media?: HskStudyContent["media"];
  stepMedia: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });

  return (
    <HskPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HSK_PLAYER.muted }}>
        Гол хэллэг
      </p>
      <HskStepImageSlot
        stepType="key-phrase"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt={chinese}
      />
      <div className="mt-4 text-center">
        <p className="text-5xl font-bold leading-none" style={{ color: HSK_PLAYER.text }}>
          {chinese}
        </p>
        <p className="mt-2 text-xl font-semibold" style={{ color: HSK_PLAYER.primary }}>
          {pinyin}
        </p>
        <p className="mt-2 text-base" style={{ color: HSK_PLAYER.muted }}>
          {mongolian}
        </p>
        {breakdown ? (
          <span
            className="mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium"
            style={{ backgroundColor: HSK_PLAYER.softGreen, color: HSK_PLAYER.text }}
          >
            {breakdown}
          </span>
        ) : null}
        <p className="mt-3 text-sm leading-6" style={{ color: HSK_PLAYER.muted }}>
          {usage}
        </p>
        {containsTargetScript(chinese) ? (
          <div className="mt-4 flex justify-center">
            <SpeakerButton
              text={chinese}
              lang={lang}
              courseId={lesson.courseId}
              size="lg"
            />
          </div>
        ) : null}
      </div>
    </HskPlayerCard>
  );
}

export function PinyinPracticeCard({
  lesson,
  explainer,
  rows,
  media,
  stepMedia,
  teachingImages,
}: {
  lesson: LessonContent;
  explainer: string[];
  rows: Array<{ chinese: string; pinyin: string; hint?: string }>;
  media?: HskStudyContent["media"];
  stepMedia: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        Пиньинь гэж юу вэ?
      </h2>
      <HskStepImageSlot
        stepType="pinyin"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt="Pinyin"
      />
      <ul className="mt-3 space-y-2">
        {explainer.map((line) => (
          <li
            key={line}
            className="rounded-xl px-3 py-2 text-sm leading-6"
            style={{ backgroundColor: HSK_PLAYER.softGreen, color: HSK_PLAYER.text }}
          >
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div
            key={`${row.chinese}-${row.pinyin}`}
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-3 ring-1 ring-slate-100"
          >
            <div>
              <p className="text-xl font-bold" style={{ color: HSK_PLAYER.text }}>
                {row.chinese}
              </p>
              <p className="text-sm font-medium" style={{ color: HSK_PLAYER.primary }}>
                {row.pinyin}
              </p>
              {row.hint ? (
                <p className="text-xs" style={{ color: HSK_PLAYER.muted }}>
                  {row.hint}
                </p>
              ) : null}
            </div>
            {containsTargetScript(row.chinese) ? (
              <SpeakerButton
                text={row.chinese}
                lang={lang}
                courseId={lesson.courseId}
                size="sm"
              />
            ) : null}
          </div>
        ))}
      </div>
      <p
        className="mt-3 rounded-xl px-3 py-2 text-xs font-medium"
        style={{ backgroundColor: HSK_PLAYER.softBlue, color: HSK_PLAYER.text }}
      >
        🔊 Сонсоод давт
      </p>
    </HskPlayerCard>
  );
}

function ToneProductionCard({ tone }: { tone: HskToneItem }) {
  const howToSay = tone.howToSayMn || tone.explanationMn;

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ backgroundColor: HSK_PLAYER.softGreen }}
    >
      <p className="text-sm font-bold" style={{ color: HSK_PLAYER.text }}>
        {tone.nameMn}
      </p>
      <div className="mt-3 space-y-2.5 text-sm" style={{ color: HSK_PLAYER.text }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
            {HSK_TONE_LEARNER_LABELS.example}
          </p>
          <p className="text-xl font-bold">{tone.example}</p>
        </div>
        {tone.motionSymbol ? (
          <div>
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {HSK_TONE_LEARNER_LABELS.motion}
            </p>
            <p className="text-2xl font-bold" style={{ color: HSK_PLAYER.primary }}>
              {tone.motionSymbol}
            </p>
          </div>
        ) : null}
        {howToSay ? (
          <div>
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {HSK_TONE_LEARNER_LABELS.howToSay}
            </p>
            <p>{howToSay}</p>
          </div>
        ) : null}
        {tone.repeatMn ? (
          <div>
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {HSK_TONE_LEARNER_LABELS.repeat}
            </p>
            <p className="font-semibold">{tone.repeatMn}</p>
          </div>
        ) : null}
        {tone.learnerHintMn ? (
          <div>
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {HSK_TONE_LEARNER_LABELS.hint}
            </p>
            <p>{tone.learnerHintMn}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ToneDetailCard({ tone }: { tone: HskToneItem }) {
  const howToSay = resolveToneHowToSay(tone);

  return (
    <div
      className="rounded-2xl px-3 py-3"
      style={{ backgroundColor: HSK_PLAYER.softGreen }}
    >
      <p className="text-sm font-bold" style={{ color: HSK_PLAYER.text }}>
        {tone.nameMn}
      </p>
      <div className="mt-2 space-y-2 text-sm" style={{ color: HSK_PLAYER.text }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
            {HSK_TONE_LEARNER_LABELS.example}
          </p>
          <p className="text-lg font-bold">{tone.example}</p>
        </div>
        {tone.motionMn || tone.motionSymbol ? (
          <div>
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {HSK_TONE_LEARNER_LABELS.motion}
            </p>
            <p>
              {tone.motionSymbol}
              {tone.motionMn ? ` · ${tone.motionMn}` : ""}
            </p>
          </div>
        ) : null}
        {howToSay ? (
          <div>
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {HSK_TONE_LEARNER_LABELS.howToSay}
            </p>
            <p>{howToSay}</p>
          </div>
        ) : null}
        {tone.learnerHintMn ? (
          <div>
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {HSK_TONE_LEARNER_LABELS.hint}
            </p>
            <p>{tone.learnerHintMn}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TonePracticeCard({
  tones,
  toneNote,
  toneWarning,
  media,
  stepMedia,
  teachingImages,
  layout = "standard",
}: {
  tones: HskToneItem[];
  toneNote: string;
  toneWarning: string;
  media?: HskStudyContent["media"];
  stepMedia: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
  layout?: "production" | "standard";
}) {
  const displayTones =
    tones.length > 0 ? tones : defaultHskToneItems();

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        {HSK_TONE_LEARNER_LABELS.sectionTitle}
      </h2>
      <HskStepImageSlot
        stepType="tones"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt="Хөгний зураглал"
      />
      <div
        className={`mt-3 grid gap-2 ${
          layout === "production" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {displayTones.map((tone) =>
          layout === "production" ? (
            <ToneProductionCard key={`${tone.nameMn}-${tone.example}`} tone={tone} />
          ) : (
            <ToneDetailCard key={`${tone.nameMn}-${tone.example}`} tone={tone} />
          )
        )}
      </div>
      {toneNote ? (
        <p
          className="mt-3 rounded-xl px-3 py-2.5 text-sm"
          style={{ backgroundColor: HSK_PLAYER.softYellow, color: HSK_PLAYER.text }}
        >
          {toneNote}
        </p>
      ) : null}
      {toneWarning ? (
        <p
          className="mt-2 rounded-xl px-3 py-2 text-xs leading-5"
          style={{ backgroundColor: HSK_PLAYER.softPink, color: HSK_PLAYER.text }}
        >
          ⚠️ {toneWarning}
        </p>
      ) : null}
      {layout === "production" ? (
        <div className="mt-3 space-y-2">
          <p
            className="rounded-xl px-3 py-2 text-xs font-medium"
            style={{ backgroundColor: HSK_PLAYER.softBlue, color: HSK_PLAYER.text }}
          >
            🔊 Сонсож ялга · ✋ {HSK_TONE_LEARNER_LABELS.handRepeat}
          </p>
          <p
            className="rounded-xl px-3 py-2 text-xs opacity-60"
            style={{ backgroundColor: HSK_PLAYER.softYellow, color: HSK_PLAYER.text }}
            aria-disabled
          >
            🎙️ Өөрийн дуу бичих — удахгүй
          </p>
        </div>
      ) : (
        <p
          className="mt-3 rounded-xl px-3 py-2 text-xs font-medium"
          style={{ backgroundColor: HSK_PLAYER.softBlue, color: HSK_PLAYER.text }}
        >
          🔊 {HSK_TONE_LEARNER_LABELS.listenRepeat}
        </p>
      )}
    </HskPlayerCard>
  );
}

export function VocabularyFlashcardPreview({
  lesson,
  word,
  vocabHref,
  media,
  stepMedia,
  teachingImages,
}: {
  lesson: LessonContent;
  word: VocabularyWord | null;
  vocabHref: string;
  media?: HskStudyContent["media"];
  stepMedia?: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });

  if (!word) {
    return (
      <HskPlayerCard>
        <p className="text-sm" style={{ color: HSK_PLAYER.muted }}>
          Үгийн сан хараахан байхгүй.
        </p>
        <Link
          href={vocabHref}
          className="app-btn-primary mt-4 block w-full text-center"
        >
          Үгийн сан руу
        </Link>
      </HskPlayerCard>
    );
  }

  return (
    <HskPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HSK_PLAYER.muted }}>
        Үгийн сан — урьдчилсан
      </p>
      {stepMedia ? (
        <HskStepImageSlot
          stepType="vocabulary"
          media={media}
          stepMedia={stepMedia}
          teachingImages={teachingImages}
          alt="Vocabulary"
        />
      ) : null}
      <p className="mt-2 text-sm" style={{ color: HSK_PLAYER.muted }}>
        Нэг үгийг картаар үзээд, бүрэн flashcard руу үргэлжлүүлнэ.
      </p>
      <div
        className="mt-4 flex flex-col items-center rounded-2xl px-4 py-8"
        style={{ backgroundColor: HSK_PLAYER.softGreen }}
      >
        <p className="text-5xl font-bold" style={{ color: HSK_PLAYER.text }}>
          {word.chinese}
        </p>
        {containsTargetScript(word.chinese) ? (
          <div className="mt-3">
            <SpeakerButton
              text={word.chinese}
              lang={lang}
              courseId={lesson.courseId}
              hskLevel={word.hskLevel}
              size="md"
            />
          </div>
        ) : null}
        <p className="mt-4 text-sm" style={{ color: HSK_PLAYER.muted }}>
          {word.pinyin} · {word.mongolian}
        </p>
      </div>
      <Link href={vocabHref} className="app-btn-primary mt-4 block w-full text-center">
        🃏 Үгийн сангаа flashcard-аар давтах
      </Link>
    </HskPlayerCard>
  );
}

export function DialoguePracticeCard({
  lesson,
  lines,
  media,
  stepMedia,
  teachingImages,
}: {
  lesson: LessonContent;
  lines: HskDialogueLine[];
  media?: HskStudyContent["media"];
  stepMedia: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        Богино яриа
      </h2>
      <HskStepImageSlot
        stepType="dialogue"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt="Dialogue"
      />
      <div className="mt-4 space-y-2">
        {lines.map((line, index) => {
          const isLeft = index % 2 === 0;
          return (
            <div
              key={`${line.chinese}-${index}`}
              className={`flex ${isLeft ? "justify-start" : "justify-end"}`}
            >
              <div
                className="max-w-[88%] rounded-2xl px-3 py-2.5"
                style={{
                  backgroundColor: isLeft ? HSK_PLAYER.softGreen : HSK_PLAYER.card,
                  border: isLeft ? "none" : "1px solid #e2e8f0",
                }}
              >
                <p className="text-xs font-bold" style={{ color: HSK_PLAYER.muted }}>
                  {line.speaker ?? (isLeft ? "A" : "B")}
                </p>
                <div className="flex items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: HSK_PLAYER.text }}>
                      {line.chinese}
                    </p>
                    {line.pinyin ? (
                      <p className="text-sm" style={{ color: HSK_PLAYER.primary }}>
                        {line.pinyin}
                      </p>
                    ) : null}
                    {line.mongolian ? (
                      <p className="text-sm" style={{ color: HSK_PLAYER.muted }}>
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
        })}
      </div>
    </HskPlayerCard>
  );
}

export function CommonMistakesCard({
  step,
  media,
  teachingImages,
}: {
  step: HskGuidedStep;
  media?: HskStudyContent["media"];
  teachingImages?: TeachingImage[];
}) {
  const stepMedia: HskGuidedStepMediaRef = {
    imageId: step.imageId,
    mediaSection: step.mediaSection,
    id: step.id,
  };

  const pairs =
    step.examples.length > 0
      ? step.examples
      : [{ wrong: "ni hao", correct: "nǐ hǎo", mongolian: "Хөгийн тэмдэг чухал" }];

  return (
    <HskPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HSK_PLAYER.muted }}>
        {step.titleMn || "Түгээмэл алдаа"}
      </p>
      <HskStepImageSlot
        stepType="common-mistake"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt={step.titleMn}
      />
      {step.teacherSpeechMn || step.bulletsMn.length > 0 ? (
        <p
          className="mt-3 rounded-xl px-3 py-2.5 text-sm leading-6"
          style={{ backgroundColor: HSK_PLAYER.softYellow, color: HSK_PLAYER.text }}
        >
          {step.teacherSpeechMn || step.bulletsMn.join(" ")}
        </p>
      ) : null}
      <div className="mt-4 space-y-2">
        {pairs.map((pair, index) => (
          <div
            key={`${pair.wrong}-${pair.correct}-${index}`}
            className="grid grid-cols-2 gap-2"
          >
            <div
              className="rounded-2xl px-3 py-3 text-center"
              style={{ backgroundColor: HSK_PLAYER.softPink }}
            >
              <p className="text-xs font-semibold text-rose-700">❌ Буруу</p>
              <p className="mt-1 text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
                {pair.wrong ?? pair.pinyin ?? pair.chinese}
              </p>
            </div>
            <div
              className="rounded-2xl px-3 py-3 text-center"
              style={{ backgroundColor: HSK_PLAYER.softGreen }}
            >
              <p className="text-xs font-semibold text-emerald-700">✅ Зөв</p>
              <p className="mt-1 text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
                {pair.correct ?? pair.pinyin ?? pair.chinese}
              </p>
            </div>
          </div>
        ))}
      </div>
      {pairs[0]?.mongolian ? (
        <p className="mt-3 text-sm leading-6" style={{ color: HSK_PLAYER.muted }}>
          {pairs[0].mongolian}
        </p>
      ) : null}
    </HskPlayerCard>
  );
}

export function PracticeMenuCard({
  vocabHref,
  quizHref,
  lessonId,
  workbookHref,
}: {
  vocabHref: string;
  quizHref: string;
  lessonId: string;
  workbookHref?: string;
}) {
  const strokeHref = `/games/stroke?lessonId=${encodeURIComponent(lessonId)}`;
  const items = [
    { label: "Үгийн сан давтах", href: `${vocabHref}?view=flashcard`, icon: "📇", bg: HSK_PLAYER.softBlue },
    { label: "Quiz өгөх", href: quizHref, icon: "📝", bg: HSK_PLAYER.softPink },
    ...(workbookHref
      ? [{ label: "Workbook дасгал", href: workbookHref, icon: "📘", bg: HSK_PLAYER.softYellow }]
      : []),
    { label: "Сонсож давтах", href: vocabHref, icon: "🔊", bg: HSK_PLAYER.softGreen },
    { label: "Ханз бичих", href: strokeHref, icon: "字", bg: HSK_PLAYER.softYellow },
  ];

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        Бататгах
      </h2>
      <p className="mt-1 text-sm" style={{ color: HSK_PLAYER.muted }}>
        Аль ч сонголтоор бататгаж болно.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: item.bg }}
          >
            <span className="text-2xl" aria-hidden>
              {item.icon}
            </span>
            <span className="text-xs font-semibold" style={{ color: HSK_PLAYER.text }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </HskPlayerCard>
  );
}

export function LessonCompleteCard({
  message,
  vocabHref,
  quizHref,
  nextHref,
  detailHref,
  onRestart,
  media,
  stepMedia,
  teachingImages,
}: {
  message: string;
  vocabHref: string;
  quizHref: string;
  nextHref: string | null;
  detailHref: string;
  onRestart: () => void;
  media?: HskStudyContent["media"];
  stepMedia?: HskGuidedStepMediaRef;
  teachingImages?: TeachingImage[];
}) {
  return (
    <HskPlayerCard>
      {stepMedia ? (
        <HskStepImageSlot
          stepType="complete"
          media={media}
          stepMedia={stepMedia}
          teachingImages={teachingImages}
          alt="Complete"
        />
      ) : (
        <div className="flex flex-col items-center text-center">
          <p className="text-5xl" aria-hidden>
            🏆
          </p>
        </div>
      )}
      <div className="mt-3 flex flex-col items-center text-center">
        {!stepMedia ? null : (
          <p className="text-3xl" aria-hidden>
            🏆
          </p>
        )}
        <h2 className="mt-3 text-xl font-bold" style={{ color: HSK_PLAYER.text }}>
          Маш сайн!
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: HSK_PLAYER.muted }}>
          {message}
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <Link href={quizHref} className="app-btn-primary w-full text-center">
          Quiz өгөх
        </Link>
        <Link href={vocabHref} className="app-btn-secondary w-full text-center">
          Үгийн сан давтах
        </Link>
        {nextHref ? (
          <Link href={nextHref} className="app-btn-outline-green w-full text-center">
            Дараагийн хичээл
          </Link>
        ) : (
          <Link href={detailHref} className="app-btn-outline-green w-full text-center">
            Хичээл рүү буцах
          </Link>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="mt-1 text-sm font-medium text-slate-500 hover:text-emerald-600"
        >
          Дахин эхлэх
        </button>
      </div>
    </HskPlayerCard>
  );
}

export function PhraseBreakdownCard({
  step,
  media,
  teachingImages,
}: {
  step: HskGuidedStep;
  media?: HskStudyContent["media"];
  teachingImages?: TeachingImage[];
}) {
  const stepMedia: HskGuidedStepMediaRef = {
    imageId: step.imageId,
    mediaSection: step.mediaSection,
    id: step.id,
  };

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        {step.titleMn || "你 + 好 = 你好"}
      </h2>
      <HskStepImageSlot
        stepType="phrase-breakdown"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt={step.titleMn}
      />
      {step.teacherSpeechMn ? (
        <p className="mt-3 text-sm leading-6" style={{ color: HSK_PLAYER.muted }}>
          {step.teacherSpeechMn}
        </p>
      ) : null}
      <div className="mt-4 space-y-2">
        {step.examples.map((part, index) => (
          <div
            key={`${part.chinese}-${index}`}
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ backgroundColor: index === step.examples.length - 1 ? HSK_PLAYER.softYellow : HSK_PLAYER.softGreen }}
          >
            <div>
              <p className="text-2xl font-bold" style={{ color: HSK_PLAYER.text }}>
                {part.chinese}
              </p>
              <p className="text-sm font-medium" style={{ color: HSK_PLAYER.primary }}>
                {part.pinyin}
              </p>
              <p className="text-sm" style={{ color: HSK_PLAYER.muted }}>
                {part.mongolian}
              </p>
            </div>
            {index < step.examples.length - 1 ? (
              <span className="text-xl font-bold text-slate-400" aria-hidden>
                +
              </span>
            ) : (
              <span className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
                =
              </span>
            )}
          </div>
        ))}
      </div>
      {step.bulletsMn.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {step.bulletsMn.map((line) => (
            <li
              key={line}
              className="rounded-xl px-3 py-2 text-sm leading-6"
              style={{ backgroundColor: HSK_PLAYER.softBlue, color: HSK_PLAYER.text }}
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </HskPlayerCard>
  );
}

export function ToneSandhiCard({
  step,
  media,
  teachingImages,
}: {
  step: HskGuidedStep;
  media?: HskStudyContent["media"];
  teachingImages?: TeachingImage[];
}) {
  const stepMedia: HskGuidedStepMediaRef = {
    imageId: step.imageId,
    mediaSection: step.mediaSection,
    id: step.id,
  };

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        {step.titleMn}
      </h2>
      <HskStepImageSlot
        stepType="tone-sandhi"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt={step.titleMn}
      />
      {step.chinese ? (
        <p className="mt-4 text-center text-4xl font-bold" style={{ color: HSK_PLAYER.text }}>
          {step.chinese}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {step.examples.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className="rounded-2xl px-3 py-3 text-center"
            style={{ backgroundColor: HSK_PLAYER.softGreen }}
          >
            <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
              {row.label}
            </p>
            <p className="mt-1 text-xl font-bold" style={{ color: HSK_PLAYER.primary }}>
              {row.pinyin}
            </p>
            {row.mongolian ? (
              <p className="mt-1 text-sm" style={{ color: HSK_PLAYER.text }}>
                {row.mongolian}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      {step.bulletsMn.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {step.bulletsMn.map((line) => (
            <li
              key={line}
              className="rounded-xl px-3 py-2 text-sm leading-6"
              style={{ backgroundColor: HSK_PLAYER.softYellow, color: HSK_PLAYER.text }}
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      {step.teacherSpeechMn ? (
        <p
          className="mt-3 rounded-xl px-3 py-2 text-xs leading-5"
          style={{ backgroundColor: HSK_PLAYER.softBlue, color: HSK_PLAYER.text }}
        >
          💡 {step.teacherSpeechMn}
        </p>
      ) : null}
    </HskPlayerCard>
  );
}

export function CharactersLessonCard({
  step,
  media,
  teachingImages,
  lessonId,
}: {
  step: HskGuidedStep;
  media?: HskStudyContent["media"];
  teachingImages?: TeachingImage[];
  lessonId: string;
}) {
  const stepMedia: HskGuidedStepMediaRef = {
    imageId: step.imageId,
    mediaSection: step.mediaSection,
    id: step.id,
  };
  const strokeHref = `/games/stroke?lessonId=${encodeURIComponent(lessonId)}`;

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        {step.titleMn || "Ханз ба зураас"}
      </h2>
      <HskStepImageSlot
        stepType="characters"
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt={step.titleMn}
      />
      {step.bulletsMn.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {step.bulletsMn.map((line) => (
            <li
              key={line}
              className="rounded-xl px-3 py-2 text-sm leading-6"
              style={{ backgroundColor: HSK_PLAYER.softYellow, color: HSK_PLAYER.text }}
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {step.examples.map((ch, index) => (
          <div
            key={`${ch.chinese}-${index}`}
            className="rounded-2xl px-3 py-3 text-center"
            style={{ backgroundColor: HSK_PLAYER.softGreen }}
          >
            <p className="text-3xl font-bold" style={{ color: HSK_PLAYER.text }}>
              {ch.chinese}
            </p>
            <p className="text-sm font-medium" style={{ color: HSK_PLAYER.primary }}>
              {ch.pinyin}
            </p>
            <p className="text-xs" style={{ color: HSK_PLAYER.muted }}>
              {ch.mongolian}
            </p>
            {ch.label ? (
              <p className="mt-1 text-[11px]" style={{ color: HSK_PLAYER.muted }}>
                {ch.label}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <Link
        href={strokeHref}
        className="app-btn-primary mt-4 block w-full text-center"
      >
        Зураасны дараалал — дагаж бичих
      </Link>
    </HskPlayerCard>
  );
}

export function GuidedStepCard({
  step,
  media,
  teachingImages,
}: {
  step: HskGuidedStep;
  media?: HskStudyContent["media"];
  teachingImages?: TeachingImage[];
}) {
  const stepMedia: HskGuidedStepMediaRef = {
    imageId: step.imageId,
    mediaSection: step.mediaSection,
    id: step.id,
  };

  return (
    <HskPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HSK_PLAYER.muted }}>
        {step.titleMn}
      </p>
      <HskStepImageSlot
        stepType={step.type}
        media={media}
        stepMedia={stepMedia}
        teachingImages={teachingImages}
        alt={step.titleMn}
      />
      {step.chinese ? (
        <p className="mt-3 text-center text-3xl font-bold" style={{ color: HSK_PLAYER.text }}>
          {step.chinese}
        </p>
      ) : null}
      {step.pinyin ? (
        <p className="mt-1 text-center text-lg" style={{ color: HSK_PLAYER.primary }}>
          {step.pinyin}
        </p>
      ) : null}
      {step.mongolian ? (
        <p className="mt-1 text-center text-sm" style={{ color: HSK_PLAYER.muted }}>
          {step.mongolian}
        </p>
      ) : null}
      {step.bulletsMn.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {step.bulletsMn.map((line) => (
            <li
              key={line}
              className="rounded-xl px-3 py-2 text-sm leading-6"
              style={{ backgroundColor: HSK_PLAYER.softYellow, color: HSK_PLAYER.text }}
            >
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      {step.examples.length > 0 ? (
        <div className="mt-4 space-y-2">
          {step.examples.map((example, index) => (
            <div
              key={`${example.chinese}-${index}`}
              className="rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: HSK_PLAYER.softGreen, color: HSK_PLAYER.text }}
            >
              {example.label ? (
                <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.muted }}>
                  {example.label}
                </p>
              ) : null}
              {example.chinese ? <p className="text-lg font-bold">{example.chinese}</p> : null}
              {example.pinyin ? <p style={{ color: HSK_PLAYER.primary }}>{example.pinyin}</p> : null}
              {example.mongolian ? <p className="text-xs">{example.mongolian}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </HskPlayerCard>
  );
}

export function HskOptionalVideoInline({
  lesson,
  adminPreview = false,
}: {
  lesson: LessonContent;
  adminPreview?: boolean;
}) {
  return (
    <div className="mt-3">
      <HskOptionalVideoCard lesson={lesson} adminPreview={adminPreview} inline />
    </div>
  );
}
