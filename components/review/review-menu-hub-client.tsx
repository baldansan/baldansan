"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TemeeImage } from "@/components/temee/temee-image";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { getStreakUnified } from "@/lib/retention/retention-service";
import {
  buildLocalQueue,
  getLocalWordSrsStats,
  readLocalStudiedWordIds,
} from "@/lib/srs/local-word-srs";
import { DAILY_SRS_GOAL } from "@/lib/srs/word-srs-types";
import {
  getAuthenticatedUserId,
  getSession,
  hasSupabaseConfig,
} from "@/lib/supabase/auth";
import {
  fetchHskLevelTotals,
  fetchHskWordsByIds,
  fetchHskWordsByLevel,
} from "@/lib/supabase/hsk-words";
import {
  getDueWordQueue,
  getUserWordSrsStats,
} from "@/lib/supabase/user-word-srs";
import type { BichlegContinueTarget } from "@/lib/bichleg/types";
import { fetchBichlegContinueTargetClient } from "@/lib/supabase/video-progress-client";
import { TEMEE_ASSETS } from "@/lib/temee/assets";

type Props = {
  testCount: number;
  helzuiModuleCount: number;
  hsk30LevelCount: number;
  hsk30PointCount: number;
};

type HubStats = {
  streak: number;
  dueCards: number;
  dailyDone: number;
  dailyGoal: number;
  studiedCount: number;
  accuracyPct: number;
};

