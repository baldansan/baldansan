"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { EmptyState } from "@/components/empty-state";
import { LearningConsistencyCard } from "@/components/retention/learning-consistency-card";
import { DailyGoalSettings } from "@/components/retention/daily-goal-settings";
import { AchievementList } from "@/components/engagement/achievement-list";
import { RetentionSyncCard } from "@/components/retention/retention-sync-card";
import { LocalProgressNote } from "@/components/local-progress-note";
import { ProgressSyncCard } from "@/components/progress-sync-card";
import { lessonPath } from "@/lib/content";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import type { AuthUser } from "@/types/auth";
import {
  countCompletedLessonsAll,
  countStartedLessons,
  getAccountLessonProgressSummary,
  getAccountVocabularyLearnedCount,
  getAllQuizResultsSmart,
  getLastActiveLessonId,
  getTotalLearnedWords,
  hasAnyProgress,
  type AccountLessonProgressSummary,
  type QuizResultEntry,
} from "@/lib/progress";
import {
  getStreakUnified,
  type LearningRetentionSummary,
} from "@/lib/retention/retention-service";

function formatQuizDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function ProfileDashboard() {
  const [ready, setReady] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [startedCount, setStartedCount] = useState(0);
  const [learnedWords, setLearnedWords] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResultEntry[]>([]);
  const [lastActiveLessonId, setLastActiveLessonId] = useState<string | null>(
    null
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountSummary, setAccountSummary] =
    useState<AccountLessonProgressSummary | null>(null);
  const [accountVocabCount, setAccountVocabCount] = useState<number | null>(
    null
  );
  const [syncRefreshKey, setSyncRefreshKey] = useState(0);
  const [retention, setRetention] = useState<LearningRetentionSummary | null>(
    null
  );

  useEffect(() => {
    async function refresh() {
      const localHasProgress = hasAnyProgress();
      setCompletedCount(countCompletedLessonsAll());
      setStartedCount(countStartedLessons());
      setLearnedWords(getTotalLearnedWords());
      const quizEntries = await getAllQuizResultsSmart();
      setQuizResults(quizEntries);
      setLastActiveLessonId(getLastActiveLessonId());

      let user: AuthUser | null = null;
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        user = data;
      }
      setAuthUser(user);
      setIsAdmin(user ? await isCurrentUserAdmin() : false);

      let summary: AccountLessonProgressSummary | null = null;
      let vocabCount: number | null = null;
      if (user?.id) {
        summary = await getAccountLessonProgressSummary(user.id);
        vocabCount = await getAccountVocabularyLearnedCount(user.id);
      }
      setAccountSummary(summary);
      setAccountVocabCount(vocabCount);

      const accountHasProgress = Boolean(
        summary && (summary.completed > 0 || summary.started > 0)
      );
      const accountHasVocab = Boolean(vocabCount && vocabCount > 0);
      setHasProgress(
        localHasProgress ||
          accountHasProgress ||
          accountHasVocab ||
          quizEntries.length > 0
      );

      setRetention(await getStreakUnified());

      setReady(true);
    }

    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [syncRefreshKey]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
        <AppHeader active="profile" />
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-16 pb-24 sm:px-6 md:pb-10">
          <p className="text-center text-sm text-slate-500">Ачааллаж байна...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="profile" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-2 sm:gap-8 sm:px-6 md:pb-10">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Миний суралцах ахиц
          </h1>
          <p className="mt-2 text-base text-slate-600">
            {authUser
              ? "Аккаунт болон энэ төхөөрөмж дээрх ахиц."
              : "Энэ төхөөрөмж дээр хадгалагдсан ахиц."}
          </p>
          <div className="mt-3">
            <LocalProgressNote />
          </div>
          {authUser ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Энэ төхөөрөмж дээр хадгалагдсан ахиц мөн хадгалагдсан хэвээр байна.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Нэвтэрсний дараа хичээл, үг, quiz ахицыг аккаунтаар хадгална. Одоогоор
              зөвхөн энэ төхөөрөмж дээр хадгалагдана.
            </p>
          )}
        </section>

        {authUser ? (
          <ProgressSyncCard
            onSynced={() => setSyncRefreshKey((key) => key + 1)}
          />
        ) : null}

        {authUser ? (
          <RetentionSyncCard
            onSynced={() => setSyncRefreshKey((key) => key + 1)}
          />
        ) : null}

        {!hasProgress ? (
          <section className="rounded-2xl bg-emerald-50/70 p-5 ring-1 ring-emerald-200">
            <h2 className="font-semibold text-emerald-900">Эхлэх заавар</h2>
            <p className="mt-2 text-sm text-emerald-800">
              App хэрхэн ажилладагийг onboarding-оос үзээд HSK5-аар эхлээрэй.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/onboarding"
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Onboarding
              </Link>
              <Link
                href="/courses/hsk5"
                className="rounded-full border border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-emerald-800"
              >
                Start HSK5
              </Link>
            </div>
          </section>
        ) : null}

        {authUser ? (
          <Link
            href="/dashboard"
            className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Open dashboard →
          </Link>
        ) : null}

        {retention ? <LearningConsistencyCard summary={retention} /> : null}

        <DailyGoalSettings
          isLoggedIn={Boolean(authUser)}
          onSaved={() => setSyncRefreshKey((key) => key + 1)}
        />

        <AchievementList />

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Engagement shortcuts</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/reminders" className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Reminders</Link>
            <Link href="/weekly-report" className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Weekly report</Link>
            <Link href="/notifications" className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Notifications</Link>
            <Link href="/study-plan" className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">Study plan</Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Notification preferences (push/email) — ирээдүйд нэмэгдэнэ. Одоогоор in-app only.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          {authUser ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900">
                Нэвтэрсэн хэрэглэгч
              </h2>
              <p className="mt-2 text-sm text-slate-600">{authUser.email}</p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {isAdmin ? "Admin эрхтэй хэрэглэгч" : "Энгийн хэрэглэгч"}
              </p>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  Admin самбар →
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900">
                Одоогоор нэвтрээгүй байна.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Нэвтэрсний дараа ахицаа аккаунтаар хадгална.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Нэвтрэх →
              </Link>
            </>
          )}
        </section>

        {authUser && (accountSummary || accountVocabCount !== null) ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Аккаунттай холбогдсон ахиц
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {accountSummary ? (
                <>
                  <div className="rounded-xl bg-emerald-50/80 p-4 text-center ring-1 ring-emerald-200">
                    <p className="text-2xl font-bold text-emerald-700">
                      {accountSummary.completed}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Дууссан хичээл
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/80 p-4 text-center ring-1 ring-emerald-200">
                    <p className="text-2xl font-bold text-emerald-700">
                      {accountSummary.started}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Эхэлсэн хичээл
                    </p>
                  </div>
                </>
              ) : null}
              {accountVocabCount !== null ? (
                <div className="rounded-xl bg-emerald-50/80 p-4 text-center ring-1 ring-emerald-200">
                  <p className="text-2xl font-bold text-emerald-700">
                    {accountVocabCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    Аккаунтанд хадгалсан үг
                  </p>
                </div>
              ) : null}
            </div>
            {accountSummary && accountSummary.completedLessonIds.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700">
                  Дууссан хичээлүүд
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {accountSummary.completedLessonIds.map((lessonId) => (
                    <li key={lessonId}>
                      <Link
                        href={lessonPath(lessonId)}
                        className="inline-flex rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                      >
                        Lesson {lessonId}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {!hasProgress ? (
          <EmptyState
            title="Одоогоор ахиц хадгалагдаагүй байна."
            description="Хичээл үзэж, үг сурч, quiz өгснөөр энд ахицаа харах боломжтой."
            action={
              <Link
                href="/courses/hsk5"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Start learning
              </Link>
            }
          />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                <p className="text-2xl font-bold text-emerald-700">
                  {completedCount}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Completed lessons
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                <p className="text-2xl font-bold text-emerald-700">
                  {startedCount}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Started lessons
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 sm:col-span-2">
                <p className="text-2xl font-bold text-emerald-700">
                  {learnedWords}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Learned vocabulary
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Continue learning
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {lastActiveLessonId
                  ? "Сүүлд үзсэн хичээлээ үргэлжлүүлээрэй."
                  : "HSK5 курсаас эхлээрэй."}
              </p>
              <div className="mt-4">
                {lastActiveLessonId ? (
                  <Link
                    href={lessonPath(lastActiveLessonId)}
                    className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    Continue Lesson {lastActiveLessonId} →
                  </Link>
                ) : (
                  <Link
                    href="/courses/hsk5"
                    className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    Start HSK5 Course →
                  </Link>
                )}
              </div>
            </section>

            {quizResults.length > 0 ? (
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {authUser
                    ? "Аккаунттай холбогдсон quiz үр дүн"
                    : "Recent quiz results"}
                </h2>
                {authUser ? (
                  <p className="text-sm text-slate-600">
                    Нэвтэрсэн үед quiz оролдлого Supabase-д хадгалагдана. Энэ
                    төхөөрөмж дээрх үр дүн мөн хадгалагдсан хэвээр байна.
                  </p>
                ) : null}
                {quizResults.map(({ lessonId, result }) => (
                  <article
                    key={lessonId}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        Lesson {lessonId}
                      </h3>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        Best {result.bestPercentage}%
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Latest: {result.score} / {result.total} ({result.percentage}
                      %)
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatQuizDate(result.updatedAt)}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={lessonPath(lessonId)}
                        className="text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
                      >
                        Open lesson →
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
