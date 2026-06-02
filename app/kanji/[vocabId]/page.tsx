import { notFound } from "next/navigation";
import { KanjiDetailClient } from "@/components/mobile/kanji-detail-client";
import {
  getAllPublicLessonsProbe,
  getPublicLessonById,
} from "@/lib/content";
import { resolveHanziCharacterData } from "@/lib/games/hanzi-component-data";
import { resolveLessonPracticeHanzi } from "@/lib/hanzi/writing-practice";
import { parseHskStudyContentFromLesson } from "@/lib/lesson/hsk-lesson-content";
import { inferLessonLanguage } from "@/lib/language-track";
import type { VocabularyWord } from "@/types/lesson";
import type { LessonContent } from "@/types/lesson-content";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ vocabId: string }>;
  searchParams: Promise<{ lessonId?: string; write?: string }>;
};

function findVocabInLessons(
  vocabId: string,
  lessons: LessonContent[]
): { word: VocabularyWord; lessonId: string; courseId: string } | null {
  const decoded = decodeURIComponent(vocabId);
  for (const lesson of lessons) {
    for (const word of lesson.vocabulary) {
      if (
        word.id === decoded ||
        word.id === vocabId ||
        word.chinese === decoded
      ) {
        return { word, lessonId: lesson.id, courseId: lesson.courseId };
      }
    }
  }
  return null;
}

function buildSyntheticHanziWord(
  char: string,
  lesson: LessonContent
): VocabularyWord {
  const study = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const fromNote = study.characterNotes.find((n) => n.chinese === char);
  const catalog = resolveHanziCharacterData(char, [], study.characterNotes);

  return {
    id: char,
    chinese: char,
    pinyin: fromNote?.pinyin ?? catalog?.pinyin ?? "",
    mongolian: fromNote?.mongolian ?? catalog?.meaningMn ?? char,
    hskLevel: lesson.courseId.toUpperCase().includes("HSK1")
      ? "HSK1"
      : "HSK",
    exampleChinese: "",
    exampleMongolian: "",
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { vocabId } = await params;
  const decoded = decodeURIComponent(vocabId);
  return { title: `${decoded} — Үсэг` };
}

export default async function KanjiDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { vocabId } = await params;
  const { lessonId: preferredLessonId, write } = await searchParams;
  const decoded = decodeURIComponent(vocabId);
  const lessons = await getAllPublicLessonsProbe();
  let found = findVocabInLessons(vocabId, lessons);

  const preferredLesson =
    preferredLessonId != null
      ? ((await getPublicLessonById(preferredLessonId)) ??
        lessons.find((l) => l.id === preferredLessonId))
      : null;

  if (!found && /^[\u4e00-\u9fff]$/.test(decoded) && preferredLesson) {
    const practiceHanzi = resolveLessonPracticeHanzi(
      preferredLesson.id,
      preferredLesson.vocabulary
    );
    if (practiceHanzi.includes(decoded)) {
      found = {
        word: buildSyntheticHanziWord(decoded, preferredLesson),
        lessonId: preferredLesson.id,
        courseId: preferredLesson.courseId,
      };
    }
  }

  if (!found) {
    notFound();
  }

  const lessonId =
    preferredLessonId && lessons.some((l) => l.id === preferredLessonId)
      ? preferredLessonId
      : found.lessonId;

  const lesson =
    (await getPublicLessonById(lessonId)) ??
    lessons.find((l) => l.id === lessonId);
  const study = lesson
    ? (lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson))
    : { characterNotes: [] as const };
  const lessonPracticeHanzi = lesson
    ? resolveLessonPracticeHanzi(lessonId, lesson.vocabulary)
    : [];

  return (
    <KanjiDetailClient
      word={found.word}
      lessonId={lessonId}
      courseId={found.courseId}
      taskCount={
        lessons.filter((l) =>
          l.vocabulary.some(
            (w) => w.chinese === found!.word.chinese || w.id === found!.word.id
          )
        ).length || 1
      }
      lessonPracticeHanzi={lessonPracticeHanzi}
      characterNotes={[...study.characterNotes]}
      openWriteOnMount={write === "1"}
      isKorean={lesson ? inferLessonLanguage(lesson) === "ko" : false}
    />
  );
}
