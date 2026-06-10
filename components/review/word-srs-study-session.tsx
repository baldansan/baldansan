"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { WordCharBreakdownPanel } from "@/components/review/word-char-breakdown-panel";
import { WordSrsRatingButtons } from "@/components/review/word-srs-rating-buttons";
import { getPrimaryPosLabelMn } from "@/lib/hsk/pos-catalog";
import { recordActivity } from "@/lib/retention/retention-service";
import {
  getLocalFavorites,
  rateLocalWordSrs,
  toggleLocalFavorite,
} from "@/lib/srs/local-word-srs";
import type { WordSrsQueueItem, WordSrsRating } from "@/lib/srs/word-srs-types";
import { hasSupabaseConfig } from "@/lib/supabase/auth";
import { rateWordSrs } from "@/lib/supabase/user-word-srs";

type Props = {
  queue: WordSrsQueueItem[];
  userId: string | null;
  title: string;
  subtitle?: ReactNode;
  /** Progress denominator — defaults to queue length. Use DAILY_SRS_GOAL for daily review. */
  progressGoal?: number;
  showLoginHint?: boolean;
  hskLevelLabel?: string;
  onSessionComplete?: () => void;
  onRated?: () => void;
  completeTitle?: string;
  completeMessage?: string;
  onRestart?: () => void;
};

export function WordSrsStudySession({
  queue: initialQueue,
  userId,
  title,
  subtitle,
  progressGoal,
  showLoginHint = false,
  hskLevelLabel,
  onSessionComplete,
  onRated,
  completeTitle = "✅ Багц дууслаа!",
  completeMessage,
  onRestart,
}: Props) {
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(initialQueue.length === 0);
  const [sessionDone, setSessionDone] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQueue(initialQueue);
    setIndex(0);
    setFlipped(false);
    setDone(initialQueue.length === 0);
    setSessionDone(0);
    setError(null);
  }, [initialQueue]);

  useEffect(() => {
    setFavoriteIds(getLocalFavorites());
  }, [index]);

  const current = queue[index];
  const total = queue.length;
  const goal = progressGoal ?? total;
  const progressPct = Math.round((sessionDone / Math.max(1, goal)) * 100);
  const progressLabel = `${sessionDone} / ${goal} · ${index + 1}/${total} карт`;

  async function handleRate(rating: WordSrsRating) {
    if (!current?.word?.id || submitting) return;
    setSubmitting(true);

    const wordId = current.word.id;
    let updatedSrs = current.srs;

    if (userId && hasSupabaseConfig) {
      const { data, error: rateError } = await rateWordSrs(
        userId,
        wordId,
        rating,
        current.srs
      );
      if (rateError) {
        setError(rateError);
        setSubmitting(false);
        return;
      }
      updatedSrs = data;
    } else {
      updatedSrs = rateLocalWordSrs(wordId, rating, current.srs);
    }

    void recordActivity("review_opened");
    setSessionDone((n) => n + 1);
    setFlipped(false);
    setSubmitting(false);
    onRated?.();

    const reinsert: WordSrsQueueItem = {
      ...current,
      srs: updatedSrs,
      isNew: false,
    };

    if (rating === "forgot") {
      if (index >= queue.length - 1) {
        setQueue((prev) => [...prev, reinsert]);
        setIndex((i) => i + 1);
        return;
      }
      setQueue((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, reinsert);
        return next;
      });
      setIndex((i) => i + 1);
      return;
    }

    if (index >= queue.length - 1) {
      setDone(true);
      onSessionComplete?.();
      return;
    }
    setIndex((i) => i + 1);
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-red-600">{error}</p>
    );
  }

  if (done || !current) {
    return (
      <div className="bs-srs-done">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          {sessionDone > 0 ? completeTitle : "Энэ багц хоосон"}
        </h2>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {completeMessage ??
            (sessionDone > 0
              ? `${sessionDone} карт үнэллээ.`
              : "Сонгосон шүүлтэд үг олдсонгүй.")}
        </p>
        {onRestart ? (
          <button
            type="button"
            onClick={onRestart}
            className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
          >
            Буцах
          </button>
        ) : null}
      </div>
    );
  }

  const word = current.word;
  const isFavorite = word.id != null && favoriteIds.has(word.id);

  function handleToggleFavorite(event: MouseEvent) {
    event.stopPropagation();
    if (word.id == null) return;
    const nowFavorite = toggleLocalFavorite(word.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nowFavorite) next.add(word.id!);
      else next.delete(word.id!);
      return next;
    });
  }

  const posDisplay = getPrimaryPosLabelMn(word.pos);

  return (
    <>
      <header className="bs-srs-header">
        <div className="min-w-0">
          <h1 className="bs-srs-title">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-xs font-bold text-[var(--app-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="bs-srs-progress-track">
          <div
            className="bs-srs-progress-fill"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
        <p className="bs-srs-progress-label">{progressLabel}</p>
        {showLoginHint && !userId && hasSupabaseConfig ? (
          <p className="mt-2 text-[11px] text-[var(--app-muted)]">
            Нэвтэрвэл ахицаа бүх төхөөрөмж дээр хадгална.{" "}
            <Link
              href="/login"
              className="font-bold text-[var(--app-primary-dark)] underline"
            >
              Нэвтрэх
            </Link>
          </p>
        ) : null}
      </header>

      <div className="bs-srs-flip-scene">
        <div className="bs-srs-card-chrome">
          <div className="bs-srs-tags">
            {posDisplay ? (
              <span className="bs-srs-tag">{posDisplay}</span>
            ) : null}
            {hskLevelLabel ? (
              <span className="bs-srs-tag bs-srs-tag-hsk">{hskLevelLabel}</span>
            ) : null}
          </div>
          <button
            type="button"
            className={`bs-srs-fav ${isFavorite ? "bs-srs-fav-on" : ""}`}
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? "Дуртлаас хасах" : "Дуртлаад нэмэх"}
            aria-pressed={isFavorite}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>
        <button
          type="button"
          className={`bs-srs-flip-card ${flipped ? "bs-srs-flip-card--flipped" : ""}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Урд тал руу буцах" : "Ар талыг харах"}
        >
          <div className="bs-srs-flip-inner">
            <div className="bs-srs-flip-face bs-srs-flip-front">
              <p className="bs-srs-hanzi-only">{word.simplified}</p>
              <p className="bs-srs-tap-hint">Дарж харуулна</p>
            </div>
            <div className="bs-srs-flip-face bs-srs-flip-back">
              <p className="bs-srs-pinyin">{word.pinyin ?? "—"}</p>
              <p className="bs-srs-meaning">{word.meaning_mn ?? "—"}</p>
              {word.example_zh ? (
                <div className="bs-srs-example">
                  <p className="bs-srs-example-zh">{word.example_zh}</p>
                  {word.example_pinyin ? (
                    <p className="bs-srs-example-py">{word.example_pinyin}</p>
                  ) : null}
                  {word.example_mn ? (
                    <p className="bs-srs-example-mn">{word.example_mn}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </button>
      </div>

      {flipped ? <WordCharBreakdownPanel text={word.simplified} /> : null}

      {flipped ? (
        <WordSrsRatingButtons
          disabled={submitting}
          onRate={(rating) => void handleRate(rating)}
        />
      ) : (
        <p className="mt-3 text-center text-xs text-[var(--app-muted)]">
          Картыг дарж пиньинь, утга, жишээг харна
        </p>
      )}
    </>
  );
}
