"use client";

import { useCallback, useEffect, useState } from "react";
import { PrefetchLink } from "@/components/navigation/prefetch-link";
import {
  readLocalSnapshot,
  useLocalSnapshot,
  writeLocalSnapshot,
} from "@/lib/cache/local-snapshot";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import { TemeeMascot } from "@/components/temee/temee-mascot";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { DAILY_SRS_GOAL } from "@/lib/srs/word-srs-types";
import {
  getAuthenticatedUserId,
  getSession,
  hasSupabaseConfig,
} from "@/lib/supabase/auth";
import { loadSrsHubStats } from "@/lib/review/srs-hub-stats";
import type { BichlegContinueTarget } from "@/lib/bichleg/types";
import { countSentenceCards } from "@/lib/bichleg/sentence-cards";
import { getUserWordSrsCounts } from "@/lib/supabase/user-word-srs";
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

/** localStorage-д хадгалах сүүлийн харагдац (stale-while-revalidate). */
type HubSnapshot = {
  stats: HubStats;
  displayName: string;
  isLoggedIn: boolean;
  mistakeCount: number | null;
  bichlegContinue: BichlegContinueTarget | null;
};

const HUB_SNAPSHOT_KEY = "review-hub:v1";

export function ReviewMenuHubClient({
  testCount,
  helzuiModuleCount,
  hsk30LevelCount,
  hsk30PointCount,
}: Props) {
  const locale = useUiLocale();
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [freshName, setDisplayName] = useState("Суралцагч");
  const [freshStats, setStats] = useState<HubStats>({
    streak: 0,
    dueCards: 0,
    dailyDone: 0,
    dailyGoal: DAILY_SRS_GOAL,
    studiedCount: 0,
    accuracyPct: 0,
  });
  const [fetching, setLoading] = useState(true);
  /** Шинэ утга Supabase-аас нэг удаа ирсэн үү (ирэхээс өмнө snapshot харуулна). */
  const [fresh, setFresh] = useState(false);
  const [freshBichleg, setBichlegContinue] =
    useState<BichlegContinueTarget | null>(null);
  const [freshMistakes, setMistakeCount] = useState<number | null>(null);
  const [writingDue, setWritingDue] = useState(0);
  const [savedWords, setSavedWords] = useState<{ total: number; due: number } | null>(null);
  const [sentenceCards, setSentenceCards] = useState({ total: 0, due: 0 });
  const [freshLoggedIn, setIsLoggedIn] = useState(false);

  // Stale-while-revalidate: localStorage дээрх сүүлийн утгыг эхний render-д
  // шууд харуулна (hydration-д аюулгүй hook); loadStats ард нь шинийг татаад солино.
  const snapshot = useLocalSnapshot<HubSnapshot>(HUB_SNAPSHOT_KEY);
  const useSnapshot = !fresh && snapshot != null && snapshot.stats != null;
  const stats = useSnapshot ? snapshot.stats : freshStats;
  const displayName = useSnapshot ? snapshot.displayName || "Суралцагч" : freshName;
  const isLoggedIn = useSnapshot ? Boolean(snapshot.isLoggedIn) : freshLoggedIn;
  const mistakeCount = useSnapshot ? (snapshot.mistakeCount ?? null) : freshMistakes;
  const bichlegContinue = useSnapshot ? (snapshot.bichlegContinue ?? null) : freshBichleg;
  const loading = fetching && !useSnapshot;

  const loadStats = useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);

    // Урьд нь 6-8 дуудлага дараалж (streak → auth → session → srs → bichleg) явдаг байсан —
    // Монголоос Токио хүртэлх roundtrip бүр 0.3–0.5с тул бүгдийг 2 үе шатаар зэрэг явуулна.
    const [retention, auth, session] = await Promise.all([
      getStreakUnified().catch(() => null),
      hasSupabaseConfig
        ? getAuthenticatedUserId().catch(() => ({ userId: null }))
        : Promise.resolve({ userId: null }),
      hasSupabaseConfig ? getSession().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    ]);
    const streak = retention?.currentStreak ?? 0;
    setSentenceCards(countSentenceCards());

    const userId: string | null = auth.userId ?? null;
    let bichlegClip: BichlegContinueTarget | null = null;
    let resolvedName = "Суралцагч";
    let resolvedMistakes: number | null = null;

    if (hasSupabaseConfig) {
      const email = session.data?.user?.email;
      if (email) {
        resolvedName = email.split("@")[0] ?? "Суралцагч";
        setDisplayName(resolvedName);
      }
      setIsLoggedIn(Boolean(userId));
      if (userId) {
        void fetchMistakes(userId)
          .then(({ mistakes }) => {
            resolvedMistakes = mistakes.length;
            setMistakeCount(mistakes.length);
            const prev = readLocalSnapshot<HubSnapshot>(HUB_SNAPSHOT_KEY);
            if (prev) writeLocalSnapshot(HUB_SNAPSHOT_KEY, { ...prev, mistakeCount: mistakes.length });
          })
          .catch(() => setMistakeCount(null));
      }
    }

    // Хүлээж буй карт, өдрийн зорилт — /home «Өнөөдөр» хэсэгтэй нэг эх сурвалж.
    const [srs, clip, savedCounts] = await Promise.all([
      loadSrsHubStats({ userId, activeLevel }).catch(() => null),
      userId ? fetchBichlegContinueTargetClient().catch(() => null) : Promise.resolve(null),
      userId ? getUserWordSrsCounts(userId).catch(() => null) : Promise.resolve(null),
    ]);
    bichlegClip = clip;
    setSavedWords(savedCounts);
    const { dueCards, dailyDone, dailyGoal, studiedCount, accuracyPct } = srs ?? {
      dueCards: 0,
      dailyDone: 0,
      dailyGoal: DAILY_SRS_GOAL,
      studiedCount: 0,
      accuracyPct: 0,
    };

    const nextStats: HubStats = {
      streak,
      dueCards,
      dailyDone,
      dailyGoal,
      studiedCount,
      accuracyPct,
    };
    setStats(nextStats);

    setBichlegContinue(userId ? bichlegClip : null);

    setLoading(false);
    setFresh(true);
    writeLocalSnapshot<HubSnapshot>(HUB_SNAPSHOT_KEY, {
      stats: nextStats,
      displayName: resolvedName,
      isLoggedIn: Boolean(userId),
      mistakeCount: resolvedMistakes,
      bichlegContinue: userId ? bichlegClip : null,
    });
  }, [activeLevel, hydrated]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    setWritingDue(countDueLocalWriting());
  }, []);

  const shownName =
    displayName === "Суралцагч" ? tr(locale, "Суралцагч") : displayName;

  const dueLabel =
    stats.dueCards > 0 && writingDue > 0
      ? `${stats.dueCards} ${tr(locale, "унших")} · ${writingDue} ${tr(locale, "бичих карт хүлээж байна")}`
      : stats.dueCards > 0
        ? `${stats.dueCards} ${tr(locale, "карт хүлээж байна")}`
        : writingDue > 0
          ? `${writingDue} ${tr(locale, "бичих карт хүлээж байна")}`
          : tr(locale, "Өнөөдөр давтах зүйл алга");

  const testStatus =
    testCount > 0
      ? `${testCount} ${tr(locale, "шалгалт бэлэн")}`
      : tr(locale, "Тест оруулаагүй байна");

  // Дуу · Бичлэг — доод цэснээс «Давтах» руу нүүсэн тул үргэлж харагдана.
  const bichlegCard = (
    <PrefetchLink href={bichlegContinue?.href ?? "/bichleg"} className="bs-tm-card">
      <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>
        📺
      </span>
      <span className="bs-tm-card-body">
        <span className="bs-tm-card-title">
          {bichlegContinue ? tr(locale, "Бичлэг үргэлжлүүлэх") : tr(locale, "Дуу · Бичлэг")}
        </span>
        <span className="bs-tm-card-sub">
          {bichlegContinue
            ? `${bichlegContinue.title} · ${bichlegContinue.subtitle}`
            : tr(locale, "Хадмалтай кино, дуугаар сонсголоо сайжруул")}
        </span>
      </span>
      <span className="bs-tm-card-chev" aria-hidden>›</span>
    </PrefetchLink>
  );

  /* PC (≥920px) баруун самбар — утсан дээр нуугдана (AppShell). */
  const rightRail = (
    <div className="bs-review-hub bs-review-hub--rail">
      <p className="bs-tm-sec">{tr(locale, "Өнөөдөр")}</p>
      <div className="bs-tm-stat-row">
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>🔥</div>
          <div className="bs-tm-stat-n">{loading ? "—" : stats.streak}</div>
          <div className="bs-tm-stat-l">{tr(locale, "өдөр")}</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>⚡</div>
          <div className="bs-tm-stat-n">{loading ? "—" : `${stats.dailyDone}/${stats.dailyGoal}`}</div>
          <div className="bs-tm-stat-l">{tr(locale, "карт")}</div>
        </div>
        <div className="bs-tm-stat">
          <div className="bs-tm-stat-ic" aria-hidden>✍️</div>
          <div className="bs-tm-stat-n">{writingDue}</div>
          <div className="bs-tm-stat-l">{tr(locale, "бичих")}</div>
        </div>
      </div>
      <p className="bs-tm-sec">{tr(locale, "Материал")}</p>
      <PrefetchLink href="/nom" className="bs-tm-card">
        <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>📖</span>
        <span className="bs-tm-card-body">
          <span className="bs-tm-card-title">{tr(locale, "Ном сонгох")}</span>
          <span className="bs-tm-card-sub">{tr(locale, "HSK 1–6 · YCT 1–6 · 发展汉语 — бүх ном")}</span>
        </span>
        <span className="bs-tm-card-chev" aria-hidden>›</span>
      </PrefetchLink>
      <PrefetchLink href="/library" className="bs-tm-card">
        <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>📚</span>
        <span className="bs-tm-card-body">
          <span className="bs-tm-card-title">{tr(locale, "Уншлагын сан")}</span>
          <span className="bs-tm-card-sub">{tr(locale, "Зурагт ном, хэлц·зүйр цэцэн үг")}</span>
        </span>
        <span className="bs-tm-card-chev" aria-hidden>›</span>
      </PrefetchLink>
    </div>
  );

  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav
      mainClassName={SHELL_MAIN_REVIEW}
      desktopWidth="wide"
      rightRail={rightRail}
    >
      <div className="bs-review-hub">
        <h1 className="bs-rv-title bs-page-in">{tr(locale, "Давтах")}</h1>

        <PrefetchLink href="/review/daily" className="bs-tm-feat">
          <TemeeEmojiIcon variant="featured" className="bs-tm-feat-img" width={70} height={70} />
          <div className="flex-1 min-w-0">
            <p className="bs-tm-feat-title">{tr(locale, "Өнөөдрийн давталт 🔥")}</p>
            <p className="bs-tm-feat-sub">{loading ? tr(locale, "Ачааллаж байна…") : dueLabel}</p>
          </div>
          <span className="bs-rv-go">{tr(locale, "Эхлэх")}</span>
        </PrefetchLink>

        <p className="bs-tm-sec" style={{ marginTop: 18 }}>{tr(locale, "Үг")}</p>
        <PrefetchLink href="/review/words" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>📌</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Миний үгс")}</span>
            <span className="bs-tm-card-sub">{savedWords && savedWords.total > 0
                ? savedWords.due > 0
                  ? `${savedWords.total} ${tr(locale, "үг")} · ${savedWords.due} ${tr(locale, "өнөөдөр давтах")}`
                  : `${savedWords.total} ${tr(locale, "үг")}`
                : tr(locale, "Хичээлээс хадгалсан үгс чинь энд цугларна")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
        <PrefetchLink href="/review/memorize" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>💡</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Бүх HSK үг")}</span>
            <span className="bs-tm-card-sub">{tr(locale, "Түвшин түвшнээр цээжлэх")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>

        <p className="bs-tm-sec" style={{ marginTop: 18 }}>{tr(locale, "Сонсох · Ярих")}</p>
        <PrefetchLink href={`/listen/daily?level=${activeLevel}`} className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--purple" aria-hidden>🎧</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Сонсголын сорил")}</span>
            <span className="bs-tm-card-sub">{tr(locale, "10 асуулт · 5 минут")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
        {bichlegCard}
        <PrefetchLink href="/talk" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>🗣️</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Ярилцах дадлага")}</span>
            <span className="bs-tm-card-sub">{tr(locale, "Дэлгүүр, гуанз, такси — хятадаар ярьж үз")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>

        <p className="bs-tm-sec" style={{ marginTop: 18 }}>{tr(locale, "Шалгалт")}</p>
        <PrefetchLink href="/review/tests" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--purple" aria-hidden>📝</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "HSK шалгалт")}</span>
            <span className="bs-tm-card-sub">{testCount > 0 ? `${testCount} ${tr(locale, "шалгалт")} · ${tr(locale, "сурах горим, жинхэнэ горим")}` : testStatus}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>

        <details className="group">
          <summary className="mt-4 flex cursor-pointer list-none items-center justify-between rounded-[20px] border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm font-extrabold text-[var(--app-text)] shadow-[var(--app-shadow)] [&::-webkit-details-marker]:hidden">
            <span>
              {tr(locale, "Бусад: бичих, ханз, дүрэм, өгүүлбэр")}
              {writingDue + sentenceCards.due > 0 ? ` · ${writingDue + sentenceCards.due}` : ""}
            </span>
            <span className="text-[var(--app-muted)] transition-transform group-open:rotate-180" aria-hidden>▾</span>
          </summary>
          <div className="mt-3">
        <PrefetchLink href="/review/writing" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>✍️</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Бичих давталт")}{writingDue > 0 ? ` · ${writingDue}` : ""}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
        <PrefetchLink href="/review/sentences" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--blue" aria-hidden>🔖</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Өгүүлбэрийн карт")}{sentenceCards.due > 0 ? ` · ${sentenceCards.due}` : ""}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
        <PrefetchLink href="/kanji" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>🈴</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Ханз, дуудлага, бичих дэвтэр")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
        <PrefetchLink href="/review/grammar/structure" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>🧩</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Өгүүлбэрийн бүтэц")}</span>
            <span className="bs-tm-card-sub">{helzuiModuleCount} {tr(locale, "модуль")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
        <PrefetchLink href="/review/grammar/hsk30" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--red" aria-hidden>📚</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "HSK дүрэм")}</span>
            <span className="bs-tm-card-sub">{hsk30LevelCount} {tr(locale, "түвшин")} · {hsk30PointCount} {tr(locale, "цэг")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
        <PrefetchLink href="/library" className="bs-tm-card">
          <span className="bs-tm-card-ic bs-tm-card-ic--green" aria-hidden>📖</span>
          <span className="bs-tm-card-body">
            <span className="bs-tm-card-title">{tr(locale, "Уншлагын сан")}</span>
            <span className="bs-tm-card-sub">{tr(locale, "Зурагт ном, хэлц·зүйр цэцэн үг")}</span>
          </span>
          <span className="bs-tm-card-chev" aria-hidden>›</span>
        </PrefetchLink>
          </div>
        </details>
      </div>
    </MobileAppShell>
  );
}
