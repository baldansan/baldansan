import type { Hsk1CanonicalLesson } from "@/lib/hsk1-audit/canonical-lessons";
import {
  HSK1_CANONICAL_LESSONS,
  HSK1_SOURCE_FILES,
} from "@/lib/hsk1-audit/canonical-lessons";
import type {
  Hsk1CoverageMatrix,
  Hsk1CoverageRow,
  Hsk1LessonProfile,
  Hsk1MasterLessonEntry,
  Hsk1MasterSourceIndex,
} from "@/lib/hsk1-audit/types";

const TEXTBOOK_SECTIONS_BASE = [
  "lessonTitle",
  "textDialogue",
  "englishVersion",
  "newWords",
  "pinyinSection",
  "notesGrammar",
  "characters",
  "strokeOrder",
  "radicalsComponents",
  "culture",
  "sourceImages",
] as const;

const TEACHER_BOOK_SECTIONS = [
  "teachingGoals",
  "importantPatterns",
  "pronunciationPoints",
  "characterPoints",
  "functionalGoals",
  "teachingSteps",
  "reviewSteps",
  "practiceSuggestions",
  "classroomActivities",
  "supplementaryTools",
] as const;

const APP_SECTIONS_BASE = [
  "guidedWatchFlow",
  "vocabularyFlashcards",
  "quiz",
  "workbookPracticeCenter",
  "strokeGame",
  "audioPlayback",
  "adminSourceView",
] as const;

function rowId(lessonNumber: number, suffix: string): string {
  return `L${String(lessonNumber).padStart(2, "0")}-${suffix}`;
}

function buildTextbookRows(lesson: Hsk1CanonicalLesson): Hsk1CoverageRow[] {
  const rows: Hsk1CoverageRow[] = [];
  const l1PartialPass = lesson.lessonNumber === 1;

  const sections: Array<{
    key: string;
    section: string;
    summary: string;
    packageField: string;
    ui: string;
    adminOnly?: boolean;
    l1Status?: "PASS" | "NEEDS_REVIEW";
  }> = [
    {
      key: "TB-TITLE",
      section: "lessonTitle",
      summary: `Lesson ${lesson.lessonNumber}: ${lesson.chineseTitle}`,
      packageField: "lesson.json.title / chineseTitle",
      ui: "watch step 1 / lesson header",
      l1Status: l1PartialPass ? "PASS" : undefined,
    },
    {
      key: "TB-TEXT",
      section: "textDialogue",
      summary: "Official textbook dialogues / reading text",
      packageField: "texts.json.dialogues / hskStudyContent.dialogues",
      ui: "watch dialogue steps",
      l1Status: l1PartialPass ? "PASS" : undefined,
    },
    {
      key: "TB-EN",
      section: "englishVersion",
      summary: "English version of text if present in textbook",
      packageField: "texts.json.english / lesson.englishText",
      ui: "admin/source only unless learner toggle added",
      adminOnly: true,
    },
    {
      key: "TB-VOCAB",
      section: "newWords",
      summary: "Official new words (生词) for lesson",
      packageField: "vocabulary.json",
      ui: "vocabulary flashcards",
      l1Status: l1PartialPass ? "PASS" : undefined,
    },
    {
      key: "TB-PINYIN",
      section: "pinyinSection",
      summary: "Pinyin / pronunciation section if present",
      packageField: "lesson.json.pinyinPronunciation / guidedSteps pinyin",
      ui: "watch pinyin step",
      l1Status: lesson.lessonNumber <= 2 && l1PartialPass ? "PASS" : undefined,
    },
    {
      key: "TB-NOTES",
      section: "notesGrammar",
      summary: "Notes / grammar points (注释)",
      packageField: "notes.json / grammar.json",
      ui: "teacher-led explanation (not raw dump)",
    },
    {
      key: "TB-CLASS",
      section: "classroomExpressions",
      summary: "Classroom expressions (课堂用语) if present",
      packageField: "notes.json.classroomExpressions",
      ui: "optional mini-section",
      adminOnly: false,
    },
    {
      key: "TB-CHAR",
      section: "characters",
      summary: "Characters (汉字) taught in lesson",
      packageField: "lesson.json.characters / characterNotes",
      ui: "characters step + stroke game",
      l1Status: l1PartialPass ? "PASS" : undefined,
    },
    {
      key: "TB-STROKE",
      section: "strokeOrder",
      summary: "Stroke order for lesson characters",
      packageField: "lesson.json.strokeOrder / characterNotes.strokeNote",
      ui: "stroke game + Hanzi Writer",
      l1Status: l1PartialPass ? "PASS" : undefined,
    },
    {
      key: "TB-RAD",
      section: "radicalsComponents",
      summary: "Radicals / components if textbook teaches them",
      packageField: "lesson.json.components",
      ui: "component game only if verified",
      adminOnly: false,
    },
    {
      key: "TB-CULT",
      section: "culture",
      summary: "Culture section if present",
      packageField: "notes.json.culture",
      ui: "optional culture card",
      adminOnly: false,
    },
    {
      key: "TB-IMG",
      section: "sourceImages",
      summary: "Textbook/workbook matching images",
      packageField: "images/ + media.json",
      ui: "workbook fallback page images",
      adminOnly: false,
    },
  ];

  for (const s of sections) {
    if (s.section === "classroomExpressions" && !lesson.hasClassroomExpressions) {
      continue;
    }
    if (s.section === "culture" && !lesson.hasCultureSection) {
      continue;
    }
    if (s.section === "pinyinSection" && lesson.lessonNumber > 3) {
      // Later lessons may have lighter pinyin — still required row but may be N/A content
    }

    rows.push({
      id: rowId(lesson.lessonNumber, s.key),
      sourceType: "textbook",
      sourceFile: HSK1_SOURCE_FILES.textbook,
      sourcePage: "needs_manual_confirmation",
      sourceSection: s.section,
      exactContentSummary: s.summary,
      requiredInPackage: s.section !== "culture" && s.section !== "radicalsComponents",
      packageField: s.packageField,
      learnerUiSection: s.ui,
      adminOnly: s.adminOnly ?? false,
      audioMapping: null,
      status: s.l1Status ?? "NEEDS_REVIEW",
      notes:
        s.l1Status === "PASS"
          ? "V13 runtime overlay present; PDF page confirmation still required."
          : "Pending PDF extraction from HSK-1-Textbook (1).pdf",
    });
  }

  return rows;
}

