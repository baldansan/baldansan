"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { WordSrsStudySession } from "@/components/review/word-srs-study-session";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { buildLocalQueue } from "@/lib/srs/local-word-srs";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { DAILY_SRS_GOAL, type WordSrsQueueItem } from "@/lib/srs/word-srs-types";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { getDueWordQueue } from "@/lib/supabase/user-word-srs";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";

type LoadState = "loading" | "ready" | "error";

type Props = {
  /** When true, parent provides MobileAppShell (review hub tabs). */
  embedded?: boolean;
};

export function ReviewSrsClient({ embedded = false }: Props) {
  useActivityTracker("review", "daily");
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<WordSrsQueueItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const loadQueue = useCallback(async () => {
    if (!hydrated) return;
    setLoadState("loading");
    setError(null);

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

    setQueue(buildLocalQueue(words, activeLevel));
    setLoadState("ready");
  }, [activeLevel, hydrated]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    void getStreakUnified()
      .then((r) => setStreak(r?.currentStreak ?? 0))
      .catch(() => setStreak(0));
  }, [queue]);

  const wrap = (content: ReactNode) =>
    embedded ? content : (
      <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_REVIEW}>
        {content}
      </MobileAppShell>
    );

  if (!hydrated || loadState === "loading") {
    return wrap(
      <p className="py-16 text-center text-sm text-[var(--app-muted)]">
        Ачааллаж байна…
      </p>
    );
  }

  if (loadState === "error") {
    return wrap(
      <>
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void loadQueue()}
          className="mx-auto block rounded-[14px] bg-[var(--app-primary)] px-5 py-3 text-sm font-bold text-white"
        >
          Дахин оролдох
        </button>
      </>
    );
  }

  if (queue.length === 0) {
    return wrap(
      <div className="bs-srs-done">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          Өнөөдөр давтах зүйл алга
        </h2>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {formatActiveHskLevel(activeLevel)} түвшинд шинэ эсвэл due карт байхгүй.
        </p>
        <button
          type="button"
          onClick={() => void loadQueue()}
          className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
        >
          Дахин ачаалах
        </button>
      </div>
    );
  }

  return wrap(
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1" aria-hidden />
        <HskLevelSelector className="shrink-0" />
      </div>
      <WordSrsStudySession
        queue={queue}
        userId={userId}
        title="Өнөөдрийн давталт"
        subtitle={
          <>
            {formatActiveHskLevel(activeLevel)}
            {streak > 0 ? (
              <span className="bs-srs-streak"> · 🔥 {streak}</span>
            ) : null}
          </>
        }
        progressGoal={DAILY_SRS_GOAL}
        showLoginHint
        showPracticeLauncher
        onRestart={() => void loadQueue()}
        completeTitle="✅ Өнөөдрийн давталт дууслаа!"
        completeMessage="Өнөөдрийн карт дууслаа."
      />
    </>
  );
}
