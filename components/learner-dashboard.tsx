"use client";

import Link from "next/link";
import { features } from "@/lib/features";
import { useEffect, useState, type ReactNode } from "react";
import { DashboardQuickReview } from "@/components/dashboard-quick-review";
import { DashboardGameStatsCard } from "@/components/games/dashboard-game-stats-card";
import { EmptyState } from "@/components/empty-state";
import { PwaInstallCard } from "@/components/pwa-install-card";
import { StreakCard } from "@/components/retention/streak-card";
import { DailyGoalCard } from "@/components/retention/daily-goal-card";
import { LocalProgressNote } from "@/components/local-progress-note";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { lessonPath, lessonVocabularyPath } from "@/lib/content";
import {
  getLearnerDashboardStats,
  pickLatestQuizAttempt,
  resolveContinueLearning,
} from "@/lib/learner-progress";
import {
  getStreakUnified,
  type LearningRetentionSummary,
} from "@/lib/retention/retention-service";
import {
  DashboardEngagementCards,
  DashboardEngagementQuickActions,
} from "@/components/engagement/dashboard-engagement-cards";
import { checkDueRemindersAndNotify } from "@/lib/engagement/achievement-service";
import { getAllQuizResultsSmart, type QuizResultEntry } from "@/lib/progress";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

type Props = {
  hsk5LessonIds: string[];
  trackLabel?: string;
};

function DashboardShell({
  children,
  trackLabel,
}: {
  children: ReactNode;
  trackLabel?: string;
}) {
  return (
    <MobileAppShell activeTab="profile" mainClassName="max-w-[390px] mx-auto w-full">
      <MobilePageHeader
        title={trackLabel ? `Миний явц · ${trackLabel}` : "Миний сургалт"}
        subtitle="Ахиц, quiz, streak"
      />
      <div className="flex flex-col gap-4">{children}</div>
    </MobileAppShell>
  );
}

export function LearnerDashboard({ hsk5LessonIds, trackLabel }: Props) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState<string | undefined>();
  const [continueHref, setContinueHref] = useState("/courses/hsk5");
  const [continueLabel, setContinueLabel] = useState("HSK5 эхлэх");
  const [stats, setStats] = useState({
    completedLessons: 0,
    learnedWords: 0,
    quizAttempts: 0,
    averageQuizPercent: null as number | null,
  });
  const [latestQuiz, setLatestQuiz] = useState<QuizResultEntry | null>(null);
  const [retention, setRetention] = useState<LearningRetentionSummary | null>(
    null
  );

  useEffect(() => {
    async function load() {
      let user = null;
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        user = data;
      }
      setLoggedIn(Boolean(user));
      setEmail(user?.email);

      const cont = await resolveContinueLearning(hsk5LessonIds);
      if (cont) {
        setContinueHref(cont.href);
        setContinueLabel(cont.label);
      }

      const dashboardStats = await getLearnerDashboardStats(hsk5LessonIds);
      setStats({
        completedLessons: dashboardStats.completedLessons,
        learnedWords: dashboardStats.learnedWords,
        quizAttempts: dashboardStats.quizAttempts,
        averageQuizPercent: dashboardStats.averageQuizPercent,
      });

      const quizzes = await getAllQuizResultsSmart();
      setLatestQuiz(pickLatestQuizAttempt(quizzes));
      setRetention(await getStreakUnified());
      void checkDueRemindersAndNotify();
      setReady(true);
    }

    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [hsk5LessonIds]);

  if (!ready) {
    return (
      <DashboardShell trackLabel={trackLabel}>
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">Ачааллаж байна…</p>
      </DashboardShell>
    );
  }

  if (!loggedIn) {
    return (
      <DashboardShell trackLabel={trackLabel}>
        <EmptyState
          title="Нэвтрэх шаардлагатай"
          description="Dashboard дээр ахицаа харахын тулд account үүсгээрэй эсвэл нэвтэрнэ үү. Guest хэрэглэгч Courses хэсгээс үргэлжлүүлж болно."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Нэвтрэх
              </Link>
              <Link
                href="/courses/hsk5"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Guest — HSK5 үзэх
              </Link>
            </div>
          }
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell trackLabel={trackLabel}>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm text-emerald-700">Сайн байна уу</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Миний сургалт
        </h1>
        {email ? (
          <p className="mt-2 truncate text-sm text-slate-600">{email}</p>
        ) : null}
      </section>

      {retention ? <StreakCard summary={retention} /> : null}
      {retention ? <DailyGoalCard summary={retention} /> : null}

      <DashboardEngagementCards />
      <DashboardEngagementQuickActions />

      <section className="rounded-2xl bg-emerald-600 p-5 text-white sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold">Үргэлжлүүлэх</h2>
        <p className="mt-2 text-sm text-emerald-50">
          Дараагийн хичээлээ үргэлжлүүлээрэй.
        </p>
        <Link
          href={continueHref}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          {continueLabel}
        </Link>
      </section>

      <PwaInstallCard />

      <DashboardQuickReview
        continueHref={continueHref}
        latestQuiz={latestQuiz}
      />

      <DashboardGameStatsCard />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Дууссан хичээл", value: stats.completedLessons },
          { label: "Сурсан үг", value: stats.learnedWords },
          { label: "Quiz оролдлого", value: stats.quizAttempts },
          {
            label: "Quiz дундаж",
            value:
              stats.averageQuizPercent != null
                ? `${stats.averageQuizPercent}%`
                : "—",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Одоогийн курс</h2>
        {hsk5LessonIds.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Одоогоор хичээл алга. Import ZIP-ээр нэмнэ үү.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            {hsk5LessonIds.length} хичээл идэвхтэй
          </p>
        )}
        <Link
          href="/courses"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Курсын жагсаалт
        </Link>
      </section>

      {latestQuiz ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Сүүлийн quiz</h2>
          <p className="mt-2 text-sm text-slate-600">
            Хичээл {latestQuiz.lessonId}: {latestQuiz.result.score}/
            {latestQuiz.result.total} ({latestQuiz.result.percentage}%)
          </p>
          <Link
            href={lessonPath(latestQuiz.lessonId)}
            className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
          >
            Хичээл рүү →
          </Link>
        </section>
      ) : null}

      <section className="flex flex-wrap gap-3">
        <Link
          href={continueHref}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Үргэлжлүүлэх
        </Link>
        <Link
          href={lessonVocabularyPath(hsk5LessonIds[0] ?? "1")}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Үг давтах
        </Link>
        <Link
          href="/courses"
          className="min-h-[44px] rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Хичээлүүд
        </Link>
        <Link
          href="/profile"
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Профайл
        </Link>
        {features.b2b ? (
          <Link
            href="/my-assignments"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            My assignments
          </Link>
        ) : null}
      </section>

      <LocalProgressNote />
    </DashboardShell>
  );
}
