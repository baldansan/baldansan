import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { KoreanLesson0StartScreen } from "@/components/lesson/korean-lesson0-start-screen";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import { isKoreanLesson0BeginnerFlow } from "@/lib/lesson/korean-lesson0-flow";
import { coursePath, getAllLessonIdsSync } from "@/lib/content";
import {
  resolveLessonPageAccess,
  resolvePreviewFromPageSearchParams,
} from "@/lib/lesson-public-access";
import { LessonDetailMediaSection } from "@/components/lesson-media-display";
import { LessonDetailOverview } from "@/components/lesson-detail-overview";
import {
  LessonSubtitlePreviewSection,
  LessonVocabPreviewSection,
} from "@/components/lesson/lesson-content-preview";
import { LessonProgressCard } from "@/components/lesson-progress-card";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { isVideoContent } from "@/lib/lesson-content-type";
import { inferLessonLanguage } from "@/lib/language-track";
import { KoreanTeachingVisuals } from "@/components/lesson/korean-teaching-visuals";
import {
  isKoreanFlashcardVocabularyLesson,
  koreanVocabularyStudyCtaLabel,
} from "@/lib/lesson/korean-vocabulary-ui";
import { HskLessonDetailView } from "@/components/lesson/hsk-lesson-detail-view";
import { isHskStructuredLesson } from "@/lib/lesson/hsk-lesson-content";
import { TeacherAssignmentCta } from "@/components/teacher/teacher-assignment-cta";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { secondaryScriptLabel } from "@/lib/course-display";
import { lessonPreviewPath } from "@/lib/lesson-publish";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

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
  const isLesson0 = isKoreanLesson0BeginnerFlow(lesson);
  const isHskLesson = isHskStructuredLesson(lesson);

  if (isLesson0) {
    return (
      <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[390px] lg:max-w-none">
        <div className="flex flex-col gap-4 pb-2">
          {adminPreview ? <AdminPreviewBanner /> : null}

          <Link
            href={coursePath(lesson.courseId)}
            className="inline-flex w-fit items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
          >
            ← Курс руу буцах
          </Link>

          <KoreanLesson0StartScreen lesson={lesson} adminPreview={adminPreview} />
        </div>
      </MobileAppShell>
    );
  }

  if (isHskLesson) {
    return (
      <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[390px] lg:max-w-none">
        <div className="flex flex-col gap-4 pb-2">
          {adminPreview ? <AdminPreviewBanner /> : null}
          <Link
            href={coursePath(lesson.courseId)}
            className="inline-flex w-fit items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
          >
            ← Курс руу буцах
          </Link>
          <HskLessonDetailView lesson={lesson} adminPreview={adminPreview} />
        </div>
      </MobileAppShell>
    );
  }

  const vocabularyPreview = lesson.vocabulary.slice(0, 3);
  const showSubtitles =
    isVideoContent(lesson) && lesson.subtitlePreview.length > 0;
  const isKorean = inferLessonLanguage(lesson) === "ko";
  const isPrelesson = isPrelessonPackage(lesson);
  const koreanFlashcard = isKoreanFlashcardVocabularyLesson(
    lesson,
    lesson.vocabulary
  );
  const vocabStudyLabel = koreanFlashcard
    ? koreanVocabularyStudyCtaLabel(lesson)
    : "Үгийн сан судлах";

  return (
    <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[390px] lg:max-w-none">
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

        {koreanFlashcard ? (
          <KoreanTeachingVisuals
            teachingImages={lesson.teachingImages}
            showFallbackDiagram={!lesson.thumbnailUrl}
          />
        ) : null}

        <LessonDetailOverview lesson={lesson} adminPreview={adminPreview} />

        {showSubtitles ? (
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
        ) : null}

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
            📚 {vocabStudyLabel}
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
            {isKorean
              ? "Энэ хичээлийн үгээр солонгос дасгал тоглоомууд."
              : "Энэ хичээлийн үгээр холбох, орчуулах, дараалал тоглоом тогло."}
          </p>
          <GamePracticeLinks
            lessonId={lesson.id}
            isKorean={isKorean}
            isPrelesson={isPrelesson}
            include={
              isKorean ? undefined : (["match", "translate", "arrange"] as const)
            }
          />
        </MobileCard>

        <LessonProgressCard lessonId={lesson.id} quizCount={lesson.quizCount} />
        <TeacherAssignmentCta lessonId={lesson.id} />
      </div>
    </MobileAppShell>
  );
}
