import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { LessonDetailMediaSection } from "@/components/lesson-media-display";
import { LessonDetailOverview } from "@/components/lesson-detail-overview";
import { LessonProgressCard } from "@/components/lesson-progress-card";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { TeacherAssignmentCta } from "@/components/teacher/teacher-assignment-cta";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import { getAllLessonIdsSync, coursePath } from "@/lib/content";
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
    <MobileAppShell activeTab="study">
      <div className="flex flex-col gap-5">
        {adminPreview ? <AdminPreviewBanner /> : null}
        <Link
          href={coursePath(lesson.courseId)}
          className="inline-flex w-fit items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
        >
          ← Курс руу буцах
        </Link>

        <section>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">
            Хичээл {lesson.id}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-snug tracking-tight sm:text-4xl">
            {lesson.title}
          </h1>
          <p className="mt-1 text-xl text-slate-700 sm:text-2xl">{lesson.chineseTitle}</p>
          <p className="mt-2 text-base leading-7 text-slate-600 sm:text-lg">
            {lesson.subtitle}
          </p>
        </section>

        <LessonDetailOverview lesson={lesson} adminPreview={adminPreview} />

        <LessonDetailMediaSection lesson={lesson} adminPreview={adminPreview} />

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Хадмал урьдчилсан</h2>
          <div className="mt-4 flex flex-col gap-4">
            {lesson.subtitlePreview.map((line) => (
              <div
                key={line.chinese}
                className="rounded-xl bg-emerald-50/50 p-4 ring-1 ring-emerald-100"
              >
                <p className="text-base font-medium text-slate-900">
                  {line.chinese}
                </p>
                <p className="mt-1 text-sm text-emerald-700">{line.pinyin}</p>
                <p className="mt-2 text-sm text-slate-600">{line.mongolian}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Үгийн сан урьдчилсан</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {vocabularyPreview.map((word) => (
              <li
                key={word.id}
                className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-semibold text-slate-900">
                    {word.chinese}{" "}
                    <span className="font-normal text-emerald-700">
                      / {word.pinyin}
                    </span>
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {word.hskLevel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{word.mongolian}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Link
              href={lessonPreviewPath(lesson.id, {
                adminPreview,
                subpath: "vocabulary",
              })}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Бүх үгс харах
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Quiz урьдчилсан</h2>
          <p className="mt-2 text-sm text-slate-600">
            {lesson.quizCount} quiz асуулт
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {lesson.quizTypes.map((type) => (
              <li
                key={type}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
              >
                {type}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Link
              href={lessonPreviewPath(lesson.id, {
                adminPreview,
                subpath: "quiz",
              })}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Quiz эхлэх
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-purple-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Тоглоомоор давтах</h2>
          <p className="mt-2 text-sm text-slate-600">
            Энэ хичээлийн үгээр холбох, орчуулах, дараалал тоглоом тогло.
          </p>
          <GamePracticeLinks
            lessonId={lesson.id}
            include={["match", "translate", "arrange"]}
          />
        </section>

        <LessonProgressCard lessonId={lesson.id} />
        <TeacherAssignmentCta lessonId={lesson.id} />
      </div>
    </MobileAppShell>
  );
}
