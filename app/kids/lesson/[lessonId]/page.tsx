import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { KidsLessonPlayer } from "@/components/kids/kids-lesson-player";
import { buildKidsLessonData } from "@/lib/kids/lesson-data";
import { coursePath } from "@/lib/content";
import { normalizeLessonRouteId } from "@/lib/lesson-id";
import { resolveLessonPageAccess, resolvePreviewFromPageSearchParams } from "@/lib/lesson-public-access";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { lessonId } = await params;
  return { title: `Хүүхдийн хичээл — ${lessonId} | Бөөндөө Сурцгаая` };
}

/** Хүүхдийн тоглуулагч — /kids/lesson/<lessonId> (YCT болон бусад зурагт багц). */
export default async function KidsLessonPage({ params, searchParams }: PageProps) {
  const { lessonId: rawId } = await params;
  const lessonId = normalizeLessonRouteId(rawId);
  const preview = await resolvePreviewFromPageSearchParams(searchParams);
  const access = await resolveLessonPageAccess(lessonId, { preview });
  if (access.kind !== "ok") notFound();

  const { lesson, adminPreview } = access;
  const videoRel = `/videos/yct/${lesson.id}.mp4`;
  const hasVideo = existsSync(path.join(process.cwd(), "public", videoRel));
  const posterRel = `/videos/yct/${lesson.id}-poster.jpg`;
  const hasPoster = hasVideo && existsSync(path.join(process.cwd(), "public", posterRel));

  const data = buildKidsLessonData(lesson, {
    videoUrl: hasVideo ? videoRel : lesson.videoUrl ?? null,
    videoPoster: hasPoster ? posterRel : null,
  });

  return <KidsLessonPlayer data={data} backHref={coursePath(lesson.courseId)} adminPreview={adminPreview} />;
}
