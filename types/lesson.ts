export type LessonStatus = "start" | "locked";

export type Lesson = {
  id: number;
  number: number;
  title: string;
  chineseTitle: string;
  description: string;
  durationMin: number;
  vocabulary: number;
  quizQuestions: number;
  status: LessonStatus;
  href: string | null;
};

export type SubtitleExample = {
  chinese: string;
  pinyin: string;
  mongolian: string;
};

export type TimedSubtitle = SubtitleExample & {
  start: string;
  end: string;
};

export type SubtitleMode = "chinese" | "mongolian" | "both";

export type LessonWatch = {
  title: string;
  subtitle: string;
  backHref: string;
  videoPlaceholder: string;
  currentTime: string;
  totalTime: string;
  timedSubtitles: TimedSubtitle[];
  vocabularyHref: string;
  quizHref: string;
};

export type VocabularyItem = {
  chinese: string;
  pinyin: string;
  mongolian: string;
  level: string;
};

export type VocabularyWord = {
  id: string;
  chinese: string;
  pinyin: string;
  mongolian: string;
  hskLevel: string;
  exampleChinese: string;
  exampleMongolian: string;
};

export type VocabularyFilter = "all" | "HSK4" | "HSK5";

export type LessonVocabulary = {
  title: string;
  subtitle: string;
  backHref: string;
  watchHref: string;
  quizHref: string;
  words: VocabularyWord[];
};

export type QuizQuestionType = "multiple_choice" | "cloze";

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type LessonQuiz = {
  title: string;
  subtitle: string;
  backHref: string;
  watchHref: string;
  vocabularyHref: string;
  courseHref: string;
  questions: QuizQuestion[];
};

export type LessonDetail = {
  id: number;
  title: string;
  subtitle: string;
  backHref: string;
  videoPlaceholder: string;
  watchHref: string;
  vocabularyHref: string;
  quizHref: string;
  subtitles: SubtitleExample[];
  vocabulary: VocabularyItem[];
  quiz: {
    questionCount: number;
    types: string[];
  };
  progress: {
    status: string;
    percent: number;
  };
};
