"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
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
import { fetchMistakes } from "@/lib/supabase/mistake-book";
import { countDueLocalWriting } from "@/lib/srs/writing-srs";

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
  const locale = useUiLocale();
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
  const [mistakeCount, setMistakeCount] = useState<number | null>(null);
  const [writingDue, setWritingDue] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

      setIsLoggedIn(Boolean(userId));
      if (userId) {
        void fetchMistakes(userId)
          .then(({ mistakes }) => setMistakeCount(mistakes.length))
          .catch(() => setMistakeCount(null));
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

  useEffect(() => {
    setWritingDue(countDueLocalWriting());
  }, []);

  const progressPct =
    stats.dailyGoal > 0
      ? Math.min(100, Math.round((stats.dailyDone / stats.dailyGoal) * 100))
      : 0;

  const shownName =
    displayName === "Суралцагч" ? tr(locale, "Суралцагч") : displayName;

  const dueLabel =
    stats.dueCards > 0
      ? `${stats.dueCards} ${tr(locale, "карт хүлээж байна")}`
      : tr(locale, "Өнөөдөр давтах зүйл алга");

  const dailyGoalDone =
    !loading && stats.dailyDone >= stats.dailyGoal && stats.dailyGoal > 0;

  const greetTitle = dailyGoalDone
    ? tr(locale, "Өдрийн зорилт дууслаа! 🎉")
    : tr(locale, "Өнөөдрийн давталтаа хийе!");
  const greetSub = dailyGoalDone
    ? `${tr(locale, "Гайхалтай,")} ${shownName}! ${tr(locale, "Үргэлжлүүлээрэй")}`
    : `${stats.dailyDone}/${stats.dailyGoal} ${tr(locale, "карт")} · ${shownName}`;

  const memorizeStatus = tr(locale, "Бүх түвшний үгийн сан");

  const testStatus =
    testCount > 0
      ? `${testCount} ${tr(locale, "шалгалт бэлэн")}`
      : tr(locale, "Тест оруулаагүй байна");

  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav
      mainClassName={SHELL_MAIN_REVIEW}
    >
      <div className="bs-review-hub">
        <div className="bs-tm-topbar">
          <div className="bs-tm-hello">
            {tr(locale, "Сайн уу 👋")}
            <b>{shownName}</b>
          </div>
          <div className="bs-tm-streak-pill">
            <span aria-hidden>🔥</span>
            <div>
              <b>{stats.streak}</b>
              <span>{tr(locale, "өдөр")}</span>
            </div>
          </div>
        </div>

        <div className="bs-tm-greet">
          <TemeeEmojiIcon
            variant="greet"
            className="bs-tm-greet-img"
            width={86}
            height={86}
          />
          <div className="bs-tm-bubble">
            <p className="bs-tm-bubble-title">
              {loading ? tr(locale, "Ачааллаж байна…") : greetTitle}
            </p>
            <p className="bs-tm-bubble-sub">
              {loading ? tr(locale, "Түр хүлээнэ үү") : greetSub}
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
            <div className="bs-tm-stat-l">{tr(locale, "Сурсан үг")}</div>
          </div>
          <div className="bs-tm-stat">
            <div className="bs-tm-stat-ic" aria-hidden>
              🎯
            </div>
            <div className="bs-tm-stat-n">
              {loading ? "—" : `${stats.accuracyPct}%`}
            </div>
            <div className="bs-tm-stat-l">{tr(locale, "Нарийвчлал")}</div>
          </div>
          <div className="bs-tm-stat">
            <div className="bs-tm-stat-ic" aria-hidden>
              ⚡
            </div>
            <div className="bs-tm-stat-n">
              {loading ? "—" : stats.dailyDone}
            </div>
            <div className="bs-tm-stat-l">{tr(locale, "Өнөөдөр")}</div>
          </div>
        </div>

        <p className="bs-tm-sec">{tr(locale, "Өнөөдөр юу хийх вэ?")}</p>

        <Link href="/review/daily" className="bs-tm-feat">
          <TemeeEmojiIcon
            variant="featured"
            className="bs-tm-feat-img"
            width={70}
            height={70}
          />
          <div className="flex-1 min-w-0">
            <p className="bs-tm-feat-title">{tr(locale, "Өнөөдрийн давталт 🔥")}</p>
            <p className="bs-tm-feat-sub">
              {loading ? tr(locale, "Ачааллаж байна…") : dueLabel}
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
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Сурах төлөвлөгөө")}</span>
            <span className="bs-tm-card-sub">{tr(locale, "Хичээл, давталт, бичлэг")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        {bichlegContinue ? (
          <Link href={bichlegContinue.href} className="bs-tm-card">
            <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>
              📺
            </span>
            <span className="bs-tm-card-body">
              <span className="bs-tm-card-title">{tr(locale, "Бичлэг үргэлжлүүлэх")}</span>
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
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Бүх HSK үг")}</span>
            <span className="bs-tm-card-sub">{memorizeStatus}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <Link href="/review/writing" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>
            ✍️
          </span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">
              {tr(locale, "Бичих давталт")}
              {writingDue > 0 ? ` · ${writingDue}` : ""}
            </span>
            <span className="bs-tm-card-sub">
              {writingDue > 0
                ? `${writingDue} ${tr(locale, "ханз бичихээр хүлээж байна")}`
                : tr(locale, "Бичсэн ханзууд чинь энд давтагдана")}
            </span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <Link href="/review/mistakes" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--red" aria-hidden>
            ❌
          </span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">
              {tr(locale, "Миний алдаанууд")}
              {mistakeCount != null && mistakeCount > 0
                ? ` · ${mistakeCount}`
                : ""}
            </span>
            <span className="bs-tm-card-sub">
              {!isLoggedIn
                ? tr(locale, "Нэвтэрч орвол хадгалагдана")
                : mistakeCount == null
                  ? "…"
                  : mistakeCount > 0
                    ? `${mistakeCount} ${tr(locale, "идэвхтэй алдаа")}`
                    : tr(locale, "Алдаа алга — маш сайн! ✅")}
            </span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <Link href="/review/tests" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--purple" aria-hidden>
            📝
          </span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "HSK бэлтгэл")}</span>
            <span className="bs-tm-card-sub">{testStatus}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <p className="bs-tm-sec" style={{ marginTop: 18 }}>
          {tr(locale, "Дүрэм")}
        </p>

        <Link href="/review/grammar/structure" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>
            🧩
          </span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Өгүүлбэрийн бүтэц")}</span>
            <span className="bs-tm-card-sub">
              {helzuiModuleCount} {tr(locale, "модуль")} · {tr(locale, "суурь")}
            </span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </Link>

        <Link href="/review/grammar/hsk30" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--red" aria-hidden>
            📚
          </span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "HSK 3.0 дүрэм")}</span>
            <span className="bs-tm-card-sub">
              {hsk30LevelCount} {tr(locale, "түвшин")} · {hsk30PointCount} {tr(locale, "цэг")}
            </span>
          </span>
          <span className="bs-tm-badge-new">{tr(locale, "ШИНЭ")}</span>
        </Link>
      </div>
    </MobileAppShell>
  );
}
