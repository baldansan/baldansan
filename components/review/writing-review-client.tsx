"use client";

import dynamic from "next/dynamic";
import "@/components/lesson/lesson-player.css";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  loadWritingQueue,
  type WritingQueueItem,
} from "@/lib/srs/writing-queue";
import { recordWritingResult } from "@/lib/srs/writing-srs-sync";
import { recordWordWrite } from "@/lib/writing/hanzi-history";
import type { WordSrsRating } from "@/lib/srs/word-srs-types";

const CharacterWriter = dynamic(
  () =>
    import("@/components/hanzi/CharacterWriter").then((m) => m.CharacterWriter),
  {
    ssr: false,
    loading: () => (
      <p className="bs-srs-stroke-loading">Ачааллаж байна…</p>
    ),
  }
);

const SESSION_LIMIT = 15;

type Phase = "loading" | "home" | "study" | "done";

/** Дасгалын нэг алхам. retry = алдсан үгийг дахин бичүүлэх (оноонд тооцохгүй). */
type Step = WritingQueueItem & { retry?: boolean };

const ROW_CLASS =
  "flex min-h-[52px] items-center justify-between border-t border-[var(--app-border)] py-3 text-[15px] font-bold text-[var(--app-text)]";

export function WritingReviewClient() {
  const locale = useUiLocale();
  const [phase, setPhase] = useState<Phase>("loading");
  const [learning, setLearning] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [queue, setQueue] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [tally, setTally] = useState<Record<WordSrsRating, number>>({
    known: 0,
    hard: 0,
    forgot: 0,
  });
  const [lastRating, setLastRating] = useState<WordSrsRating | null>(null);

  const loadQueue = useCallback(async (startNow = false) => {
    setPhase("loading");
    const result = await loadWritingQueue(SESSION_LIMIT);
    setLearning(result.learning);
    setMastered(result.mastered);
    setQueue(result.items);
    setWordCount(result.items.length);
    setIndex(0);
    setTally({ known: 0, hard: 0, forgot: 0 });
    setLastRating(null);
    setPhase(startNow && result.items.length > 0 ? "study" : "home");
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const current = queue[index];

  function handleResult(result: { mistakes: number; usedHint: boolean }) {
    if (!current || current.retry) return;
    const { rating } = recordWritingResult(
      {
        key: current.key,
        wordId: current.wordId,
        pinyin: current.pinyin,
        meaning: current.meaning,
      },
      result
    );
    recordWordWrite(current.key, "review", result, {
      pinyin: current.pinyin,
      meaning: current.meaning,
    });
    setLastRating(rating);
    setTally((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    // Алдсан үгийг энэ удаадаа дахин нэг бичүүлнэ: дагаж зураад, санаж бичнэ.
    if (rating === "forgot") {
      setQueue((prev) => [...prev, { ...current, isNew: true, retry: true }]);
    }
  }

  function handleNext() {
    setLastRating(null);
    if (index >= queue.length - 1) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
  }

  if (phase === "loading") {
    return (
      <p className="py-12 text-center text-sm text-[var(--app-muted)]">
        {tr(locale, "Ачааллаж байна…")}
      </p>
    );
  }

  if (phase === "home") {
    return (
      <div className="pt-2">
        <h1 className="bs-rv-title">{tr(locale, "Бичих")}</h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          {learning > 0 || mastered > 0
            ? `${learning} ${tr(locale, "бичиж буй")} · ${mastered} ${tr(locale, "бичиж цээжилсэн")}`
            : tr(locale, "Цээжилж буй үгсээ гараар бичиж цээжилнэ.")}
        </p>

        {learning > 0 ? (
          <button
            type="button"
            onClick={() => setPhase("study")}
            className="mt-5 min-h-[56px] w-full rounded-[16px] bg-[var(--app-primary)] text-base font-extrabold text-white"
          >
            {tr(locale, "Бичиж эхлэх")}
          </button>
        ) : (
          <div className="mt-5 rounded-[16px] bg-[var(--app-card)] p-4 text-center shadow-[var(--app-shadow)]">
            <p className="text-sm font-bold text-[var(--app-text)]">
              {mastered > 0
                ? tr(locale, "Бүх үгээ бичиж цээжиллээ. Шинэ үг нэмээрэй.")
                : tr(locale, "Бичих үг алга. Эхлээд цээжлэх үгээ сонгоорой.")}
            </p>
            <Link
              href="/review/memorize"
              className="mt-3 block min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] py-3.5 text-center text-sm font-extrabold text-white"
            >
              + {tr(locale, "Үг нэмэх")}
            </Link>
          </div>
        )}

        <div className="mt-6">
          {learning > 0 ? (
            <Link href="/review/memorize" className={ROW_CLASS}>
              <span>{tr(locale, "Үг нэмэх")}</span>
              <span aria-hidden>＋</span>
            </Link>
          ) : null}
          <Link href="/kanji/handwriting" className={ROW_CLASS}>
            <span>{tr(locale, "HSK ханз дарааллаар")}</span>
            <span aria-hidden>›</span>
          </Link>
          <Link href="/writing" className={ROW_CLASS}>
            <span>{tr(locale, "Ханзны дэвтэр, хэвлэх")}</span>
            <span aria-hidden>›</span>
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="bs-srs-done">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          ✅ {tr(locale, "Бичиж дууслаа!")}
        </h2>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {wordCount} {tr(locale, "үг бичлээ")} · ✅ {tally.known} · 🟡{" "}
          {tally.hard} · ❌ {tally.forgot}
        </p>
        <button
          type="button"
          onClick={() => void loadQueue(true)}
          className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
        >
          {tr(locale, "Үргэлжлүүлэх")}
        </button>
        <Link
          href="/review"
          className="mt-3 block min-h-[48px] w-full rounded-[14px] bg-[#EEE7FB] py-3.5 text-center text-sm font-extrabold text-[#4A4063]"
        >
          {tr(locale, "Давтах цэс рүү")}
        </Link>
      </div>
    );
  }

  if (!current) return null;

  const stepLabel = current.retry
    ? tr(locale, "Дахин бичье")
    : current.isNew
      ? tr(locale, "Шинэ үг — дагаж зураад, дараа нь санаж бич")
      : tr(locale, "Санаж бич");

  return (
    <div className="bs-wpl-stroke">
      <header className="bs-wpl-stroke-head">
        <h2 className="bs-wpl-stroke-title">{stepLabel}</h2>
        <p className="bs-wpl-stroke-meta">
          {Math.min(index + 1, wordCount)} / {wordCount}
        </p>
      </header>

      {/* Асуулт: утга + пиньинь + дуудлага. Давталтад ханзыг харуулахгүй. */}
      <div className="mb-3 rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-slate-200">
        <p className="text-lg font-bold text-[var(--app-text)]" translate="no">
          {current.meaning}
        </p>
        <div className="mt-1 flex items-center justify-center gap-2">
          {current.pinyin ? (
            <p className="text-base font-extrabold text-emerald-700">
              {current.pinyin}
            </p>
          ) : null}
          <SpeakerButton
            text={current.key}
            lang="zh"
            size="sm"
            label={tr(locale, "Дуудлага сонсох")}
            showInlineError={false}
          />
        </div>
      </div>

      {lastRating ? (
        <p
          className={`mb-2 text-center text-sm font-bold ${
            lastRating === "known"
              ? "text-emerald-600"
              : lastRating === "hard"
                ? "text-amber-600"
                : "text-rose-600"
          }`}
        >
          {lastRating === "known"
            ? `✅ ${tr(locale, "Алдаагүй бичлээ")}`
            : lastRating === "hard"
              ? `🟡 ${tr(locale, "Бага зэрэг алдлаа — удахгүй дахин бичнэ")}`
              : `❌ ${tr(locale, "Мартжээ — төгсгөлд нь дахин бичнэ")}`}
        </p>
      ) : null}

      <CharacterWriter
        key={`${current.key}-${index}`}
        character={{ hanzi: current.key, pinyin: [], practice: "write" }}
        mode={current.isNew ? "write" : "recall"}
        onResult={handleResult}
        onComplete={handleNext}
      />
    </div>
  );
}
