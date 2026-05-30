"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { lettersDetailLinkLabel } from "@/lib/learner-letters-ui";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import { resolveKoreanTtsLang } from "@/lib/lesson/teaching-media";
import { resolveTtsLang } from "@/lib/tts/infer-lang";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import type { VocabularyWord } from "@/types/lesson";

type Props = {
  word: VocabularyWord;
  lessonId: string;
  courseId?: string;
  taskCount: number;
};

type SheetMode = "write" | "listen" | null;

export function KanjiDetailClient({ word, lessonId, courseId, taskCount }: Props) {
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [lang, setLang] = useState<ReturnType<typeof getSelectedLanguage>>(null);
  const vocabHref = `/kanji/${encodeURIComponent(word.id || word.chinese)}?lessonId=${lessonId}`;
  const ttsLang = courseId
    ? resolveKoreanTtsLang({ courseId })
    : resolveTtsLang({ hskLevel: word.hskLevel });

  useEffect(() => {
    setLang(getSelectedLanguage());
  }, []);

  return (
    <MobileAppShell activeTab="kanji" showBottomNav={sheet == null}>
      <header className="mb-4 flex items-center gap-2">
        <Link
          href="/kanji"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600 ring-1 ring-red-200"
          aria-label="Буцах"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-[var(--app-text)]">
            {lettersDetailLinkLabel(lang)}
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
          {taskCount} хичээлд орсон
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
        <p className="mb-3 text-sm font-bold text-[var(--app-text)]">
          Дасгал
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSheet("write")}
            className="min-h-[44px] rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
          >
            Бичих
          </button>
          <button
            type="button"
            onClick={() => setSheet("listen")}
            className="min-h-[44px] rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800"
          >
            Сонсох &amp; хэлэх
          </button>
        </div>
        <div className="mt-3 flex justify-center">
          <SpeakerButton
            text={word.chinese}
            lang={ttsLang}
            hskLevel={word.hskLevel}
            size="lg"
            label="Үгийг уншуулах"
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
          <div className="w-full max-w-[430px] rounded-t-3xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="mb-4 text-sm font-semibold text-red-600"
            >
              Хаах
            </button>
            <p className="text-lg font-bold text-[var(--app-text)]">
              {sheet === "write" ? "Бичих дасгал" : "Сонсох & хэлэх"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              {sheet === "write"
                ? "Бичих дасгал дараагийн шатанд илүү нарийвчилна."
                : "Дуу таних хадгалахгүй, зөвхөн practice mode."}
            </p>
            <p className="mt-3 text-4xl font-bold">{word.chinese}</p>
            <Link
              href={vocabHref}
              className="mt-4 inline-block text-sm font-semibold text-emerald-600"
              onClick={() => setSheet(null)}
            >
              Буцах
            </Link>
          </div>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