export function ReviewMenuHubClient({
  testCount,
  helzuiModuleCount,
  hsk30LevelCount,
  hsk30PointCount,
}: Props) {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [displayName, setDisplayName] = useState("Суралцагч");
  const [stats, setStats] = useState<HubStats>({
    streak: 0,
    dueCards: 0,
    dailyDone: 0,
    dailyGoal: DAILY_SRS_GOAL,
    studiedCount: 0,
    accuracyPct: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bichlegContinue, setBichlegContinue] =
    useState<BichlegContinueTarget | null>(null);

  const loadStats = useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);

    const retention = await getStreakUnified().catch(() => null);
    const streak = retention?.currentStreak ?? 0;

    let dueCards = 0;
    let dailyDone = 0;
    let dailyGoal = DAILY_SRS_GOAL;
    let studiedCount = 0;
    let accuracyPct = 0;
    let userId: string | null = null;

    if (hasSupabaseConfig) {
      const auth = await getAuthenticatedUserId();
      userId = auth.userId;

      const session = await getSession();
      const email = session.data?.user?.email;
      if (email) {
        setDisplayName(email.split("@")[0] ?? "Суралцагч");
      }

      if (userId) {
        const { data } = await getUserWordSrsStats(userId);
        if (data) {
          dueCards = data.dueToday;
          dailyDone = data.dailyDone;
          dailyGoal = data.dailyGoal;
          studiedCount = data.studiedCount;
          accuracyPct = data.accuracyPct;
        } else {
          const { items } = await getDueWordQueue(userId, activeLevel);
          dueCards = items.length;
        }
      } else {
        const [{ totals }, { data: studiedWords }] = await Promise.all([
          fetchHskLevelTotals(),
          fetchHskWordsByIds(readLocalStudiedWordIds()),
        ]);
        const studiedWordLevels = new Map<number, number>();
        for (const word of studiedWords ?? []) {
          if (word.id == null) continue;
          const raw = word.hsk_level;
          if (raw == null || raw === "7-9") continue;
          const level = Number(raw);
          if (Number.isInteger(level) && level >= 1 && level <= 6) {
            studiedWordLevels.set(word.id, level);
          }
        }
        const local = getLocalWordSrsStats(totals, studiedWordLevels);
        dueCards = local.dueToday;
        dailyDone = local.dailyDone;
        dailyGoal = local.dailyGoal;
        studiedCount = local.studiedCount;
        accuracyPct = local.accuracyPct;
      }
    } else {
      const [{ totals }, { data: studiedWords }, { data: words }] =
        await Promise.all([
          fetchHskLevelTotals(),
          fetchHskWordsByIds(readLocalStudiedWordIds()),
          fetchHskWordsByLevel(activeLevel, { limit: 500 }),
        ]);
      const studiedWordLevels = new Map<number, number>();
      for (const word of studiedWords ?? []) {
        if (word.id == null) continue;
        const raw = word.hsk_level;
        if (raw == null || raw === "7-9") continue;
        const level = Number(raw);
        if (Number.isInteger(level) && level >= 1 && level <= 6) {
          studiedWordLevels.set(word.id, level);
        }
      }
      const local = getLocalWordSrsStats(totals, studiedWordLevels);
      dueCards = buildLocalQueue(words, activeLevel).length;
      dailyDone = local.dailyDone;
      dailyGoal = local.dailyGoal;
      studiedCount = local.studiedCount;
      accuracyPct = local.accuracyPct;
    }

    setStats({
      streak,
      dueCards,
      dailyDone,
      dailyGoal,
      studiedCount,
      accuracyPct,
    });

    if (userId) {
      const clip = await fetchBichlegContinueTargetClient();
      setBichlegContinue(clip);
    } else {
      setBichlegContinue(null);
    }

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

  const dailyGoalDone =
    !loading && stats.dailyDone >= stats.dailyGoal && stats.dailyGoal > 0;

  const greetTitle = dailyGoalDone
    ? "Өдрийн зорилт дууслаа! 🎉"
    : "Өнөөдрийн давталтаа хийе!";
  const greetSub = dailyGoalDone
    ? `Гайхалтай, ${displayName}! Үргэлжлүүлээрэй`
    : `${stats.dailyDone}/${stats.dailyGoal} карт · ${displayName}`;

  const memorizeStatus = hasSupabaseConfig
    ? `${formatActiveHskLevel(activeLevel)} · шинэ үгс`
    : "Шинэ үгс цээжлэх";

  const testStatus =
    testCount > 0 ? `${testCount} шалгалт бэлэн` : "Тест оруулаагүй байна";

  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav
      mainClassName={SHELL_MAIN_REVIEW}
    >
      <div className="bs-review-hub">
        <div className="bs-tm-topbar">
          <div className="bs-tm-hello">
            Сайн уу 👋
            <b>{displayName}</b>
          </div>
          <div className="bs-tm-streak-pill">
            <span aria-hidden>🔥</span>
            <div>
              <b>{stats.streak}</b>
              <span>өдөр</span>
            </div>
          </div>
        </div>

        <div className="bs-tm-greet">
          <TemeeImage
            variant="thumbsup"
            className="bs-tm-greet-img"
            width={86}
            height={86}
          />
          <div className="bs-tm-bubble">
            <p className="bs-tm-bubble-title">
              {loading ? "Ачааллаж байна…" : greetTitle}
            </p>
            <p className="bs-tm-bubble-sub">
              {loading ? "Түр хүлээнэ үү" : greetSub}
            </p>
          </div>
        </div>

        <div className="bs-tm-stat-row">
          <div className="bs-tm-stat">
            <div className="bs-tm-stat-ic" aria-hidden>
              📚
            </div>
            <div className="bs-tm-stat-n">
              {loading ? "—" : stats.studiedCount}
            </div>
            <div className="bs-tm-stat-l">Сурсан үг</div>
          </div>
          <div className="bs-tm-stat">
            <div className="bs-tm-stat-ic" aria-hidden>
              🎯
            </div>
            <div className="bs-tm-stat-n">
              {loading ? "—" : `${stats.accuracyPct}%`}
            </div>
            <div className="bs-tm-stat-l">Нарийвчлал</div>
          </div>
          <div className="bs-tm-stat">
            <div className="bs-tm-stat-ic" aria-hidden>
              ⚡
            </div>
            <div className="bs-tm-stat-n">
              {loading ? "—" : stats.dailyDone}
            </div>
            <div className="bs-tm-stat-l">Өнөөдөр</div>
          </div>
        </div>

        <p className="bs-tm-sec">Өнөөдөр юу хийх вэ?</p>

        <Link href="/review/daily" className="bs-tm-feat">
          <TemeeImage
            variant="point"
            className="bs-tm-feat-img"
            width={70}
            height={70}
          />
          <div className="flex-1 min-w-0">
            <p className="bs-tm-feat-title">Өнөөдрийн давталт 🔥</p>
            <p className="bs-tm-feat-sub">
              {loading ? "Ачааллаж байна…" : dueLabel}
            </p>
            <div className="bs-tm-feat-bar">
              <i style={{ width: `${loading ? 0 : progressPct}%` }} />
            </div>
          </div>
        </Link>

        <Link href="/study-plan" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>
            📅
          </span>
          <span className="flex-1 min-w-0">
            <span className="bs-tm-card-title">Сурах төлөвлөгөө</span>
            <span className="bs-tm-card-sub">Хичээл, давталт, бичлэг</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        {bichlegContinue ? (
          <Link href={bichlegContinue.href} className="bs-tm-card">
            <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>
              📺
            </span>
            <span className="flex-1 min-w-0">
              <span className="bs-tm-card-title">Бичлэг үргэлжлүүлэх</span>
              <span className="bs-tm-card-sub">
                {bichlegContinue.title} · {bichlegContinue.subtitle}
              </span>
            </span>
            <span className="bs-tm-card-chev" aria-hidden>›</span>
          </Link>
        ) : null}

        <Link href="/review/memorize" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>
            💡
          </span>
          <span className="flex-1 min-w-0">
            <span className="bs-tm-card-title">Шинэ үг цээжлэх</span>
            <span className="bs-tm-card-sub">{memorizeStatus}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <Link href="/review/tests" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--purple" aria-hidden>
            📝
          </span>
          <span className="flex-1 min-w-0">
            <span className="bs-tm-card-title">HSK загвар шалгалт</span>
            <span className="bs-tm-card-sub">{testStatus}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <p className="bs-tm-sec" style={{ marginTop: 18 }}>
          Дүрэм
        </p>

        <Link href="/review/grammar/structure" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>
            🧩
          </span>
          <span className="flex-1 min-w-0">
            <span className="bs-tm-card-title">Өгүүлбэрийн бүтэц</span>
            <span className="bs-tm-card-sub">
              {helzuiModuleCount} модуль · суурь
            </span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <Link href="/review/grammar/hsk30" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--red">
            <Image
              src={TEMEE_ASSETS.chineseIcon}
              alt=""
              width={48}
              height={48}
              className="bs-tm-ic-img"
            />
          </span>
          <span className="flex-1 min-w-0">
            <span className="bs-tm-card-title">HSK 3.0 дүрэм</span>
            <span className="bs-tm-card-sub">
              {hsk30LevelCount} түвшин · {hsk30PointCount} цэг
            </span>
          </span>
          <span className="bs-tm-badge-new">ШИНЭ</span>
        </Link>
      </div>
    </MobileAppShell>
  );
}
