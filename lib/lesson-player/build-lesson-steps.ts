import { prioritizePrelessonVocab, toGameVocabItem } from "@/lib/games/game-data-core";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { isKoreanFlashcardVocabularyLesson } from "@/lib/lesson/korean-vocabulary-ui";
import { enhanceLessonQuizQuestions } from "@/lib/quiz/smart-options";
import { isHangulFoundationLessonId } from "@/lib/lesson-player/resolve-training-lesson-id";
import type { LessonContent } from "@/types/lesson-content";
import type { QuizQuestion, SubtitleExample, VocabularyWord } from "@/types/lesson";
import type {
  LessonStep,
  PracticeQuestion,
} from "@/types/lesson-player";

export type BuildLessonStepsOptions = {
  nextLessonId?: string | null;
};

function orderedVocabulary(
  lesson: LessonContent,
  vocabulary: VocabularyWord[]
): VocabularyWord[] {
  const items = vocabulary.map(toGameVocabItem);
  const sorted = prioritizePrelessonVocab(items, isPrelessonPackage(lesson));
  return sorted.map((item) => {
    const match =
      vocabulary.find((word) => word.id === item.id) ??
      vocabulary.find((word) => word.chinese === item.chinese);
    return match ?? {
      id: item.id,
      chinese: item.chinese,
      pinyin: item.pinyin,
      mongolian: item.mongolian,
      hskLevel: item.hskLevel,
      exampleChinese: item.exampleChinese,
      exampleMongolian: item.exampleMongolian,
    };
  });
}

function buildHangulFoundationSteps(
  lesson: LessonContent,
  vocabulary: VocabularyWord[],
  quizQuestions: QuizQuestion[],
  options: BuildLessonStepsOptions
): LessonStep[] {
  const vocab = orderedVocabulary(lesson, vocabulary);
  const enhancedQuiz = enhanceLessonQuizQuestions(quizQuestions, vocabulary);

  const practiceQuestions: PracticeQuestion[] = [
    {
      id: "p1",
      prompt: "ㄱ + ㅏ = ?",
      options: ["가", "나", "다", "라"],
      correctAnswer: "가",
      explanation: "ㄱ (гийгүүлэгч) + ㅏ (эгшиг) = 가",
    },
    {
      id: "p2",
      prompt: "ㅎ + ㅏ + ㄴ = ?",
      options: ["한", "한글", "안", "산"],
      correctAnswer: "한",
      explanation: "ㅎ + ㅏ + ㄴ = 한",
    },
    {
      id: "p3",
      prompt: "「a» гэсэн эгшиг аль вэ?",
      options: ["ㅏ", "ㅓ", "ㅗ", "ㅜ"],
      correctAnswer: "ㅏ",
    },
    {
      id: "p4",
      prompt: "Аль үед 받침 (доод гийгүүлэгч) байна вэ?",
      options: ["한", "글", "ㅏ", "ㄱ"],
      correctAnswer: "한",
      explanation: "한 — доод ㄴ нь 받침.",
    },
  ];

  const steps: LessonStep[] = [
    {
      type: "summary",
      title: "Товч танилцуулга",
      text:
        lesson.description?.trim() ||
        "Энэ хичээлээр солонгос үсэг буюу 한글-ийн үндэс, эгшиг, гийгүүлэгч, үе бүтээх, 받침-ийн ойлголтыг сурна.",
    },
    {
      type: "teacher_note",
      title: "한글 гэж юу вэ?",
      body:
        "한글 бол Солонгос хэлний бичиг үсэг. Үсгүүдийг зүгээр цуваа бичихгүй, үеийн блок болгон бичдэг.",
    },
    {
      type: "concept",
      title: "Солонгос хэл хэдэн үсэгтэй вэ?",
      content:
        "14 үндсэн гийгүүлэгч\n10 үндсэн эгшиг\nнийлмэл эгшиг, хос гийгүүлэгч нэмэгдэнэ.",
    },
    {
      type: "visual",
      title: "Үеийн бүтэц",
      lines: ["ㅎ + ㅏ + ㄴ = 한", "ㄱ + ㅡ + ㄹ = 글"],
    },
    {
      type: "concept",
      title: "Эгшиг",
      content:
        "Солонгос эгшиг — дуудлагын үндсэн дуу. Эхлээд эдгээрийг сурна.",
      items: ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
    },
    {
      type: "concept",
      title: "Гийгүүлэгч",
      content: "Гийгүүлэгч — эгшигийн өмнө эсвэл дараа залгана.",
      items: [
        "ㄱ",
        "ㄴ",
        "ㄷ",
        "ㄹ",
        "ㅁ",
        "ㅂ",
        "ㅅ",
        "ㅇ",
        "ㅈ",
        "ㅊ",
        "ㅋ",
        "ㅌ",
        "ㅍ",
        "ㅎ",
      ],
    },
    {
      type: "teacher_note",
      title: "Андуурагддаг дуудлага",
      body: [
        "ㅓ vs ㅗ",
        "ㅜ vs ㅡ",
        "ㄱ vs ㅋ vs ㄲ",
        "ㄷ vs ㅌ vs ㄸ",
        "ㅂ vs ㅍ vs ㅃ",
      ].join("\n"),
    },
  ];

  if (vocab.length > 0) {
    steps.push({
      type: "vocabulary_flashcard",
      vocabulary: vocab,
    });
  }

  steps.push({
    type: "practice",
    title: "Дасгал",
    questions: practiceQuestions,
  });

  steps.push({
    type: "quiz_intro",
    title: "Өөрийгөө шалгах",
    text: "Одоо богино quiz өгөөд хэр ойлгосноо шалгаарай.",
  });

  enhancedQuiz.forEach((question, index) => {
    steps.push({
      type: "quiz_question",
      question,
      index,
      total: enhancedQuiz.length,
    });
  });

  steps.push({ type: "result" });

  steps.push({
    type: "next_lesson",
    nextLessonId: options.nextLessonId ?? null,
    title: lesson.title,
    subtitle: lesson.chineseTitle,
  });

  return steps;
}

