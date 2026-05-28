import type {
  QuizQuestion,
  SubtitleExample,
  TimedSubtitle,
  VocabularyWord,
} from "@/types/lesson";

export type LessonContentStatus = "available" | "locked";

/** Database publish status (admin workflow). */
export type LessonPublishStatus = "draft" | "available" | "archived";

/** Admin media workflow flag on lessons table. */
export type LessonMediaStatus = "missing" | "pending" | "ready";

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
  /** Raw publish status from Supabase; local lessons use `status` only. */
  publishStatus: LessonPublishStatus;
  videoPlaceholder: string;
  watchTotalTime: string;
  /** External video URL when set in Supabase. */
  videoUrl?: string;
  /** Cover/thumbnail image URL. */
  thumbnailUrl?: string;
  /** Optional audio resource URL. */
  audioUrl?: string;
  /** Admin note about media source. */
  sourceNote?: string;
  /** missing | pending | ready */
  mediaStatus?: LessonMediaStatus | string;
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
