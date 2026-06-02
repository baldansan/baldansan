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
  /** Supabase `vocabulary_words.id` when content is loaded from DB */
  dbId?: number;
  chinese: string;
  pinyin: string;
  mongolian: string;
  hskLevel: string;
  exampleChinese: string;
  exampleMongolian: string;
  /** Optional import metadata — Hangul grouping when present. */
  skillTags?: string[];
  lessonSection?: string;
  /** Per-word audio URL (from ZIP import via source_note map). */
  audioUrl?: string;
  /** Component breakdown for mnemonic learning aid. */
  components?: Array<{ component: string; meaningMn: string }>;
  memoryHintMn?: string;
  mnemonicImageId?: string;
  mnemonicStatus?: "learning_aid_not_official_etymology";
  examplePinyin?: string;
  /** Mongolian-friendly pronunciation hint (import / source_note / fallback). */
  mongolianPronunciation?: string;
  pronunciationMn?: string;
  pronunciationHintMn?: string;
};

export type VocabularyFilter =
  | "all"
  | "HSK1"
  | "HSK2"
  | "HSK3"
  | "HSK4"
  | "HSK5";

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
  /** Supabase quiz_questions.id when loaded from DB. */
  dbId?: number;
  orderIndex?: number;
  type: QuizQuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  /** Optional import metadata — used for distractor generation when present. */
  skillTags?: string[];
  difficulty?: "easy" | "medium" | "hard";
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
