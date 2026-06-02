/** Minimal v2 lesson types for interactive exercise components. */

export type ExerciseResult = {
  correct: boolean;
};

export type ExerciseOnResult = (result: ExerciseResult) => void;

export type LessonV2VocabularyItem = {
  id: string;
  zh: string;
  pinyin: string;
  pos?: string;
  mn: string;
  en?: string;
  example_zh?: string;
  srs?: boolean;
  beyond_syllabus?: boolean;
  audio?: string;
};

export type LessonV2WritingItem = {
  n: number;
  words: string[];
  answer: string;
};

export type LessonV2ListeningItem = {
  n: number;
  audio?: string;
  statement_zh?: string;
  options?: string[];
  answer?: string | boolean;
};

export type ListeningQuestionType = "true_false" | "mc";
