import Link from "next/link";
import { LessonEditForm } from "@/components/admin/lesson-edit-form";
import { EmptyState } from "@/components/empty-state";
import { analyzeLessonQa } from "@/lib/admin/lesson-qa";
import { getLessonById } from "@/lib/content";
import {
  getLessonCompleteness,
  type LessonCompleteness,
} from "@/lib/supabase/admin-content";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  return { title: `Edit lesson ${lessonId} — Admin` };
}

export default async function AdminEditLessonPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return (
      <EmptyState
          title="Хичээл олдсонгүй"
          description={`"${lessonId}" ID-тай хичээл байхгүй. Supabase эсвэл local fallback шалгана уу.`}
          action={
            <Link
              href="/admin/lessons"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              ← Хичээл удирдах
            </Link>
          }
        />
    );
  }

  const completenessResult = await getLessonCompleteness(lessonId);
  const initialCompleteness: LessonCompleteness =
    completenessResult.data ?? completenessFromLesson(lesson);

  return (
    <LessonEditForm lesson={lesson} initialCompleteness={initialCompleteness} />
  );
}

function completenessFromLesson(lesson: Awaited<ReturnType<typeof getLessonById>>) {
  if (!lesson) {
    return {
      hasMetadata: false,
      subtitleCount: 0,
      vocabularyCount: 0,
      quizCount: 0,
      readyToPublish: false,
    };
  }
  const qa = analyzeLessonQa(lesson);
  return {
    hasMetadata: qa.hasMetadata,
    subtitleCount: qa.subtitleCount,
    vocabularyCount: qa.vocabularyActual,
    quizCount: qa.quizActual,
    readyToPublish:
      qa.hasMetadata &&
      qa.subtitleCount > 0 &&
      qa.vocabularyActual > 0 &&
      qa.quizActual > 0,
  };
}