function subtitleToTeacherNote(sub: SubtitleExample): string {
  const parts = [sub.mongolian, sub.chinese, sub.pinyin].filter(Boolean);
  return parts.join("\n");
}

function buildKoreanPrelessonSteps(
  lesson: LessonContent,
  vocabulary: VocabularyWord[],
  quizQuestions: QuizQuestion[],
  options: BuildLessonStepsOptions
): LessonStep[] {
  const vocab = orderedVocabulary(lesson, vocabulary);
  const enhancedQuiz = enhanceLessonQuizQuestions(quizQuestions, vocabulary);
  const firstSubtitle = lesson.subtitlePreview[0];

  const steps: LessonStep[] = [
    {
      type: "summary",
      title: "Товч танилцуулга",
      text:
        lesson.description?.trim() ||
        lesson.subtitle?.trim() ||
        `${lesson.title} — солонгос үсэг, дуудлага, дасгал.`,
    },
  ];

  if (firstSubtitle) {
    steps.push({
      type: "teacher_note",
      title: lesson.chineseTitle || "Тайлбар",
      body: subtitleToTeacherNote(firstSubtitle),
    });
  }

  if (vocab.length > 0) {
    steps.push({
      type: "vocabulary_flashcard",
      vocabulary: vocab,
    });
  }

  if (enhancedQuiz.length > 0) {
    steps.push({
      type: "quiz_intro",
      title: "Өөрийгөө шалгах",
      text: "Одоо богино quiz өгөөд хэр ойлгосноо шалгаарай.",
    });

    enhancedQuiz.forEach((question, index) => {
      steps.push({
        type: "quiz_question",
        question,
        index,
        total: enhancedQuiz.length,
      });
    });
  }

  steps.push({ type: "result" });
  steps.push({
    type: "next_lesson",
    nextLessonId: options.nextLessonId ?? null,
    title: lesson.title,
    subtitle: lesson.chineseTitle,
  });

  return steps;
}

function buildGenericSteps(
  lesson: LessonContent,
  vocabulary: VocabularyWord[],
  quizQuestions: QuizQuestion[],
  options: BuildLessonStepsOptions
): LessonStep[] {
  const enhancedQuiz = enhanceLessonQuizQuestions(quizQuestions, vocabulary);
  const firstSubtitle = lesson.subtitlePreview[0];

  const steps: LessonStep[] = [
    {
      type: "summary",
      title: "Товч танилцуулга",
      text:
        lesson.description?.trim() ||
        lesson.subtitle?.trim() ||
        `${lesson.title} — үг, дасгал, quiz.`,
    },
  ];

  if (firstSubtitle) {
    steps.push({
      type: "concept",
      title: "Тайлбар",
      content: firstSubtitle.mongolian || firstSubtitle.chinese,
    });
  }

  if (vocabulary.length > 0) {
    steps.push({
      type: "vocabulary_flashcard",
      vocabulary: vocabulary.slice(0, 20),
    });
  }

  if (enhancedQuiz.length > 0) {
    steps.push({
      type: "quiz_intro",
      title: "Quiz",
      text: "Сурсан зүйлээ шалгаарай.",
    });

    enhancedQuiz.forEach((question, index) => {
      steps.push({
        type: "quiz_question",
        question,
        index,
        total: enhancedQuiz.length,
      });
    });
  }

  steps.push({ type: "result" });
  steps.push({
    type: "next_lesson",
    nextLessonId: options.nextLessonId ?? null,
    title: lesson.title,
    subtitle: lesson.chineseTitle,
  });

  return steps;
}

export function buildLessonSteps(
  lesson: LessonContent,
  vocabulary: VocabularyWord[],
  quizQuestions: QuizQuestion[],
  subtitles: SubtitleExample[],
  options: BuildLessonStepsOptions = {}
): LessonStep[] {
  void subtitles;

  if (isHangulFoundationLessonId(lesson.id)) {
    return buildHangulFoundationSteps(
      lesson,
      vocabulary,
      quizQuestions,
      options
    );
  }

  if (isKoreanFlashcardVocabularyLesson(lesson, vocabulary)) {
    return buildKoreanPrelessonSteps(
      lesson,
      vocabulary,
      quizQuestions,
      options
    );
  }

  return buildGenericSteps(lesson, vocabulary, quizQuestions, options);
}

export function countProgressSteps(steps: LessonStep[]): number {
  return steps.filter((step) => step.type !== "result").length;
}
