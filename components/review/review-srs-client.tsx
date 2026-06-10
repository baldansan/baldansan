"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { WordCharBreakdownPanel } from "@/components/review/word-char-breakdown-panel";
import { WordSrsRatingButtons } from "@/components/review/word-srs-rating-buttons";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import {
  buildLocalQueue,
  getLocalFavorites,
  rateLocalWordSrs,
  toggleLocalFavorite,
} from "@/lib/srs/local-word-srs";
import { recordActivity, getStreakUnified } from "@/lib/retention/retention-service";
import { DAILY_SRS_GOAL, type WordSrsQueueItem, type WordSrsRating } from "@/lib/srs/word-srs-types";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getDueWordQueue, rateWordSrs } from "@/lib/supabase/user-word-srs";

type LoadState = "loading" | "ready" | "error";

function normalizeWordPosTags(
  pos: string[] | string | null | undefined
): string[] {
  if (!pos) return [];
  if (Array.isArray(pos)) {
    return pos.map((tag) => String(tag).trim()).filter(Boolean);
  }
  const single = String(pos).trim();
  return single ? [single] : [];
}

export function ReviewSrsClient() {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<WordSrsQueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [sessionDone, setSessionDone] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => new Set());

  const current = queue[index];
  const total = queue.length;
  const progressPct = Math.round((sessionDone / DAILY_SRS_GOAL) * 100);

  const loadQueue = useCallback(async () => {
    if (!hydrated) return;
    setLoadState("loading");
    setError(null);
    setDone(false);
    setIndex(0);
    setFlipped(false);
    setSessionDone(0);

    if (hasSupabaseConfig) {
      const { userId: uid } = await getAuthenticatedUserId();
      if (uid) {
        setUserId(uid);
        const { items, error: queueError } = await getDueWordQueue(
          uid,
          activeLevel
        );
        if (queueError) {
          setError(queueError);
          setLoadState("error");
          return;
        }
        setQueue(items);
        setDone(items.length === 0);
        setLoadState("ready");
        return;
      }
      setUserId(null);
    }

    const { data: words, error: wordsError } = await fetchHskWordsByLevel(
      activeLevel,
      { limit: 500 }
    );
    if (wordsError) {
      setError(wordsError);
      setLoadState("error");
      return;
    }

    const localQueue = buildLocalQueue(words, activeLevel);
    setQueue(localQueue);
    setDone(localQueue.length === 0);
    setLoadState("ready");
  }, [activeLevel, hydrated]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    setFavoriteIds(getLocalFavorites());
  }, [index, loadState]);

  useEffect(() => {
    void getStreakUnified()
      .then((r) => setStreak(r?.currentStreak ?? 0))
      .catch(() => setStreak(0));
  }, [sessionDone]);

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
      return;
    }
    setIndex((i) => i + 1);
  }

  if (!hydrated || loadState === "loading") {
    return (
      <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  if (loadState === "error") {
    return (
      <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full px-4">
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void loadQueue()}
          className="mx-auto block rounded-[14px] bg-[var(--app-primary)] px-5 py-3 text-sm font-bold text-white"
        >
          Дахин оролдох
        </button>
      </MobileAppShell>
    );
  }

  if (done || !current) {
    return (
      <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full px-4 pb-8">
        <div className="bs-srs-done">
          <h2 className="text-xl font-bold text-[var(--app-text)]">
            {sessionDone > 0
              ? "✅ Өнөөдрийн давталт дууслаа!"
              : "Өнөөдөр давтах зүйл алга"}
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            {sessionDone > 0
              ? `${sessionDone} карт үнэллээ.`
              : `${formatActiveHskLevel(activeLevel)} түвшинд шинэ эсвэл due карт байхгүй.`}
          </p>
          <button
            type="button"
            onClick={() => void loadQueue()}
            className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
          >
            Дахин ачаалах
          </button>
        </div>
      </MobileAppShell>
    );
  }

  const word = current.word;
  const posTags = normalizeWordPosTags(word.pos);
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

  function renderCardChrome() {
    return (
      <>
        {posTags.length > 0 ? (
          <div className="bs-srs-tags">
            {posTags.map((tag) => (
              <span key={tag} className="bs-srs-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          className={`bs-srs-fav ${isFavorite ? "bs-srs-fav-on" : ""}`}
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "Дуртлаас хасах" : "Дуртлаад нэмэх"}
          aria-pressed={isFavorite}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </>
    );
  }

  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full px-4 pb-8">
      <header className="bs-srs-header">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="bs-srs-title">Өнөөдрийн давталт</h1>
            <p className="mt-0.5 text-xs font-bold text-[var(--app-muted)]">
              {formatActiveHskLevel(activeLevel)}
              {streak > 0 ? (
                <span className="bs-srs-streak"> · 🔥 {streak}</span>
              ) : null}
            </p>
          </div>
          <HskLevelSelector className="shrink-0" />
        </div>
        <div className="bs-srs-progress-track">
          <div
            className="bs-srs-progress-fill"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
        <p className="bs-srs-progress-label">
          {sessionDone} / {DAILY_SRS_GOAL} · {index + 1}/{total} карт
        </p>
        {!userId && hasSupabaseConfig ? (
          <p className="mt-2 text-[11px] text-[var(--app-muted)]">
            Нэвтэрвэл ахицаа бүх төхөөрөмж дээр хадгална.{" "}
            <Link href="/login" className="font-bold text-[var(--app-primary-dark)] underline">
              Нэвтрэх
            </Link>
          </p>
        ) : null}
      </header>

      <div className="bs-srs-flip-scene">
        <button
          type="button"
          className={`bs-srs-flip-card ${flipped ? "bs-srs-flip-card--flipped" : ""}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Урд тал руу буцах" : "Ар талыг харах"}
        >
          <div className="bs-srs-flip-inner">
            <div className="bs-srs-flip-face bs-srs-flip-front">
              {renderCardChrome()}
              <p className="bs-srs-hanzi-only">{word.simplified}</p>
              <p className="bs-srs-tap-hint">Дарж харуулна</p>
            </div>
            <div className="bs-srs-flip-face bs-srs-flip-back">
              {renderCardChrome()}
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
    </MobileAppShell>
  );
}