function buildTeacherBookRows(lesson: Hsk1CanonicalLesson): Hsk1CoverageRow[] {
  return TEACHER_BOOK_SECTIONS.map((section) => ({
    id: rowId(lesson.lessonNumber, `TK-${section.toUpperCase()}`),
    sourceType: "teacherBook" as const,
    sourceFile: HSK1_SOURCE_FILES.teacherBook,
    sourcePage: "needs_manual_confirmation" as const,
    sourceSection: section,
    exactContentSummary: `Teacher's Book: ${section} for ${lesson.chineseTitle}`,
    requiredInPackage: true,
    packageField: `hskStudyContent.teacherNotes / studyGuideSteps / teachingGoals.${section}`,
    learnerUiSection: "guides watch flow; admin/source for raw notes",
    adminOnly: section === "supplementaryTools" || section === "classroomActivities",
    audioMapping: null,
    status: lesson.lessonNumber === 1 && section === "teachingSteps" ? "PASS" : "NEEDS_REVIEW",
    notes:
      lesson.lessonNumber === 1 && section === "teachingSteps"
        ? "V13 9-step flow derived from Teacher's Book goals; raw text not extracted."
        : "Pending PDF extraction from Teacher's Book.",
  }));
}

function inferWorkbookExerciseType(
  lesson: Hsk1CanonicalLesson,
  sectionLabel: string
): Hsk1CoverageRow["sourceSection"] {
  const label = sectionLabel;
  if (lesson.lessonNumber <= 2 && (label === "一" || label === "二")) {
    return "pronunciation";
  }
  if (label === "三") return "characters";
  if (label === "四" || label === "五" || label === "六") return "listening";
  if (label === "七") return "reading";
  return "writing";
}

