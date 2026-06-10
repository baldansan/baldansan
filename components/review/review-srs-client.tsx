"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { WordCharBreakdownPanel } from "@/components/review/word-char-breakdown-panel";
import { WordSrsRatingButtons } from "@/components/review/word-srs-rating-buttons";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { DAILY_SRS_GOAL, type WordSrsQueueItem } from "@/lib/srs/word-srs-types";
import {
  buildLocalQueue,
  getLocalFavorites,
  rateLocalWordSrs,
  toggleLocalFavorite,
} from "@/lib/srs/local-word-srs";
import { recordActivity } from "@/lib/retention/retention-service";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  getDueWordQueue,
  rateWordSrs,
} from "@/lib/supabase/user-word-srs";

type LoadState = "loading" | "ready" | "error";

function formatPos(pos?: string[]): string {
  if (!pos?.length) return "";
  return pos.slice(0, 2).join(", ");
}

export function ReviewSrsClient() {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<WordSrsQueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [sessionDone, setSessionDone] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const current = queue[index];
  const total = queue.length;
  const progressPct =
    total > 0 ? Math.round((sessionDone / DAILY_SRS_GOAL) * 100) : 0;

  const loadQueue = useCallback(async () => {
    if (!hydrated) return;
    setLoadState("loading");
    setError(null);
    setDone(false);
    setIndex(0);
    setRevealed(false);
    setSessionDone(0);

    const { data: words, error: wordsError } =
      await fetchHskWordsByLevel(activeLevel);
    if (wordsError) {
      setError(wordsError);
      setLoadState("error");
      return;
    }
    if (hasSupabaseConfig) {
      const { userId: uid, error: authError } = await getAuthenticatedUserId();
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
        setFavorites(getLocalFavorites());
        setLoadState("ready");
        return;
      }
      if (authError) {
        setUserId(null);
      }
    }

    const localQueue = buildLocalQueue(words, activeLevel);
    setQueue(localQueue);
    setDone(localQueue.length === 0);
    setFavorites(getLocalFavorites());
    setLoadState("ready");
  }, [activeLevel, hydrated]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    void getStreakUnified()
      .then((r) => setStreak(r?.currentStreak ?? 0))
      .catch(() => setStreak(0));
  }, [sessionDone]);

  const hskTag = useMemo(() => {
    if (!current?.word) return "";
    const level = current.word.hsk_level;
    const pos = formatPos(current.word.pos);
    if (level && pos) return `HSK${level} · ${pos}`;
    if (level) return `HSK${level}`;
    return pos;
  }, [current]);

  async function handleRate(
    rating: import("@/lib/srs/word-srs-types").WordSrsRating
  ) {
    if (!current?.word?.id || submitting) return;
    setSubmitting(true);

    const wordId = current.word.id;

    if (userId && hasSupabaseConfig) {
      await rateWordSrs(userId, wordId, rating, current.srs);
    } else {
      rateLocalWordSrs(wordId, rating, current.srs);
    }

    void recordActivity("review_opened");
    setSessionDone((n) => n + 1);
    setSubmitting(false);
    setRevealed(false);

    if (index >= queue.length - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
  }

  function toggleFavorite() {
    if (!current?.word?.id) return;
    const on = toggleLocalFavorite(current.word.id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (on) next.add(current.word.id!);
      else next.delete(current.word.id!);
      return next;
    });
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
            {sessionDone > 0 ? "✅ Өнөөдрийн давталт дууслаа!" : "Өнөөдөр давтах зүйл алга"}
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            {sessionDone > 0
              ? `${sessionDone} карт үнэллээ.`
              : "Шинэ үг эсвэл due карт хоосон байна."}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void loadQueue()}
              className="min-h-[48px] rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
            >
              Дахин ачаалах
            </button>
            <Link
              href="/games/meaning"
              className="min-h-[48px] rounded-[14px] border border-[var(--app-border)] bg-white text-center text-sm font-extrabold leading-[48px] text-[var(--app-text)]"
            >
              Тоглоом руу →
            </Link>
          </div>
        </div>
      </MobileAppShell>
    );
  }

  const word = current.word;
  const isFavorite = word.id ? favorites.has(word.id) : false;

  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full px-4 pb-8">
      <header className="bs-srs-header">
        <div>
          <h1 className="bs-srs-title">Өнөөдрийн давталт</h1>
          <div className="bs-srs-progress-track">
            <div
              className="bs-srs-progress-fill"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <p className="bs-srs-progress-label">
            {sessionDone} / {DAILY_SRS_GOAL}
            {streak > 0 ? (
              <span className="bs-srs-streak">🔥 {streak}</span>
            ) : null}
          </p>
        </div>
        {!userId && hasSupabaseConfig ? (
          <Link href="/login" className="bs-srs-login-hint">
            Нэвтрэх
          </Link>
        ) : null}
      </header>

      <div
        className={`bs-srs-card ${revealed ? "bs-srs-card-flipped" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => !revealed && setRevealed(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!revealed) setRevealed(true);
          }
        }}
      >
        <div className="bs-srs-card-face bs-srs-card-front">
          {hskTag ? <span className="bs-srs-tag">{hskTag}</span> : null}
          <button
            type="button"
            className={`bs-srs-fav ${isFavorite ? "bs-srs-fav-on" : ""}`}
            aria-label="Дуртай"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <p className="bs-srs-hanzi">{word.simplified}</p>
          <button
            type="button"
            className="bs-srs-reveal-btn"
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(true);
            }}
          >
            Харах
          </button>
        </div>

        {revealed ? (
          <div className="bs-srs-card-face bs-srs-card-back">
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
            <WordCharBreakdownPanel text={word.simplified ?? ""} />
          </div>
        ) : null}
      </div>

      {revealed ? (
        <WordSrsRatingButtons
          disabled={submitting}
          onRate={(rating) => void handleRate(rating)}
        />
      ) : (
        <p className="mt-3 text-center text-xs text-[var(--app-muted)]">
          {index + 1} / {total} карт
        </p>
      )}

      <Link
        href="/review/words"
        className="mt-4 block text-center text-xs font-bold text-[var(--app-primary-dark)] underline"
      >
        Хичээлийн үгсийн жагсаалт →
      </Link>
    </MobileAppShell>
  );
}
