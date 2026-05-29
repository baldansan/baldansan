import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { LessonDetailMediaSection } from "@/components/lesson-media-display";
import { LessonDetailOverview } from "@/components/lesson-detail-overview";
import {
  LessonSubtitlePreviewSection,
  LessonVocabPreviewSection,
} from "@/components/lesson/lesson-content-preview";
import { LessonProgressCard } from "@/components/lesson-progress-card";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { TeacherAssignmentCta } from "@/components/teacher/teacher-assignment-cta";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import { getAllLessonIdsSync, coursePath } from "@/lib/content";
import { secondaryScriptLabel } from "@/lib/course-display";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { resolveLessonPageAccess, resolvePreviewFromPageSearchParams } from "@/lib/lesson-public-access";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

/** Fetch lesson from Supabase on each request when env is configured. */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getAllLessonIdsSync().map((lessonId) => ({ lessonId }));
}

export default async function LessonDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { lessonId } = await params;
  const preview = await resolvePreviewFromPageSearchParams(searchParams);
  const access = await resolveLessonPageAccess(lessonId, { preview });

  if (access.kind === "not_found") {
    notFound();
  }

  if (access.kind === "unavailable") {
    return (
      <LessonUnavailable
        lessonId={lessonId}
        courseId={access.lesson.courseId}
        showAdminLink={access.showAdminLink}
        showAdminPreviewLink={access.showAdminPreviewLink}
        accessDenied={access.accessDenied}
      />
    );
  }

  const { lesson, adminPreview } = access;
  const vocabularyPreview = lesson.vocabulary.slice(0, 3);

  return (
    <MobileAppShell activeTab="study" mainClassName="max-w-[390px] mx-auto w-full">
      <div className="flex flex-col gap-4 pb-2">
        {adminPreview ? <AdminPreviewBanner /> : null}

        <Link
          href={coursePath(lesson.courseId)}
          className="inline-flex w-fit items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
        >
          ← Курс руу буцах
        </Link>

        <MobilePageHeader
          title={lesson.title}
          subtitle={`${secondaryScriptLabel(lesson.courseId)}: ${lesson.chineseTitle}`}
          badge={`#${lesson.id}`}
        />
        {lesson.subtitle ? (
          <p className="-mt-2 text-sm leading-6 text-[var(--app-muted)]">
            {lesson.subtitle}
          </p>
        ) : null}

        <LessonDetailMediaSection lesson={lesson} adminPreview={adminPreview} />

        <LessonDetailOverview lesson={lesson} adminPreview={adminPreview} />

        <MobileCard padding="lg">
          <h2 className="text-sm font-bold text-[var(--app-text)]">
            Хадмал урьдчилсан
          </h2>
          <div className="mt-3">
            <LessonSubtitlePreviewSection
              lines={lesson.subtitlePreview}
              courseId={lesson.courseId}
            />
          </div>
        </MobileCard>

        <MobileCard padding="lg">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-bold text-[var(--app-text)]">
              Үгийн сан
            </h2>
            <Link
              href={lessonPreviewPath(lesson.id, {
                adminPreview,
                subpath: "vocabulary",
              })}
              className="shrink-0 text-xs font-semibold text-emerald-600"
            >
              Бүгд →
            </Link>
          </div>
          <div className="mt-3">
            <LessonVocabPreviewSection
              words={vocabularyPreview}
              courseId={lesson.courseId}
            />
          </div>
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview,
              subpath: "vocabulary",
            })}
            className="app-btn-secondary mt-4 w-full"
          >
            📚 Үгийн сан судлах
          </Link>
        </MobileCard>

        <MobileCard padding="lg">
          <h2 className="text-sm font-bold text-[var(--app-text)]">Quiz</h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {lesson.quizCount} quiz асуулт
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {lesson.quizTypes.map((type) => (
              <li
                key={type}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {type}
              </li>
            ))}
          </ul>
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview,
              subpath: "quiz",
            })}
            className="app-btn-primary mt-4 w-full"
          >
            ✓ {LEARNER_LESSON.quiz}
          </Link>
        </MobileCard>

        <MobileCard padding="lg" className="!border-purple-100">
          <h2 className="text-sm font-bold text-[var(--app-text)]">
            Тоглоомоор давтах
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Энэ хичээлийн үгээр холбох, орчуулах, дараалал тоглоом тогло.
          </p>
          <GamePracticeLinks
            lessonId={lesson.id}
            include={["match", "translate", "arrange"]}
          />
        </MobileCard>

        <LessonProgressCard lessonId={lesson.id} />
        <TeacherAssignmentCta lessonId={lesson.id} />
      </div>
    </MobileAppShell>
  );
}