function buildWorkbookRows(lesson: Hsk1CanonicalLesson): Hsk1CoverageRow[] {
  return lesson.workbookSectionLabels.flatMap((label) => {
    const exerciseType = inferWorkbookExerciseType(lesson, label);
    const hasAnswer = ["三", "四", "五", "六", "七"].includes(label);
    const l1Pass = lesson.lessonNumber === 1;

    const exerciseRow: Hsk1CoverageRow = {
      id: rowId(lesson.lessonNumber, `WB-${label}`),
      sourceType: "workbook",
      sourceFile: HSK1_SOURCE_FILES.workbook,
      sourcePage: "needs_manual_confirmation",
      sourceSection: `exercise${label}`,
      exactContentSummary: `Workbook section ${label} (${exerciseType})`,
      requiredInPackage: true,
      packageField: `workbook.json.exercise${label} / hskWorkbook.sections[${label}]`,
      learnerUiSection: "workbook practice center",
      adminOnly: false,
      audioMapping:
        exerciseType === "listening"
          ? `workbook audio — whole exercise audio (timestamps null until mapped)`
          : null,
      status: l1Pass ? "PASS" : "NEEDS_REVIEW",
      notes: l1Pass
        ? "V13 workbook section scaffold present; item-level extraction pending PDF."
        : "Pending workbook PDF extraction.",
    };

    if (!hasAnswer) return [exerciseRow];

    const answerRow: Hsk1CoverageRow = {
      id: rowId(lesson.lessonNumber, `WBA-${label}`),
      sourceType: "workbookAnswer",
      sourceFile: HSK1_SOURCE_FILES.workbookAnswers,
      sourcePage: "needs_manual_confirmation",
      sourceSection: `answer${label}`,
      exactContentSummary: `Answer key for workbook section ${label}`,
      requiredInPackage: true,
      packageField: `workbook.json.exercise${label}.answerKey (adminOnly)`,
      learnerUiSection: "admin/review only",
      adminOnly: true,
      audioMapping: null,
      status: l1Pass ? "NEEDS_REVIEW" : "NEEDS_REVIEW",
      notes: l1Pass
        ? "Answer scaffold in V13; verify against hsk1-workbook-answers PDF."
        : "Pending answer key PDF extraction.",
    };

    return [exerciseRow, answerRow];
  });
}

function buildAudioRows(lesson: Hsk1CanonicalLesson): Hsk1CoverageRow[] {
  const textbookAudioPattern = `textbook/L${String(lesson.lessonNumber).padStart(2, "0")}/*`;
  const workbookAudioPattern = `workbook/L${String(lesson.lessonNumber).padStart(2, "0")}/*`;

  return [
    {
      id: rowId(lesson.lessonNumber, "AUD-TB-INV"),
      sourceType: "textbookAudio",
      sourceFile: HSK1_SOURCE_FILES.textbookAudioZip,
      sourcePage: "needs_manual_confirmation",
      sourceSection: "textbookAudioInventory",
      exactContentSummary: `All textbook audio files for lesson ${lesson.lessonNumber}`,
      requiredInPackage: true,
      packageField: "audio-manifest.json.textbook",
      learnerUiSection: "dialogue / pinyin audio buttons",
      adminOnly: false,
      audioMapping: textbookAudioPattern,
      status: "NEEDS_REVIEW",
      notes:
        "Extract inventory from hsk1textbookaudios.zip; map each file to dialogue or drill. No orphan files.",
    },
    {
      id: rowId(lesson.lessonNumber, "AUD-WB-INV"),
      sourceType: "workbookAudio",
      sourceFile: HSK1_SOURCE_FILES.workbookAudioZip,
      sourcePage: "needs_manual_confirmation",
      sourceSection: "workbookAudioInventory",
      exactContentSummary: `All workbook listening audio for lesson ${lesson.lessonNumber}`,
      requiredInPackage: true,
      packageField: "audio-manifest.json.workbook",
      learnerUiSection: "workbook listening exercises",
      adminOnly: false,
      audioMapping: workbookAudioPattern,
      status: "NEEDS_REVIEW",
      notes:
        "Extract inventory from hsk1workbookaudios.zip; use whole-exercise audio if timestamps unknown.",
    },
  ];
}

export function buildCoverageMatrix(lesson: Hsk1CanonicalLesson): Hsk1CoverageMatrix {
  const rows: Hsk1CoverageRow[] = [
    ...buildTextbookRows(lesson),
    ...buildTeacherBookRows(lesson),
    ...buildWorkbookRows(lesson),
    ...buildAudioRows(lesson),
  ];

  const requiredRows = rows.filter((r) => r.requiredInPackage);
  const pass = rows.filter((r) => r.status === "PASS").length;
  const fail = rows.filter((r) => r.status === "FAIL").length;
  const needsReview = rows.filter((r) => r.status === "NEEDS_REVIEW").length;
  const requiredPending = requiredRows.filter((r) => r.status !== "PASS").length;

  return {
    packageVersion: "HSK1_SOURCE_AUDIT_V1",
    lessonNumber: lesson.lessonNumber,
    lessonId: lesson.lessonId,
    chineseTitle: lesson.chineseTitle,
    generatedAt: new Date().toISOString(),
    sourceFiles: { ...HSK1_SOURCE_FILES },
    summary: {
      totalRows: rows.length,
      pass,
      fail,
      needsReview,
      requiredPending,
      packagingAllowed: requiredPending === 0 && fail === 0,
    },
    rows,
  };
}

