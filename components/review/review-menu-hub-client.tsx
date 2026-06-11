"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ReviewTablerIcon } from "@/components/review/review-tabler-icon";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { buildLocalQueue } from "@/lib/srs/local-word-srs";
import { DAILY_SRS_GOAL } from "@/lib/srs/word-srs-types";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
import {
  getDueWordQueue,
  getUserWordSrsStats,
} from "@/lib/supabase/user-word-srs";

type Props = {
  testCount: number;
};

type HubStats = {
  streak: number;
  dueCards: number;
  dailyDone: number;
  dailyGoal: number;
};

export function ReviewMenuHubClient({ testCount }: Props) {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [stats, setStats] = useState<HubStats>({
    streak: 0,
    dueCards: 0,
    dailyDone: 0,
    dailyGoal: DAILY_SRS_GOAL,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);

    const retention = await getStreakUnified().catch(() => null);
    const streak = retention?.currentStreak ?? 0;

    let dueCards = 0;
    let dailyDone = 0;
    let dailyGoal = DAILY_SRS_GOAL;

    if (hasSupabaseConfig) {
      const { userId } = await getAuthenticatedUserId();
      if (userId) {
        const { data } = await getUserWordSrsStats(userId);
        if (data) {
          dueCards = data.dueToday;
          dailyDone = data.dailyDone;
          dailyGoal = data.dailyGoal;
        } else {
          const { items } = await getDueWordQueue(userId, activeLevel);
          dueCards = items.length;
        }
      } else {
        const { data: words } = await fetchHskWordsByLevel(activeLevel, {
          limit: 500,
        });
        dueCards = buildLocalQueue(words, activeLevel).length;
      }
    } else {
      const { data: words } = await fetchHskWordsByLevel(activeLevel, {
        limit: 500,
      });
      dueCards = buildLocalQueue(words, activeLevel).length;
    }

    setStats({ streak, dueCards, dailyDone, dailyGoal });
    setLoading(false);
  }, [activeLevel, hydrated]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const progressPct =
    stats.dailyGoal > 0
      ? Math.min(100, Math.round((stats.dailyDone / stats.dailyGoal) * 100))
      : 0;

  const dueLabel =
    stats.dueCards > 0
      ? `${stats.dueCards} карт хүлээж байна`
      : "Өнөөдөр давтах зүйл алга";

  const memorizeStatus = hasSupabaseConfig
    ? `${formatActiveHskLevel(activeLevel)} · шинэ үгс`
    : "Шинэ үгс цээжлэх";

  const testStatus =
    testCount > 0 ? `${testCount} шалгалт бэлэн` : "Тест оруулаагүй байна";

  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav
      mainClassName="max-w-[390px] mx-auto w-full px-4 pb-8"
    >
      <div className="bs-review-hub">
        <div className="bs-review-hub-head">
          <h1 className="bs-review-hub-title">Давтах</h1>
          {stats.streak > 0 ? (
            <span className="bs-review-streak-chip">
              <ReviewTablerIcon
                name="flame"
                className="bs-review-streak-icon"
              />
              {stats.streak} өдөр
            </span>
          ) : null}
        </div>

        <p className="bs-review-hub-sub">Өнөөдөр юу хийх вэ?</p>

        <Link href="/review/daily" className="bs-review-feature-card">
          <div className="bs-review-feature-body">
            <p className="bs-review-feature-title">Өнөөдрийн давталт</p>
            <p className="bs-review-feature-meta">
              {loading ? "Ачааллаж байна…" : dueLabel}
            </p>
            <div className="bs-review-feature-track">
              <div
                className="bs-review-feature-fill"
                style={{ width: `${loading ? 0 : progressPct}%` }}
              />
            </div>
          </div>
          <ReviewTablerIcon
            name="chevron-right"
            className="bs-review-feature-arrow"
          />
        </Link>

        <div className="bs-review-hub-cards">
          <Link href="/review/memorize" className="bs-review-hub-card">
            <span className="bs-review-hub-icon bs-review-hub-icon--blue">
              <ReviewTablerIcon name="bulb" className="bs-review-hub-icon-svg" />
            </span>
            <span className="bs-review-hub-card-text">
              <span className="bs-review-hub-card-title">Шинэ үг цээжлэх</span>
              <span className="bs-review-hub-card-meta">{memorizeStatus}</span>
            </span>
            <ReviewTablerIcon
              name="chevron-right"
              className="bs-review-hub-chevron"
            />
          </Link>

          <Link href="/review/tests" className="bs-review-hub-card">
            <span className="bs-review-hub-icon bs-review-hub-icon--purple">
              <ReviewTablerIcon
                name="clipboard-check"
                className="bs-review-hub-icon-svg"
              />
            </span>
            <span className="bs-review-hub-card-text">
              <span className="bs-review-hub-card-title">HSK загвар шалгалт</span>
              <span className="bs-review-hub-card-meta">{testStatus}</span>
            </span>
            <ReviewTablerIcon
              name="chevron-right"
              className="bs-review-hub-chevron"
            />
          </Link>
        </div>
      </div>
    </MobileAppShell>
  );
}
