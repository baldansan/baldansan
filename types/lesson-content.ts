import type {
  QuizQuestion,
  SubtitleExample,
  TimedSubtitle,
  VocabularyWord,
} from "@/types/lesson";

export type LessonContentStatus = "available" | "locked";

export type LessonContent = {
  id: string;
  courseId: string;
  title: string;
  chineseTitle: string;
  subtitle: string;
  description: string;
  duration: string;
  vocabularyCount: number;
  quizCount: number;
  status: LessonContentStatus;
  videoPlaceholder: string;
  watchTotalTime: string;
  subtitlePreview: SubtitleExample[];
  timedSubtitles: TimedSubtitle[];
  vocabulary: VocabularyWord[];
  quizQuestions: QuizQuestion[];
  quizTypes: string[];
};

export type CourseContent = {
  id: string;
  title: string;
  subtitle: string;
  stats: { label: string }[];
  progress: { completed: number; total: number };
};
