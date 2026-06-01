"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { HskMediaImage } from "@/components/lesson/hsk-flashcard-vocabulary-study";
import {
  findHskMediaBySection,
  resolveHskMediaUrl,
} from "@/lib/lesson/hsk-media";
import { HSK_PLAYER } from "@/lib/lesson/hsk-player/hsk-player-theme";
import type { HskDialogueLine, HskToneExample } from "@/lib/lesson/hsk-lesson-content";
import type { HskStudyContent } from "@/lib/lesson/hsk-lesson-content";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

export function HskPlayerCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`mx-auto w-full max-w-[430px] overflow-hidden bg-white p-5 shadow-[0_8px_24px_rgba(16,32,51,0.06)] sm:p-6 ${className}`}
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
  section,
}: {
  title: string;
  bullets: string[];
  tip?: string;
  media?: HskStudyContent["media"];
  section?: string;
}) {
  const image = section ? findHskMediaBySection(media, section) : null;
  const imageUrl = resolveHskMediaUrl(image);

  return (
    <HskPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HSK_PLAYER.muted }}>
        {title}
      </p>
      <div className="mt-4 flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white shadow-sm"
          style={{ backgroundColor: HSK_PLAYER.primary }}
          aria-hidden
        >
          👩‍🏫
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
      {imageUrl ? (
        <div className="mt-3">
          <HskMediaImage src={imageUrl} alt="" />
        </div>
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
}: {
  lesson: LessonContent;
  chinese: string;
  pinyin: string;
  mongolian: string;
  breakdown: string;
  usage: string;
  media?: HskStudyContent["media"];
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });
  const hero = findHskMediaBySection(media, "hero");
  const heroUrl = resolveHskMediaUrl(hero);

  return (
    <HskPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HSK_PLAYER.muted }}>
        Гол хэллэг
      </p>
      {heroUrl ? (
        <div className="mt-3">
          <HskMediaImage src={heroUrl} alt={chinese} />
        </div>
      ) : null}
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
}: {
  lesson: LessonContent;
  explainer: string[];
  rows: Array<{ chinese: string; pinyin: string; hint?: string }>;
  media?: HskStudyContent["media"];
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });
  const pinyinImage = findHskMediaBySection(media, "pinyin");
  const pinyinUrl = resolveHskMediaUrl(pinyinImage);

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        Pinyin гэж юу вэ?
      </h2>
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
      {pinyinUrl ? (
        <div className="mt-3">
          <HskMediaImage src={pinyinUrl} alt="Pinyin" />
        </div>
      ) : null}
    </HskPlayerCard>
  );
}

const TONE_ARROWS = ["→", "↗", "↘↗", "↘"];

export function TonePracticeCard({
  tones,
  toneNote,
  toneWarning,
  media,
}: {
  tones: HskToneExample[];
  toneNote: string;
  toneWarning: string;
  media?: HskStudyContent["media"];
}) {
  const toneImage = findHskMediaBySection(media, "tone");
  const toneUrl = resolveHskMediaUrl(toneImage);

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        Өнгө / Tone
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {tones.map((tone, index) => (
          <div
            key={`${tone.label}-${tone.example}`}
            className="rounded-2xl px-3 py-3"
            style={{ backgroundColor: HSK_PLAYER.softGreen }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: HSK_PLAYER.primary }}>
                {tone.label}
              </p>
              <span aria-hidden>{TONE_ARROWS[index] ?? "→"}</span>
            </div>
            <p className="mt-1 text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
              {tone.example}
            </p>
            <p className="text-xs" style={{ color: HSK_PLAYER.muted }}>
              {tone.mongolian}
            </p>
          </div>
        ))}
      </div>
      <p
        className="mt-3 rounded-xl px-3 py-2.5 text-sm"
        style={{ backgroundColor: HSK_PLAYER.softYellow, color: HSK_PLAYER.text }}
      >
        {toneNote}
      </p>
      <p
        className="mt-2 rounded-xl px-3 py-2 text-xs leading-5"
        style={{ backgroundColor: HSK_PLAYER.softPink, color: HSK_PLAYER.text }}
      >
        ⚠️ {toneWarning}
      </p>
      {toneUrl ? (
        <div className="mt-3">
          <HskMediaImage src={toneUrl} alt="Tone diagram" />
        </div>
      ) : null}
    </HskPlayerCard>
  );
}

export function VocabularyFlashcardPreview({
  lesson,
  word,
  vocabHref,
}: {
  lesson: LessonContent;
  word: VocabularyWord | null;
  vocabHref: string;
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
}: {
  lesson: LessonContent;
  lines: HskDialogueLine[];
  media?: HskStudyContent["media"];
}) {
  const lang = resolveTtsLang({ courseId: lesson.courseId });
  const dialogueImage = findHskMediaBySection(media, "dialogue");
  const dialogueUrl = resolveHskMediaUrl(dialogueImage);

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        Богино яриа
      </h2>
      {dialogueUrl ? (
        <div className="mt-3">
          <HskMediaImage src={dialogueUrl} alt="Dialogue" />
        </div>
      ) : null}
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

export function PracticeMenuCard({
  vocabHref,
  quizHref,
  lessonId,
}: {
  vocabHref: string;
  quizHref: string;
  lessonId: string;
}) {
  const items = [
    { label: "Сонсож давтах", href: vocabHref, icon: "🔊", bg: HSK_PLAYER.softBlue },
    { label: "Pinyin сонгох", href: quizHref, icon: "✏️", bg: HSK_PLAYER.softGreen },
    { label: "Ханз тань", href: `/kanji?lessonId=${lessonId}`, icon: "字", bg: HSK_PLAYER.softYellow },
    { label: "Богино quiz", href: quizHref, icon: "📝", bg: HSK_PLAYER.softPink },
  ];

  return (
    <HskPlayerCard>
      <h2 className="text-lg font-bold" style={{ color: HSK_PLAYER.text }}>
        Практик дадлага
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
}: {
  message: string;
  vocabHref: string;
  quizHref: string;
  nextHref: string | null;
  detailHref: string;
  onRestart: () => void;
}) {
  return (
    <HskPlayerCard>
      <div className="flex flex-col items-center text-center">
        <p className="text-5xl" aria-hidden>
          🏆
        </p>
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
