"use client";

import dynamic from "next/dynamic";
import "@/components/lesson/lesson-player.css";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  countDueLocalWriting,
  getDueLocalWritingItems,
  mergeServerWritingEntries,
  type WritingSrsEntry,
} from "@/lib/srs/writing-srs";
import { recordWritingResult } from "@/lib/srs/writing-srs-sync";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { fetchServerWritingEntries } from "@/lib/supabase/user-writing-srs";
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

type Phase = "loading" | "study" | "done" | "empty";

export function WritingReviewClient() {
  const locale = useUiLocale();
  const [phase, setPhase] = useState<Phase>("loading");
  const [queue, setQueue] = useState<WritingSrsEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState<Record<WordSrsRating, number>>({
    known: 0,
    hard: 0,
    forgot: 0,
  });
  const [lastRating, setLastRating] = useState<WordSrsRating | null>(null);
  const [remaining, setRemaining] = useState(0);

  const loadQueue = useCallback(async () => {
    setPhase("loading");
    // Нэвтэрсэн бол серверийн мөрүүдийг локалтай нэгтгэнэ.
    if (hasSupabaseConfig) {
      try {
        const { userId } = await getAuthenticatedUserId();
        if (userId) {
          const server = await fetchServerWritingEntries(userId);
          mergeServerWritingEntries(server);
        }
      } catch {
        // офлайн — локалоороо үргэлжилнэ
      }
    }
    const due = getDueLocalWritingItems(SESSION_LIMIT);
    setQueue(due);
    setIndex(0);
    setTally({ known: 0, hard: 0, forgot: 0 });
    setLastRating(null);
    setPhase(due.length === 0 ? "empty" : "study");
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const current = queue[index];

  function handleResult(result: { mistakes: number; usedHint: boolean }) {
    if (!current) return;
    const { rating } = recordWritingResult(
      {
        key: current.key,
        wordId: current.wordId,
        pinyin: current.pinyin,
        meaning: current.meaning,
      },
      result
    );
    setLastRating(rating);
    setTally((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
  }

  function handleNext() {
    setLastRating(null);
    if (index >= queue.length - 1) {
      setRemaining(countDueLocalWriting());
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

  if (phase === "empty") {
    return (
      <div className="bs-srs-done">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          ✍️ {tr(locale, "Өнөөдөр бичих давталт алга")}
        </h2>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {tr(
            locale,
            "Үг цээжлэх, бичих сургалт дээр бичсэн ханзууд энд давтагдана."
          )}
        </p>
        <Link
          href="/review/memorize"
          className="mt-5 block min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] py-3.5 text-center text-sm font-extrabold text-white"
        >
          {tr(locale, "Үг цээжлэх рүү")}
        </Link>
        <Link
          href="/kanji/handwriting"
          className="mt-3 block min-h-[48px] w-full rounded-[14px] bg-[#eaf0ed] py-3.5 text-center text-sm font-extrabold text-[#3b473f]"
        >
          {tr(locale, "Бичих сургалт руу")}
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="bs-srs-done">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          ✅ {tr(locale, "Бичих давталт дууслаа!")}
        </h2>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {queue.length} {tr(locale, "үг бичлээ")} · ✅ {tally.known} · 🟡{" "}
          {tally.hard} · ❌ {tally.forgot}
        </p>
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => void loadQueue()}
            className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
          >
            {tr(locale, "Үргэлжлүүлэх")} · {remaining}
          </button>
        ) : null}
        <Link
          href="/review"
          className="mt-3 block min-h-[48px] w-full rounded-[14px] bg-[#eaf0ed] py-3.5 text-center text-sm font-extrabold text-[#3b473f]"
        >
          {tr(locale, "Давтах цэс рүү")}
        </Link>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="bs-wpl-stroke">
      <header className="bs-wpl-stroke-head">
        <h2 className="bs-wpl-stroke-title">
          ✍️ {tr(locale, "Бичих давталт")}
        </h2>
        <p className="bs-wpl-stroke-meta">
          {index + 1} / {queue.length}
        </p>
      </header>

      {/* Асуулт: утга + пиньинь + дуудлага. Ханзыг харуулахгүй. */}
      <div className="mb-3 rounded-2xl bg-white px-4 py-3 text-center ring-1 ring-slate-200">
        <p className="text-base font-bold text-[var(--app-text)]">
          {current.meaning}
        </p>
        <div className="mt-1 flex items-center justify-center gap-2">
          {current.pinyin ? (
            <p className="text-sm font-extrabold text-emerald-700">
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
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          {tr(locale, "Цээжээрээ бич — гүйцэтгэлээс чинь дараагийн давталт товлогдоно")}
        </p>
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
            ? `✅ ${tr(locale, "Алдаагүй бичлээ — дараа удаан хугацааны дараа давтагдана")}`
            : lastRating === "hard"
              ? `🟡 ${tr(locale, "Бага зэрэг алдсан — удахгүй дахин давтагдана")}`
              : `❌ ${tr(locale, "Сануулга хэрэглэсэн — маргааш дахин бичнэ")}`}
        </p>
      ) : null}

      <CharacterWriter
        key={`${current.key}-${index}`}
        character={{ hanzi: current.key, pinyin: [], practice: "write" }}
        mode="recall"
        onResult={handleResult}
        onComplete={handleNext}
      />
    </div>
  );
}
