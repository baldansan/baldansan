"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardQuickReview } from "@/components/dashboard-quick-review";
import { EmptyState } from "@/components/empty-state";
import { PwaInstallCard } from "@/components/pwa-install-card";
import { StreakCard } from "@/components/streak-card";
import { LocalProgressNote } from "@/components/local-progress-note";
import { PublicPageShell } from "@/components/public-page-shell";
import { lessonPath, lessonVocabularyPath } from "@/lib/content";
import {
  getLearnerDashboardStats,
  pickLatestQuizAttempt,
  resolveContinueLearning,
} from "@/lib/learner-progress";
import {
  getLearningRetentionSummarySmart,
  type LearningRetentionSummary,
} from "@/lib/learning-retention";
import { getAllQuizResultsSmart, type QuizResultEntry } from "@/lib/progress";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

type Props = {
  hsk5LessonIds: string[];
};

export function LearnerDashboard({ hsk5LessonIds }: Props) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState<string | undefined>();
  const [continueHref, setContinueHref] = useState("/courses/hsk5");
  const [continueLabel, setContinueLabel] = useState("Start HSK5");
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
      setRetention(await getLearningRetentionSummarySmart());
      setReady(true);
    }

    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [hsk5LessonIds]);

  if (!ready) {
    return (
      <PublicPageShell active="dashboard">
        <p className="py-16 text-center text-sm text-slate-500">Ачааллаж байна…</p>
      </PublicPageShell>
    );
  }

  if (!loggedIn) {
    return (
      <PublicPageShell active="dashboard">
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
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="dashboard">
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

      <section className="rounded-2xl bg-emerald-600 p-6 text-white sm:p-8">
        <h2 className="text-lg font-semibold">Continue learning</h2>
        <p className="mt-2 text-sm text-emerald-50">
          Дараагийн хичээлээ үргэлжлүүлээрэй.
        </p>
        <Link
          href={continueHref}
          className="mt-4 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          {continueLabel}
        </Link>
      </section>

      <PwaInstallCard />

      <DashboardQuickReview
        continueHref={continueHref}
        latestQuiz={latestQuiz}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Completed lessons", value: stats.completedLessons },
          { label: "Learned words", value: stats.learnedWords },
          { label: "Quiz attempts", value: stats.quizAttempts },
          {
            label: "Avg quiz score",
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
        <h2 className="text-lg font-semibold text-slate-900">Current course</h2>
        <p className="mt-2 text-sm text-slate-600">HSK5 Short Drama Chinese</p>
        <Link
          href="/courses/hsk5"
          className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Course roadmap
        </Link>
      </section>

      {latestQuiz ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent quiz</h2>
          <p className="mt-2 text-sm text-slate-600">
            Lesson {latestQuiz.lessonId}: {latestQuiz.result.score}/
            {latestQuiz.result.total} ({latestQuiz.result.percentage}%)
          </p>
          <Link
            href={lessonPath(latestQuiz.lessonId)}
            className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
          >
            Lesson detail →
          </Link>
        </section>
      ) : null}

      <section className="flex flex-wrap gap-3">
        <Link
          href={continueHref}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Continue learning
        </Link>
        <Link
          href={lessonVocabularyPath(hsk5LessonIds[0] ?? "1")}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Review vocabulary
        </Link>
        <Link
          href="/courses"
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Courses
        </Link>
        <Link
          href="/profile"
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Profile
        </Link>
      </section>

      <LocalProgressNote />
    </PublicPageShell>
  );
}
