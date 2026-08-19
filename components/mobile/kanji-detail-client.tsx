"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { SpeakerButton } from "@/components/tts/speaker-button";
import {
  HANZI_WRITING_LABELS,
  isWritingPracticeEnabled,
  resolveStrokeOrderImageUrl,
  resolveWordPracticeChars,
} from "@/lib/hanzi/writing-practice";
import { lettersDetailLinkLabel } from "@/lib/learner-letters-ui";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import { resolveKoreanTtsLang } from "@/lib/lesson/teaching-media";
import { resolveTtsLang } from "@/lib/tts/infer-lang";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";
import type { VocabularyWord } from "@/types/lesson";

const HanziWriterPractice = dynamic(
  () =>
    import("@/components/hanzi/hanzi-writer-practice").then(
      (m) => m.HanziWriterPractice
    ),
  { ssr: false, loading: () => (
    <p className="py-12 text-center text-sm text-[var(--app-muted)]">
      {HANZI_WRITING_LABELS.loading}
    </p>
  ) }
);

type Props = {
  word: VocabularyWord;
  lessonId: string;
  courseId?: string;
  taskCount: number;
  lessonPracticeHanzi: string[];
  characterNotes?: HskCharacterNote[];
  openWriteOnMount?: boolean;
  isKorean?: boolean;
};

type SheetMode = "write" | "listen" | null;

