import type { LessonPackageType } from "@/lib/admin/lesson-package-type";
import type { LessonContentType } from "@/lib/lesson-content-type";
import type { TeachingImage } from "@/lib/lesson/teaching-media";
import type { HskStudyContent } from "@/lib/lesson/hsk-lesson-content";
import type {
  QuizQuestion,
  SubtitleExample,
  TimedSubtitle,
  VocabularyWord,
} from "@/types/lesson";

export type { LessonContentType } from "@/lib/lesson-content-type";

export type LessonContentStatus = "available" | "locked";

/** Database publish status (admin workflow). */
export type LessonPublishStatus = "draft" | "available" | "archived";

/** Admin media workflow flag on lessons table. */
export type LessonMediaStatus = "missing" | "pending" | "ready";

/** Internal release workflow (lessons.release_status). */
export type LessonReleaseStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived";

/** Release QA gate (lessons.qa_status — not content QA report). */
export type LessonWorkflowQaStatus = "needs_review" | "passed" | "failed";

export type LessonContent = {
  id: string;
  courseId: string;
  /** textbook | video | exam — drives learner watch/detail UI. */
  contentType?: LessonContentType;
  /** prelesson | lesson | textbook | exam — metadata for watch UI inference. */
  lessonType?: LessonPackageType | "textbook" | "exam";
  /** Content language tag from DB or import manifest (e.g. ko-MN, zh-MN). */
  language?: string;
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
  /** Hero image URL from Gold Standard package import. */
  imageUrl?: string;
  /** Optional audio resource URL. */
  audioUrl?: string;
  /** Admin note about media source. */
  sourceNote?: string;
  /** missing | pending | ready */
  mediaStatus?: LessonMediaStatus | string;
  /** Internal release workflow (Supabase release_status). */
  releaseStatus?: LessonReleaseStatus;
  /** Release QA gate (Supabase qa_status). */
  qaStatus?: LessonWorkflowQaStatus;
  approvedAt?: string;
  approvedBy?: string;
  releaseNotes?: string;
  lastReviewedAt?: string;
  subtitlePreview: SubtitleExample[];
  timedSubtitles: TimedSubtitle[];
  vocabulary: VocabularyWord[];
  quizQuestions: QuizQuestion[];
  quizTypes: string[];
  /** Parsed from source_note after ZIP import — teaching diagrams. */
  teachingImages?: TeachingImage[];
  /** Parsed from source_note — vocab id/chinese → audio URL map. */
  vocabularyAudioMap?: Record<string, string>;
  /** Per-vocab Mongolian pronunciation hints from source_note `vocabPronMn`. */
  vocabularyPronunciationMap?: Record<string, string>;
  /** Parsed HSK textbook sections from source_note (Chinese HSK import). */
  hskStudy?: HskStudyContent;
};

export type CourseContent = {
  id: string;
  title: string;
  subtitle: string;
  stats: { label: string }[];
  progress: { completed: number; total: number };
};
