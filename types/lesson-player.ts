import type { QuizQuestion, VocabularyWord } from "@/types/lesson";

export type LessonStepType =
  | "summary"
  | "teacher_note"
  | "concept"
  | "visual"
  | "vocabulary_flashcard"
  | "pronunciation"
  | "practice"
  | "quiz_intro"
  | "quiz_question"
  | "result"
  | "next_lesson";

export type PracticeQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

export type LessonStepSummary = {
  type: "summary";
  title: string;
  text: string;
  displayPhase?: number;
};

export type LessonStepTeacherNote = {
  type: "teacher_note";
  title: string;
  body: string;
  displayPhase?: number;
};

export type LessonStepConcept = {
  type: "concept";
  title: string;
  content: string;
  items?: string[];
  displayPhase?: number;
};

export type LessonStepVisual = {
  type: "visual";
  title: string;
  lines: string[];
  displayPhase?: number;
};

export type LessonStepVocabularyFlashcard = {
  type: "vocabulary_flashcard";
  vocabulary: VocabularyWord[];
  screenTitle?: string;
  displayPhase?: number;
};

export type LessonStepPronunciation = {
  type: "pronunciation";
  title: string;
  pairs: Array<{ left: string; right: string }>;
  note?: string;
  displayPhase?: number;
};

export type LessonStepPractice = {
  type: "practice";
  title: string;
  questions: PracticeQuestion[];
  displayPhase?: number;
};

export type LessonStepQuizIntro = {
  type: "quiz_intro";
  title: string;
  text: string;
  displayPhase?: number;
};

export type LessonStepQuizQuestion = {
  type: "quiz_question";
  question: QuizQuestion;
  index: number;
  total: number;
  displayPhase?: number;
};

export type LessonStepResult = {
  type: "result";
  displayPhase?: number;
};

export type LessonStepNextLesson = {
  type: "next_lesson";
  nextLessonId: string | null;
  title: string;
  subtitle?: string;
  displayPhase?: number;
};

export type LessonStep =
  | LessonStepSummary
  | LessonStepTeacherNote
  | LessonStepConcept
  | LessonStepVisual
  | LessonStepVocabularyFlashcard
  | LessonStepPronunciation
  | LessonStepPractice
  | LessonStepQuizIntro
  | LessonStepQuizQuestion
  | LessonStepResult
  | LessonStepNextLesson;

export type LessonPlayerSession = {
  stepIndex: number;
  flashcardIndex: number;
  practiceIndex: number;
  practiceCorrect: number;
  quizCorrectCount: number;
  quizAnswered: number;
  updatedAt: string;
};
