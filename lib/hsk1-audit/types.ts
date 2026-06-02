export type Hsk1SourceStatus = "pending" | "partial" | "complete" | "blocked";

export type Hsk1CoverageStatus = "PASS" | "FAIL" | "NEEDS_REVIEW";

export type Hsk1SourceType =
  | "textbook"
  | "teacherBook"
  | "workbook"
  | "workbookAnswer"
  | "textbookAudio"
  | "workbookAudio";

export type Hsk1PageRef = number | "needs_manual_confirmation";

export type Hsk1CoverageRow = {
  id: string;
  sourceType: Hsk1SourceType;
  sourceFile: string;
  sourcePage: Hsk1PageRef | string;
  sourceSection: string;
  exactContentSummary: string;
  requiredInPackage: boolean;
  packageField: string;
  learnerUiSection: string;
  adminOnly: boolean;
  audioMapping: string | null;
  status: Hsk1CoverageStatus;
  notes: string;
};

export type Hsk1CoverageMatrix = {
  packageVersion: "HSK1_SOURCE_AUDIT_V1";
  lessonNumber: number;
  lessonId: string;
  chineseTitle: string;
  generatedAt: string;
  sourceFiles: Record<string, string>;
  summary: {
    totalRows: number;
    pass: number;
    fail: number;
    needsReview: number;
    requiredPending: number;
    packagingAllowed: boolean;
  };
  rows: Hsk1CoverageRow[];
};

export type Hsk1MasterLessonEntry = {
  lessonNumber: number;
  lessonId: string;
  chineseTitle: string;
  englishTitle: string;
  mongolianTitle: string;
  textbookPageStart: Hsk1PageRef;
  textbookPageEnd: Hsk1PageRef;
  teacherBookPageStart: Hsk1PageRef;
  teacherBookPageEnd: Hsk1PageRef;
  workbookPageStart: Hsk1PageRef;
  workbookPageEnd: Hsk1PageRef;
  workbookAnswerPageStart: Hsk1PageRef;
  workbookAnswerPageEnd: Hsk1PageRef;
  textbookAudioFiles: string[];
  workbookAudioFiles: string[];
  expectedTextbookSections: string[];
  expectedTeacherBookSections: string[];
  expectedWorkbookSections: string[];
  expectedAnswerSections: string[];
  expectedAppSections: string[];
  sourceStatus: Hsk1SourceStatus;
  coverageMatrixPath: string;
  lessonProfilePath: string;
  notes: string;
};

export type Hsk1MasterSourceIndex = {
  auditVersion: "HSK1_MASTER_SOURCE_INDEX_V1";
  generatedAt: string;
  courseId: "hsk1";
  courseTitle: "HSK Standard Course 1";
  sourceFiles: Record<string, string>;
  sourceFilesOnDisk: "not_in_repo" | "partial" | "complete";
  invalidLegacyPackages: Array<{
    lessonNumber: number;
    wrongChineseTitle: string;
    correctChineseTitle: string;
    reason: string;
  }>;
  acceptanceGate: {
    textbookCoveragePercent: number;
    teacherBookCoveragePercent: number;
    workbookCoveragePercent: number;
    workbookAnswerCoveragePercent: number;
    audioCoveragePercent: number;
    vocabularyCoveragePercent: number;
    characterCoveragePercent: number;
    learnerFlowReviewed: boolean;
    gameLogicReviewed: boolean;
    buildPasses: boolean;
    packagingBlocked: boolean;
    blockReason: string | null;
  };
  lessons: Hsk1MasterLessonEntry[];
};

export type Hsk1LessonProfile = {
  profileVersion: "HSK1_LESSON_PROFILE_V1";
  lessonNumber: number;
  lessonId: string;
  chineseTitle: string;
  coreSkill: string;
  mainGrammar: string[];
  mainFunction: string[];
  pronunciationFocus: string[];
  characterFocus: string[];
  workbookFocus: string[];
  commonMongolianLearnerMistakes: string[];
  recommendedGames: string[];
  forbiddenGames: string[];
  recommendedMnemonicImages: string[];
  recommendedPracticeFlow: string[];
  componentGameAllowed: boolean;
  strokeOrderGameRequired: boolean;
  enrichmentAllowed: boolean;
  enrichmentRequiresSourceComplete: boolean;
  notes: string;
};

export type Hsk1WorkbookExerciseTemplate = {
  lessonId: string;
  section: string;
  questionRange: "needs_manual_confirmation";
  exerciseType:
    | "listening"
    | "reading"
    | "pronunciation"
    | "characters"
    | "writing"
    | "matching"
    | "dialogue"
    | "stroke_order";
  sourcePage: "needs_manual_confirmation";
  instructionChinese: "pending_extraction";
  instructionEnglish: "pending_extraction";
  items: unknown[];
  audioFile: string | null;
  answerKeyRef: string | null;
  learnerVisible: boolean;
  answerVisibleToLearner: boolean;
};
