"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { VocabCard } from "@/components/lesson-exercises/vocab-card";
import { EXERCISE_PRIMARY } from "@/components/lesson-exercises/exercise-theme";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { resolveReviewDisplay } from "@/lib/reviews/resolve-review-display";
import type { ResolvedReviewDisplay } from "@/lib/reviews/resolve-review-display";
import type { ReviewRating, ReviewRow } from "@/lib/reviews/types";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  applyReviewRating,
  getDueReviews,
} from "@/lib/supabase/reviews";
import { SrsRatingButtons } from "./srs-rating-buttons";

type QueueEntry = {
  row: ReviewRow;
  display: ResolvedReviewDisplay;
};

export function TodayReviewClient() {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoadState("loading");
    setError(null);
    setDone(false);
    setIndex(0);
    setRevealed(false);

    if (!hasSupabaseConfig) {
      setError("Supabase тохиргоо дутуу байна.");
      setLoadState("error");
      return;
    }

    const { userId: uid, error: authError } = await getAuthenticatedUserId();
    if (!uid) {
      setError(authError ?? "Нэвтэрнэ үү.");
      setLoadState("error");
      return;
    }
    setUserId(uid);

    const { data, error: fetchError } = await getDueReviews(uid);
    if (fetchError) {
      setError(fetchError);
      setLoadState("error");
      return;
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      setQueue([]);
      setDone(true);
      setLoadState("ready");
      return;
    }

    const resolved = await Promise.all(
      rows.map(async (row) => ({
        row,
        display: await resolveReviewDisplay(row),
      }))
    );

    setQueue(resolved);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const current = queue[index];

  const handleRate = async (rating: ReviewRating) => {
    if (!current || !userId || submitting) return;
    setSubmitting(true);

    const { error: rateError } = await applyReviewRating(
      userId,
      current.row.id,
      rating
    );

    setSubmitting(false);

    if (rateError) {
      setError(rateError);
      return;
    }

    if (index >= queue.length - 1) {
      setDone(true);
      setQueue([]);
      return;
    }

    setIndex((value) => value + 1);
    setRevealed(false);
  };

  if (loadState === "loading") {
    return (
      <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[430px] lg:max-w-2xl">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  if (loadState === "error") {
    return (
      <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[430px] lg:max-w-2xl">
        <div className="py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
          {!userId ? (
            <Link
              href="/login"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full px-6 text-sm font-semibold text-white"
              style={{ backgroundColor: EXERCISE_PRIMARY }}
            >
              Нэвтрэх
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void loadQueue()}
              className="mt-4 min-h-[44px] rounded-full px-6 text-sm font-semibold text-white"
              style={{ backgroundColor: EXERCISE_PRIMARY }}
            >
              Дахин оролдох
            </button>
          )}
        </div>
      </MobileAppShell>
    );
  }

  if (done) {
    return (
      <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[430px] lg:max-w-2xl">
        <div className="py-16 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
            style={{ backgroundColor: `${EXERCISE_PRIMARY}20` }}
          >
            ✓
          </div>
          <h1 className="text-xl font-bold text-[var(--app-text)]">
            Өнөөдрийн давталт дууслаа!
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Дараагийн картууд due_at хүрэхэд энд харагдана.
          </p>
          <Link
            href="/home"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-full px-6 text-sm font-semibold text-white"
            style={{ backgroundColor: EXERCISE_PRIMARY }}
          >
            Нүүр рүү
          </Link>
        </div>
      </MobileAppShell>
    );
  }

  if (!current) {
    return null;
  }

  const progressLabel = `${index + 1} / ${queue.length}`;

  return (
    <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[430px] lg:max-w-2xl">
      <header className="mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: EXERCISE_PRIMARY }}
        >
          Өнөөдрийн давталт
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-[var(--app-text)]">
            {current.display.itemType === "vocab"
              ? "Үг санах"
              : current.display.itemType === "sentence"
                ? "Өгүүлбэр"
                : "Сонсох"}
          </h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {progressLabel}
          </span>
        </div>
      </header>

      <PageTransition transitionKey={current.row.id}>
        {current.display.itemType === "vocab" && current.display.vocab ? (
          <VocabCard
            word={current.display.vocab}
            audioUrl={current.display.audioUrl}
            reviewMode
            onReviewRating={(rating) => void handleRate(rating)}
          />
        ) : (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            {!revealed ? (
              <div className="py-8 text-center">
                {current.display.promptZh ? (
                  <p className="text-2xl font-bold text-slate-900">
                    {current.display.promptZh}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">{current.row.item_ref}</p>
                )}
                <p className="mt-3 text-sm text-slate-600">
                  {current.display.promptMn}
                </p>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-6 min-h-[44px] rounded-full px-6 text-sm font-semibold text-white"
                  style={{ backgroundColor: EXERCISE_PRIMARY }}
                >
                  Хариултыг харуулах
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm text-slate-600">
                  Хэр сайн санасныг үнэлнэ үү
                </p>
                <SrsRatingButtons
                  disabled={submitting}
                  onRate={(rating) => void handleRate(rating)}
                />
              </div>
            )}
          </div>
        )}
      </PageTransition>
    </MobileAppShell>
  );
}
