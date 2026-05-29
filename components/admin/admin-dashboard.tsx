"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAttentionList } from "@/components/admin/admin-attention-list";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminDashboardSection } from "@/components/admin/admin-dashboard-section";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminRecentActivity } from "@/components/admin/admin-recent-activity";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import type { AdminDashboardMetrics } from "@/lib/supabase/admin-analytics";
import type { AuthUser } from "@/types/auth";

type Props = {
  metrics: AdminDashboardMetrics;
};

export function AdminDashboard({ metrics }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    getCurrentUser().then(({ data }) => setUser(data));
  }, []);

  const avgScore =
    metrics.learnerProgress.averageQuizPercentage != null
      ? `${metrics.learnerProgress.averageQuizPercentage}%`
      : "—";

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Admin analytics
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Content metrics, QA health, media readiness, and learner progress at a
          glance.
        </p>
        {user ? (
          <p className="mt-2 text-sm text-slate-600">
            Signed in: {user.email ?? user.id}
          </p>
        ) : null}
      </section>

      {metrics.warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Analytics notes</p>
          <ul className="mt-2 list-inside list-disc">
            {metrics.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdminDashboardSection
        title="Overview"
        description="Lesson publish status across HSK5."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Total lessons"
            value={metrics.lessonStatus.totalLessons}
          />
          <AdminMetricCard
            label="Available"
            value={metrics.lessonStatus.availableCount}
          />
          <AdminMetricCard
            label="Draft"
            value={metrics.lessonStatus.draftCount}
            accent="amber"
          />
          <AdminMetricCard
            label="Archived"
            value={metrics.lessonStatus.archivedCount}
            accent="slate"
          />
        </div>
      </AdminDashboardSection>

      <AdminDashboardSection
        title="Content health"
        description="Subtitle, vocabulary, and quiz totals plus publish readiness."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Subtitle lines"
            value={metrics.contentTotals.totalSubtitleLines}
          />
          <AdminMetricCard
            label="Vocabulary words"
            value={metrics.contentTotals.totalVocabularyWords}
          />
          <AdminMetricCard
            label="Quiz questions"
            value={metrics.contentTotals.totalQuizQuestions}
          />
          <AdminMetricCard
            label="Ready to publish"
            value={metrics.contentQa.lessonsReadyToPublish}
            hint="≥1 sub, ≥5 vocab, ≥3 quiz"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Missing subtitles"
            value={metrics.contentQa.lessonsMissingSubtitles}
            accent="amber"
          />
          <AdminMetricCard
            label="Missing vocabulary"
            value={metrics.contentQa.lessonsMissingVocabulary}
            accent="amber"
          />
          <AdminMetricCard
            label="Missing quiz"
            value={metrics.contentQa.lessonsMissingQuiz}
            accent="amber"
          />
          <AdminMetricCard
            label="Needs review"
            value={metrics.contentQa.needsReviewCount}
            accent="amber"
          />
        </div>
      </AdminDashboardSection>

      <AdminDashboardSection
        title="Media readiness"
        description="Uploaded or linked thumbnail, video, and audio."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <AdminMetricCard
            label="Media ready"
            value={metrics.media.mediaReadyCount}
          />
          <AdminMetricCard
            label="Media pending"
            value={metrics.media.mediaPendingCount}
            accent="amber"
          />
          <AdminMetricCard
            label="Media missing"
            value={metrics.media.mediaMissingCount}
            accent="amber"
          />
          <AdminMetricCard
            label="With thumbnail"
            value={metrics.media.withThumbnailCount}
          />
          <AdminMetricCard
            label="With video"
            value={metrics.media.withVideoCount}
          />
          <AdminMetricCard
            label="With audio"
            value={metrics.media.withAudioCount}
          />
        </div>
      </AdminDashboardSection>

      <AdminDashboardSection
        title="Learner progress"
        description={
          metrics.learnerProgress.limitedByRls
            ? "May show only your own rows until admin read policies are added."
            : "Aggregated from progress tables."
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Users with progress"
            value={metrics.learnerProgress.usersWithLessonProgress}
          />
          <AdminMetricCard
            label="Completed lessons"
            value={metrics.learnerProgress.completedLessonRows}
          />
          <AdminMetricCard
            label="Learned words"
            value={metrics.learnerProgress.learnedVocabularyRows}
          />
          <AdminMetricCard
            label="Quiz attempts"
            value={metrics.learnerProgress.quizAttempts}
          />
          <AdminMetricCard
            label="Avg quiz score"
            value={avgScore}
            accent="slate"
          />
        </div>
      </AdminDashboardSection>

      <AdminDashboardSection
        title="Needs attention"
        description="Lessons with missing content or media — open edit to fix."
      >
        <AdminAttentionList items={metrics.needsAttention} />
      </AdminDashboardSection>

      <AdminDashboardSection title="Recent activity">
        <AdminRecentActivity
          quizAttempts={metrics.recentQuizAttempts}
          lessonProgress={metrics.recentLessonProgress}
        />
      </AdminDashboardSection>

      <AdminDashboardSection
        title="Quick actions"
        description="Jump to common admin workflows."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/analytics"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Learning analytics
          </Link>
          <Link
            href="/admin/lesson-builder"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Lesson Builder
          </Link>
          <Link
            href="/admin/lessons"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Content QA
          </Link>
          <Link
            href="/admin/lessons/new"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Create lesson
          </Link>
          <Link
            href="/review"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Review app
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Back to app
          </Link>
        </div>
      </AdminDashboardSection>

      <AdminDashboardSection
        title="Admin tools"
        description="Existing workflows — unchanged."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminCard
            title="Learning analytics"
            description={`${metrics.learnerProgress.quizAttempts} quiz attempts · ${metrics.learnerProgress.averageQuizPercentage ?? "—"}% avg · ${metrics.learnerProgress.completedLessonRows} completed`}
            href="/admin/analytics"
          />
          <AdminCard
            title="Content QA"
            description="Full lesson table with filters, media indicators, and preview links."
            href="/admin/lessons"
          />
          <AdminCard
            title="Lesson Builder"
            description="Draft → prompt → import → media → preview → publish checklist."
            href="/admin/lesson-builder"
          />
          <AdminCard
            title="Create draft lesson"
            description="New lesson metadata skeleton."
            href="/admin/lessons/new"
          />
          <AdminCard
            title="Media upload"
            description="Upload thumbnail, audio, video on any lesson edit page."
            href="/admin/lessons"
          />
        </div>
      </AdminDashboardSection>
    </div>
  );
}
