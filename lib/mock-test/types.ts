export type MockTestExamMode = "real" | "practice";

export type MockTestSection = {
  skill: string;
  /** Per-section time budget (minutes). Falls back to HSK-level defaults. */
  time_min?: number;
  audio_url?: string | null;
  parts?: Array<{
    part: number;
    q_type: string;
    range: [number, number];
    desc?: string;
  }>;
};

export type MockOption = {
  key: string;
  text?: string;
  image_url?: string | null;
};

export type MockTestRow = {
  id: string;
  hsk_level: number;
  title: string;
  total_questions: number;
  time_limit_min: number;
  has_writing: boolean;
  sections: MockTestSection[];
  created_at: string;
};

export type MockTestQuestionRow = {
  id: string;
  test_id: string;
  skill: string;
  part: number;
  q_no: number;
  q_type: string;
  stem: string | null;
  options: MockOption[] | null;
  correct_answer: string | null;
  autograde: string;
  points: number;
  audio_url: string | null;
  image_url: string | null;
  needs_image: boolean;
  tags: string[];
  target_lesson_id: string | null;
  explanation_mn: string | null;
};

export type MockTestAnswers = Record<string, string>;

export type MockTestScoreResult = {
  rawScore: number;
  maxScore: number;
  scoreBySkill: Record<string, number>;
  maxBySkill: Record<string, number>;
  gradedCount: number;
  manualCount: number;
  details: MockTestAnswerDetail[];
};

export type MockTestAnswerDetail = {
  qNo: number;
  questionId: string;
  skill: string;
  qType: string;
  userAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean | null;
  points: number;
  autograde: string;
  explanationMn: string | null;
};

export const SKILL_LABELS_MN: Record<string, string> = {
  listening: "Сонсгол",
  reading: "Унших",
  writing: "Бичих",
};