export function KanjiDetailClient({
  word,
  lessonId,
  courseId,
  taskCount,
  lessonPracticeHanzi,
  characterNotes = [],
  openWriteOnMount = false,
  isKorean = false,
}: Props) {
  const locale = useUiLocale();
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [lang, setLang] = useState<ReturnType<typeof getSelectedLanguage>>(null);
  const practiceChars = useMemo(
    () => resolveWordPracticeChars(word.chinese, lessonPracticeHanzi),
    [word.chinese, lessonPracticeHanzi]
  );
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const activeChar = practiceChars[activeCharIndex] ?? practiceChars[0] ?? "";
  const writingEnabled =
    !isKorean &&
    practiceChars.length > 0 &&
    isWritingPracticeEnabled(activeChar, lessonPracticeHanzi);

  const ttsLang = courseId
    ? resolveKoreanTtsLang({ courseId })
    : resolveTtsLang({ hskLevel: word.hskLevel });

  useEffect(() => {
    setLang(getSelectedLanguage());
  }, []);

  useEffect(() => {
    if (openWriteOnMount && writingEnabled) {
      setSheet("write");
    }
  }, [openWriteOnMount, writingEnabled]);

  useEffect(() => {
    setActiveCharIndex(0);
  }, [word.chinese, lessonId]);

  const strokeOrderImageUrl = activeChar
    ? resolveStrokeOrderImageUrl(activeChar, characterNotes)
    : undefined;

  const nextChar =
    activeChar && activeCharIndex < practiceChars.length - 1
      ? practiceChars[activeCharIndex + 1] ?? null
      : null;

  function openWriteSheet() {
    if (!writingEnabled) return;
    setSheet("write");
  }

  function handleNextCharacter() {
    if (activeCharIndex < practiceChars.length - 1) {
      setActiveCharIndex(activeCharIndex + 1);
    }
  }

  return (
    <MobileAppShell activeTab="kanji" showBottomNav={sheet == null}>
      <header className="mb-4 flex items-center gap-2">
        <Link
          href="/kanji"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600 ring-1 ring-red-200"
          aria-label={tr(locale, "Буцах")}
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-[var(--app-text)]">
            {tr(locale, lettersDetailLinkLabel(lang))}
          </h1>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
          {word.hskLevel}
        </span>
      </header>

      <MobileCard className="mb-4 text-center !p-5">
        <div className="flex items-start justify-center gap-2">
          <p className="text-6xl font-bold text-[var(--app-text)]">{word.chinese}</p>
          <SpeakerButton
            text={word.chinese}
            lang={ttsLang}
            courseId={courseId}
            hskLevel={word.hskLevel}
            audioUrl={word.audioUrl}
            size="md"
          />
        </div>
        <p className="mt-3 text-xl text-emerald-700">{word.pinyin}</p>
        <p className="mt-2 text-base text-[var(--app-text)]">{word.mongolian}</p>
        <p className="mt-3 text-xs text-[var(--app-muted)]">
          {taskCount} {tr(locale, "хичээлд орсон")}
        </p>
      </MobileCard>

      {word.exampleChinese ? (
        <MobileCard className="mb-4">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-sm font-medium text-[var(--app-text)]">
              {word.exampleChinese}
            </p>
            <SpeakerButton
              text={word.exampleChinese}
              lang={ttsLang}
              courseId={courseId}
              hskLevel={word.hskLevel}
              audioUrl={word.audioUrl}
              size="sm"
            />
          </div>
          {word.exampleMongolian ? (
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              {word.exampleMongolian}
            </p>
          ) : null}
        </MobileCard>
      ) : null}

      <MobileCard className="mb-4">
        <p className="mb-3 text-sm font-bold text-[var(--app-text)]">{tr(locale, "Дасгал")}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openWriteSheet}
            disabled={!writingEnabled}
            className="min-h-[44px] rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {tr(locale, HANZI_WRITING_LABELS.write)}
          </button>
          <button
            type="button"
            onClick={() => setSheet("listen")}
            className="min-h-[44px] rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800"
          >
            {tr(locale, "Сонсох & хэлэх")}
          </button>
        </div>
        {writingEnabled ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openWriteSheet}
              className="min-h-[40px] rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 ring-1 ring-violet-200"
            >
              {tr(locale, HANZI_WRITING_LABELS.watchStrokes)}
            </button>
            <button
              type="button"
              onClick={openWriteSheet}
              className="min-h-[40px] rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
            >
              {tr(locale, HANZI_WRITING_LABELS.traceWrite)}
            </button>
          </div>
        ) : !isKorean ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--app-muted)]">
            {tr(locale, HANZI_WRITING_LABELS.unavailable)}
          </p>
        ) : null}
        <div className="mt-3 flex justify-center">
          <SpeakerButton
            text={word.chinese}
            lang={ttsLang}
            hskLevel={word.hskLevel}
            size="lg"
            label={tr(locale, "Үгийг уншуулах")}
          />
        </div>
        <GamePracticeLinks lessonId={lessonId} />
      </MobileCard>

      {sheet ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          role="dialog"
          aria-modal
        >
          <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="mb-4 text-sm font-semibold text-red-600"
            >
              {tr(locale, "Хаах")}
            </button>
            {sheet === "write" && writingEnabled ? (
              <>
                <p className="text-lg font-bold text-[var(--app-text)]">
                  {tr(locale, HANZI_WRITING_LABELS.practiceTitle)}
                </p>
                <p className="mt-1 text-4xl font-bold text-center text-[var(--app-text)]">
                  {activeChar}
                </p>
                {practiceChars.length > 1 ? (
                  <p className="mt-1 text-center text-xs text-[var(--app-muted)]">
                    {activeCharIndex + 1}/{practiceChars.length} {tr(locale, "ханз")}
                  </p>
                ) : null}
                <div className="mt-4">
                  <HanziWriterPractice
                    key={`${lessonId}-${activeChar}`}
                    character={activeChar}
                    strokeOrderImageUrl={strokeOrderImageUrl}
                    onDone={() => setSheet(null)}
                    onNextCharacter={handleNextCharacter}
                    hasNextCharacter={Boolean(nextChar)}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-[var(--app-text)]">
                  {tr(locale, "Сонсох & хэлэх")}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {tr(locale, "Дуу таних хадгалахгүй, зөвхөн practice mode.")}
                </p>
                <p className="mt-3 text-4xl font-bold">{word.chinese}</p>
                <div className="mt-4 flex justify-center">
                  <SpeakerButton
                    text={word.chinese}
                    lang={ttsLang}
                    courseId={courseId}
                    hskLevel={word.hskLevel}
                    audioUrl={word.audioUrl}
                    size="lg"
                    label={tr(locale, "Дахин сонсох")}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