export function buildLessonProfile(lesson: Hsk1CanonicalLesson): Hsk1LessonProfile {
  const isL1 = lesson.lessonNumber === 1;
  const isL2 = lesson.lessonNumber === 2;
  const isL3 = lesson.lessonNumber === 3;
  const isL4 = lesson.lessonNumber === 4;

  const recommendedGames: string[] = ["flashcard", "quiz"];
  const forbiddenGames: string[] = [];
  let componentGameAllowed = false;
  let strokeOrderGameRequired = false;

  if (isL1) {
    recommendedGames.push(
      "tone_listening",
      "pinyin_recognition",
      "greeting_dialogue",
      "stroke_order",
      "hanzi_writing"
    );
    forbiddenGames.push("missing_component_偏旁", "random_missing_stroke");
    strokeOrderGameRequired = true;
  } else if (isL2) {
    recommendedGames.push("dialogue_response", "neutral_tone_practice", "stroke_order");
    forbiddenGames.push("missing_component_偏旁");
    strokeOrderGameRequired = true;
  } else if (isL3) {
    recommendedGames.push("sentence_order", "name_dialogue", "什么_recognition");
  } else if (isL4) {
    recommendedGames.push("pronoun_matching", "的_structure", "teacher_student_identity");
    componentGameAllowed = true;
  } else if (lesson.phase === "numbers-age") {
    recommendedGames.push("number_recognition", "age_dialogue");
  } else if (lesson.phase === "date" || lesson.phase === "time") {
    recommendedGames.push("time_date_arrange", "listening_match");
  } else if (lesson.phase === "location" || lesson.phase === "existence") {
    recommendedGames.push("location_match", "在哪儿_dialogue");
  } else if (lesson.phase === "progressive" || lesson.phase === "completion") {
    recommendedGames.push("了_completion", "progressive_呢");
  } else {
    recommendedGames.push("dialogue_practice", "workbook_listening");
  }

  const mistakes: string[] = [];
  if (isL1) {
    mistakes.push(
      "Pinyin-ийг «ни хао» гэж монгол үсгээр цээжлэх",
      "Хөгийг алгасах",
      "Tone sandhi-г хэт техникээр тайлбарлах"
    );
  }
  if (isL2) {
    mistakes.push("不-ийн хөгийг буруу унших", "谢谢 vs 谢谢你-ийг холих");
  }
  if (isL3) {
    mistakes.push("什么 vs 谁 confusion", "是 sentence word order");
  }

  const practiceFlow = [
    "teacher intro",
    "core dialogue",
    "vocabulary flashcards",
    "pronunciation/grammar focus",
    "workbook practice",
    "quiz",
    "recommended games",
  ];

  return {
    profileVersion: "HSK1_LESSON_PROFILE_V1",
    lessonNumber: lesson.lessonNumber,
    lessonId: lesson.lessonId,
    chineseTitle: lesson.chineseTitle,
    coreSkill: lesson.functionalFocus,
    mainGrammar: lesson.grammarFocus,
    mainFunction: [lesson.functionalFocus],
    pronunciationFocus: lesson.pronunciationFocus,
    characterFocus: lesson.characterFocus,
    workbookFocus: lesson.workbookSectionLabels.map((s) => `section ${s}`),
    commonMongolianLearnerMistakes: mistakes,
    recommendedGames,
    forbiddenGames,
    recommendedMnemonicImages: isL1
      ? ["vocab-hao-mnemonic"]
      : [],
    recommendedPracticeFlow: practiceFlow,
    componentGameAllowed,
    strokeOrderGameRequired,
    enrichmentAllowed: true,
    enrichmentRequiresSourceComplete: true,
    notes:
      "Enrichment (mnemonics, teacher copy) must not replace or contradict source. componentStatus=needs_review until verified.",
  };
}

export function buildMasterLessonEntry(lesson: Hsk1CanonicalLesson): Hsk1MasterLessonEntry {
  const pad = String(lesson.lessonNumber).padStart(2, "0");
  const matrixPath = `content/hsk1/source-audit/lesson-${pad}-coverage-matrix.json`;
  const profilePath = `content/hsk1/lesson-profiles/lesson-${pad}-profile.json`;

  let sourceStatus: Hsk1MasterLessonEntry["sourceStatus"] = "pending";
  if (lesson.lessonNumber === 1) sourceStatus = "partial";

  const expectedWorkbookSections = lesson.workbookSectionLabels.map(
    (s) => `exercise${s}`
  );
  const expectedAnswerSections = ["三", "四", "五", "六", "七"].map(
    (s) => `answer${s}`
  );

  const expectedTextbookSections = TEXTBOOK_SECTIONS_BASE.filter((s) => {
    if (s === "culture" && !lesson.hasCultureSection) return false;
    return true;
  }).map(String);

  if (lesson.hasClassroomExpressions) {
    expectedTextbookSections.push("classroomExpressions");
  }

  return {
    lessonNumber: lesson.lessonNumber,
    lessonId: lesson.lessonId,
    chineseTitle: lesson.chineseTitle,
    englishTitle: lesson.englishTitle,
    mongolianTitle: lesson.mongolianTitle,
    textbookPageStart: "needs_manual_confirmation",
    textbookPageEnd: "needs_manual_confirmation",
    teacherBookPageStart: "needs_manual_confirmation",
    teacherBookPageEnd: "needs_manual_confirmation",
    workbookPageStart: "needs_manual_confirmation",
    workbookPageEnd: "needs_manual_confirmation",
    workbookAnswerPageStart: "needs_manual_confirmation",
    workbookAnswerPageEnd: "needs_manual_confirmation",
    textbookAudioFiles: [],
    workbookAudioFiles: [],
    expectedTextbookSections,
    expectedTeacherBookSections: [...TEACHER_BOOK_SECTIONS],
    expectedWorkbookSections,
    expectedAnswerSections,
    expectedAppSections: [...APP_SECTIONS_BASE],
    sourceStatus,
    coverageMatrixPath: matrixPath,
    lessonProfilePath: profilePath,
    notes:
      lesson.lessonNumber === 1
        ? "V13 learner overlay exists; full PDF extraction and page confirmation still required."
        : "No package until source audit rows pass.",
  };
}

export function buildMasterSourceIndex(): Hsk1MasterSourceIndex {
  const lessons = HSK1_CANONICAL_LESSONS.map(buildMasterLessonEntry);

  const totalRequired = lessons.length;
  const complete = lessons.filter((l) => l.sourceStatus === "complete").length;
  const partial = lessons.filter((l) => l.sourceStatus === "partial").length;

  const textbookCoveragePercent = Math.round((partial / totalRequired) * 100 * 0.3); // L1 partial only
  const packagingBlocked = true;

  return {
    auditVersion: "HSK1_MASTER_SOURCE_INDEX_V1",
    generatedAt: new Date().toISOString(),
    courseId: "hsk1",
    courseTitle: "HSK Standard Course 1",
    sourceFiles: { ...HSK1_SOURCE_FILES },
    sourceFilesOnDisk: "not_in_repo",
    invalidLegacyPackages: [
      {
        lessonNumber: 2,
        wrongChineseTitle: "你好吗",
        correctChineseTitle: "谢谢你",
        reason: "Wrong topic for HSK1 Lesson 2",
      },
      {
        lessonNumber: 4,
        wrongChineseTitle: "你是哪国人",
        correctChineseTitle: "她是我的汉语老师",
        reason: "Wrong topic for HSK1 Lesson 4",
      },
    ],
    acceptanceGate: {
      textbookCoveragePercent,
      teacherBookCoveragePercent: 0,
      workbookCoveragePercent: lessonNumberPercent(1, 15, 0.3),
      workbookAnswerCoveragePercent: 0,
      audioCoveragePercent: 0,
      vocabularyCoveragePercent: lessonNumberPercent(1, 15, 0.3),
      characterCoveragePercent: lessonNumberPercent(1, 15, 0.3),
      learnerFlowReviewed: false,
      gameLogicReviewed: true,
      buildPasses: true,
      packagingBlocked,
      blockReason:
        "BLOCKED: missing source coverage — PDF page extraction, audio inventory, and workbook item-level extraction not complete for all 15 lessons.",
    },
    lessons,
  };
}

function lessonNumberPercent(done: number, total: number, weight: number): number {
  return Math.round((done / total) * 100 * weight);
}

export function generateAllAuditArtifacts(): {
  masterIndex: Hsk1MasterSourceIndex;
  matrices: Hsk1CoverageMatrix[];
  profiles: Hsk1LessonProfile[];
} {
  const masterIndex = buildMasterSourceIndex();
  const matrices = HSK1_CANONICAL_LESSONS.map(buildCoverageMatrix);
  const profiles = HSK1_CANONICAL_LESSONS.map(buildLessonProfile);
  return { masterIndex, matrices, profiles };
}
