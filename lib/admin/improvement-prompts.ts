import type { LessonQaReport } from "@/lib/admin/lesson-qa";
import type {
  QuestionAnalyticsRow,
  VocabularyEngagementRow,
} from "@/lib/supabase/admin-analytics";
import type { LessonContent } from "@/types/lesson-content";

export type ImprovementIssueType =
  | "full_lesson"
  | "missing_content"
  | "quiz_quality"
  | "vocabulary"
  | "subtitles"
  | "publish_readiness"
  | "question_fix"
  | "vocabulary_fix"
  | "import_cleanup";

export type ImprovementQaSummary = {
  subtitleCount: number;
  vocabularyCount: number;
  quizCount: number;
  qaStatus: string;
  warnings: string[];
  publishReady?: boolean;
};

export type ImprovementAnalyticsContext = {
  averageQuizPercentage?: number | null;
  completionRate?: number | null;
  quizAttemptCount?: number;
  contentWarnings?: string[];
};

export type SubtitleIssueSummary = {
  missingPinyinCount?: number;
  missingMongolianCount?: number;
  missingLines?: boolean;
  sampleLines?: Array<{ chinese: string; mongolian?: string; pinyin?: string }>;
};

export type PromptLibraryEntry = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  issueType: ImprovementIssueType;
};

const JSON_RULES = `OUTPUT REQUIREMENTS (STRICT)
- Return VALID JSON ONLY. No markdown, no code fences, no commentary before or after.
- Root object with exactly these keys: "subtitles", "vocabulary", "quizQuestions"
- Use empty arrays [] for sections you are not changing unless asked to fill them.
- Mongolian translations must be natural, not robotic.
- Include Chinese + pinyin for subtitles and vocabulary.
- Quiz correctAnswer MUST exactly match one value in options.
- Do not include explanations outside the JSON object.`;

const JSON_SHAPE = `JSON SHAPE (structure only):
{
  "subtitles": [
    { "start": "00:00", "end": "00:03", "chinese": "...", "pinyin": "...", "mongolian": "..." }
  ],
  "vocabulary": [
    {
      "chinese": "...",
      "pinyin": "...",
      "mongolian": "...",
      "hskLevel": "HSK5",
      "exampleChinese": "...",
      "exampleMongolian": "..."
    }
  ],
  "quizQuestions": [
    {
      "type": "multiple_choice",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}`;

function lessonContextBlock(lesson: Pick<
  LessonContent,
  "id" | "title" | "chineseTitle" | "subtitle" | "description"
>): string {
  const summary = [lesson.subtitle, lesson.description].filter(Boolean).join(" — ");
  return `LESSON CONTEXT
- Lesson ID: ${lesson.id}
- Title: ${lesson.title}
- Chinese title: ${lesson.chineseTitle}
- Summary: ${summary || "(no summary yet)"}
- Target course: HSK5 Mongolian learners
- Tone: emotional short-drama conversational Chinese where appropriate`;
}

function qaBlock(qa: ImprovementQaSummary): string {
  const lines = [
    `QA STATUS: ${qa.qaStatus}`,
    `- Subtitles: ${qa.subtitleCount}`,
    `- Vocabulary: ${qa.vocabularyCount}`,
    `- Quiz questions: ${qa.quizCount}`,
  ];
  if (qa.warnings.length > 0) {
    lines.push(`KNOWN ISSUES:\n${qa.warnings.map((w) => `- ${w}`).join("\n")}`);
  }
  return lines.join("\n");
}

function analyticsBlock(analytics?: ImprovementAnalyticsContext): string {
  if (!analytics) return "";
  const lines: string[] = ["LEARNER ANALYTICS SIGNALS:"];
  if (analytics.averageQuizPercentage != null) {
    lines.push(`- Average quiz score: ${analytics.averageQuizPercentage}%`);
  }
  if (analytics.completionRate != null) {
    lines.push(`- Completion rate: ${analytics.completionRate}%`);
  }
  if (analytics.quizAttemptCount != null) {
    lines.push(`- Quiz attempts: ${analytics.quizAttemptCount}`);
  }
  if (analytics.contentWarnings?.length) {
    lines.push(
      `- Content warnings: ${analytics.contentWarnings.join("; ")}`
    );
  }
  return lines.length > 1 ? lines.join("\n") : "";
}

function qaFromReport(report: LessonQaReport | ImprovementQaSummary): ImprovementQaSummary {
  if ("subtitleCount" in report && !("lesson" in report)) {
    return report;
  }
  const r = report as LessonQaReport;
  return {
    subtitleCount: r.subtitleCount,
    vocabularyCount: r.vocabularyActual,
    quizCount: r.quizActual,
    qaStatus: r.qaStatus,
    warnings: r.warnings,
  };
}

export function buildLessonImprovementPrompt(
  lesson: LessonContent,
  qaSummary: LessonQaReport | ImprovementQaSummary,
  analytics?: ImprovementAnalyticsContext
): string {
  const qa = qaFromReport(qaSummary);
  const analyticsText = analyticsBlock(analytics);

  return `You are improving lesson content JSON for Buunduu Surtsgaay (Mongolian learners studying Chinese).

${lessonContextBlock(lesson)}

${qaBlock(qa)}
${analyticsText ? `\n${analyticsText}\n` : ""}
TASK
Improve this lesson holistically: fix weak areas, fill gaps, and strengthen quiz/vocabulary quality.
Return improved content as strict JSON for bulk import.

${JSON_RULES}

FOCUS
- Keep lesson theme consistent with title and summary.
- Fix any missing or weak subtitles, vocabulary, and quiz questions noted in QA/analytics.
- If quiz scores are low, simplify questions and improve distractors.
- If completion is low, ensure vocabulary examples are clearer.

${JSON_SHAPE}

Generate the improved JSON now.`;
}

export function buildQuestionImprovementPrompt(
  question: QuestionAnalyticsRow,
  lesson?: Pick<LessonContent, "id" | "title" | "chineseTitle" | "subtitle" | "description">
): string {
  const lessonBlock = lesson
    ? lessonContextBlock(lesson)
    : `LESSON CONTEXT
- Lesson ID: ${question.lessonId}
- Title: ${question.lessonTitle}`;

  const wrongAnswers =
    question.mostCommonWrongAnswers.length > 0
      ? question.mostCommonWrongAnswers.join(", ")
      : "(none recorded)";

  return `You are fixing one weak quiz question for Buunduu Surtsgaay.

${lessonBlock}

PROBLEM QUESTION
- Type: ${question.type}
- Question: ${question.question}
- Correct answer: ${question.correctAnswer}
- Attempts: ${question.attemptsCount}
- Accuracy: ${question.accuracyPercent ?? "unknown"}%
- Common wrong answers: ${wrongAnswers}

TASK
Rewrite or replace this question with:
- Clearer wording for Mongolian learners
- Exactly 4 options
- correctAnswer must match one option exactly
- Short Mongolian explanation
- Same lesson context and difficulty

${JSON_RULES}

Return ONLY a JSON object with a single-key root for import compatibility:
{
  "subtitles": [],
  "vocabulary": [],
  "quizQuestions": [
    {
      "type": "${question.type}",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}

Generate the JSON now. No markdown.`;
}

export function buildVocabularyImprovementPrompt(
  word: VocabularyEngagementRow,
  lesson?: Pick<LessonContent, "id" | "title" | "chineseTitle" | "subtitle" | "description">
): string {
  const lessonBlock = lesson
    ? lessonContextBlock(lesson)
    : `LESSON CONTEXT
- Lesson ID: ${word.lessonId}
- Title: ${word.lessonTitle}`;

  return `You are improving vocabulary content for Buunduu Surtsgaay.

${lessonBlock}

WEAK VOCABULARY WORD
- Chinese: ${word.chinese}
- Pinyin: ${word.pinyin || "(missing)"}
- Mongolian: ${word.mongolian}
- HSK level: ${word.hskLevel || "HSK5"}
- Learned count: ${word.learnedCount} (engagement: ${word.engagement})

TASK
Improve this vocabulary entry with:
- Clearer, natural Mongolian explanation
- Better exampleChinese + exampleMongolian (practical sentence)
- Correct pinyin
- Optional: one related multiple_choice quiz question testing this word

${JSON_RULES}

Return JSON:
{
  "subtitles": [],
  "vocabulary": [
    {
      "chinese": "${word.chinese}",
      "pinyin": "...",
      "mongolian": "...",
      "hskLevel": "${word.hskLevel || "HSK5"}",
      "exampleChinese": "...",
      "exampleMongolian": "..."
    }
  ],
  "quizQuestions": [
    {
      "type": "multiple_choice",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}

Use empty quizQuestions [] if no quiz is needed. Generate JSON only.`;
}

export function buildSubtitleImprovementPrompt(
  lesson: LessonContent,
  subtitleIssues?: SubtitleIssueSummary
): string {
  const issueLines: string[] = [];
  if (subtitleIssues?.missingLines) issueLines.push("- Subtitles are missing or empty");
  if (subtitleIssues?.missingPinyinCount) {
    issueLines.push(`- ${subtitleIssues.missingPinyinCount} subtitle line(s) missing pinyin`);
  }
  if (subtitleIssues?.missingMongolianCount) {
    issueLines.push(
      `- ${subtitleIssues.missingMongolianCount} subtitle line(s) missing Mongolian`
    );
  }
  if (subtitleIssues?.sampleLines?.length) {
    issueLines.push(
      "SAMPLE LINES TO FIX:\n" +
        subtitleIssues.sampleLines
          .slice(0, 5)
          .map(
            (l) =>
              `- ${l.chinese} | mn: ${l.mongolian ?? "?"} | py: ${l.pinyin ?? "?"}`
          )
          .join("\n")
    );
  }
  if (issueLines.length === 0) {
    issueLines.push("- Review all subtitle lines for natural Mongolian and complete pinyin");
  }

  const sampleFromLesson = lesson.timedSubtitles.slice(0, 3).map((s) => ({
    chinese: s.chinese,
    mongolian: s.mongolian,
    pinyin: s.pinyin,
  }));

  return `You are improving subtitle JSON for Buunduu Surtsgaay.

${lessonContextBlock(lesson)}

SUBTITLE ISSUES
${issueLines.join("\n")}

CURRENT SUBTITLE COUNT: ${lesson.timedSubtitles.length}

${sampleFromLesson.length > 0 ? `EXISTING SAMPLE:\n${sampleFromLesson.map((s) => `- ${s.chinese}`).join("\n")}` : ""}

TASK
Fix missing Mongolian translations and pinyin. Keep timing (start/end) sensible.
Return subtitles array only (other keys empty arrays).

${JSON_RULES}

${JSON_SHAPE}

Generate JSON now.`;
}

export function buildPublishReadinessPrompt(
  lesson: LessonContent,
  qaSummary: LessonQaReport | ImprovementQaSummary
): string {
  const qa = qaFromReport(qaSummary);

  return `You are preparing publish-ready lesson JSON for Buunduu Surtsgaay.

${lessonContextBlock(lesson)}

${qaBlock(qa)}

PUBLISH REQUIREMENTS
- At least 1 subtitle line with chinese + mongolian + pinyin
- At least 5 vocabulary words with examples
- At least 3 quiz questions (mix multiple_choice and cloze)
- No duplicate vocabulary chinese
- All quiz correctAnswer values must match an option exactly
- Natural Mongolian throughout

TASK
Fill any gaps and fix QA issues so this lesson is ready to publish.
Return complete JSON for bulk import.

${JSON_RULES}

${JSON_SHAPE}

Generate publish-ready JSON now.`;
}

export function buildQuizQualityPrompt(
  lesson: LessonContent,
  qaSummary: ImprovementQaSummary,
  difficultQuestions?: QuestionAnalyticsRow[]
): string {
  const difficultBlock =
    difficultQuestions && difficultQuestions.length > 0
      ? `DIFFICULT QUESTIONS (from analytics):\n${difficultQuestions
          .slice(0, 5)
          .map(
            (q) =>
              `- ${q.question} (${q.accuracyPercent ?? "?"}% accuracy, wrong: ${q.mostCommonWrongAnswers.join(", ") || "—"})`
          )
          .join("\n")}`
      : "Improve clarity and distractor quality for all quiz questions.";

  const existingQuiz = lesson.quizQuestions
    .slice(0, 5)
    .map((q) => `- [${q.type}] ${q.question}`)
    .join("\n");

  return `You are improving quiz JSON for Buunduu Surtsgaay.

${lessonContextBlock(lesson)}

${qaBlock(qaSummary)}

${difficultBlock}

EXISTING QUIZ (${lesson.quizQuestions.length} questions):
${existingQuiz || "(none yet)"}

TASK
Rewrite quiz questions for clarity. Use 4 options each. Mongolian explanations.
Return quizQuestions array (subtitles and vocabulary as empty arrays unless you must add vocab to support a question).

${JSON_RULES}

Generate JSON now.`;
}

export function buildVocabularyExamplesPrompt(
  lesson: LessonContent,
  weakWords?: VocabularyEngagementRow[]
): string {
  const weakBlock =
    weakWords && weakWords.length > 0
      ? weakWords
          .slice(0, 8)
          .map(
            (w) =>
              `- ${w.chinese} (${w.pinyin}) — learned ${w.learnedCount}x, engagement: ${w.engagement}`
          )
          .join("\n")
      : lesson.vocabulary
          .slice(0, 8)
          .map((w) => `- ${w.chinese} (${w.pinyin})`)
          .join("\n");

  return `You are improving vocabulary examples for Buunduu Surtsgaay.

${lessonContextBlock(lesson)}

WORDS TO IMPROVE:
${weakBlock}

TASK
For each word listed, provide better exampleChinese and exampleMongolian.
Natural Mongolian. Include pinyin and hskLevel.

${JSON_RULES}

Return JSON with vocabulary array only (empty subtitles and quizQuestions):
${JSON_SHAPE}

Generate JSON now.`;
}

export function buildMissingContentPrompt(
  lesson: LessonContent,
  qa: ImprovementQaSummary
): string {
  const missing: string[] = [];
  if (qa.subtitleCount === 0) missing.push("subtitles");
  if (qa.vocabularyCount === 0) missing.push("vocabulary");
  if (qa.quizCount === 0) missing.push("quizQuestions");

  return `You are filling missing lesson content for Buunduu Surtsgaay.

${lessonContextBlock(lesson)}

${qaBlock(qa)}

MISSING SECTIONS: ${missing.length > 0 ? missing.join(", ") : "review all sections"}

MINIMUM FOR PUBLISH
- subtitles: at least 1 timed line
- vocabulary: at least 5 words
- quizQuestions: at least 3 questions

${JSON_RULES}

${JSON_SHAPE}

Generate complete JSON now.`;
}

export function buildImportCleanupPrompt(lessonId = "[LESSON_ID]"): string {
  return `You are cleaning lesson import JSON for Buunduu Surtsgaay before bulk import.

LESSON ID: ${lessonId}

TASK
Review the JSON I will paste next (or generate fresh if none provided) and fix:
- Duplicate vocabulary chinese entries
- Quiz correctAnswer not in options
- Missing mongolian or pinyin on subtitles/vocabulary
- Invalid quiz type (only multiple_choice or cloze)
- Empty options arrays

${JSON_RULES}

Return cleaned JSON with keys subtitles, vocabulary, quizQuestions only.
No markdown. No commentary.`;
}

export function getPromptLibraryEntries(): PromptLibraryEntry[] {
  return [
    {
      id: "full-lesson",
      title: "Full lesson JSON generator",
      description:
        "Create complete subtitles, vocabulary, and quiz from lesson context placeholders.",
      issueType: "full_lesson",
      prompt: buildLessonImprovementPrompt(
        {
          id: "[LESSON_ID]",
          courseId: "hsk5",
          title: "[ENGLISH_TITLE]",
          chineseTitle: "[CHINESE_TITLE]",
          subtitle: "[MONGOLIAN_SUBTITLE]",
          description: "[DESCRIPTION]",
          duration: "10:00",
          vocabularyCount: 10,
          quizCount: 5,
          status: "available",
          publishStatus: "draft",
          videoPlaceholder: "",
          watchTotalTime: "",
          subtitlePreview: [],
          timedSubtitles: [],
          vocabulary: [],
          quizQuestions: [],
          quizTypes: [],
        },
        {
          subtitleCount: 0,
          vocabularyCount: 10,
          quizCount: 5,
          qaStatus: "needs_review",
          warnings: ["New lesson — generate all content"],
        }
      ),
    },
    {
      id: "subtitle-improvement",
      title: "Subtitle improvement",
      description: "Fix missing pinyin and natural Mongolian on timed subtitles.",
      issueType: "subtitles",
      prompt: buildSubtitleImprovementPrompt(
        {
          id: "[LESSON_ID]",
          courseId: "hsk5",
          title: "[ENGLISH_TITLE]",
          chineseTitle: "[CHINESE_TITLE]",
          subtitle: "[SUMMARY]",
          description: "",
          duration: "10:00",
          vocabularyCount: 0,
          quizCount: 0,
          status: "available",
          publishStatus: "draft",
          videoPlaceholder: "",
          watchTotalTime: "",
          subtitlePreview: [],
          timedSubtitles: [],
          vocabulary: [],
          quizQuestions: [],
          quizTypes: [],
        },
        { missingPinyinCount: 1, missingMongolianCount: 1 }
      ),
    },
    {
      id: "vocabulary-improvement",
      title: "Vocabulary improvement",
      description: "Better examples and Mongolian explanations for weak words.",
      issueType: "vocabulary",
      prompt: buildVocabularyImprovementPrompt({
        vocabularyWordId: 0,
        lessonId: "[LESSON_ID]",
        lessonTitle: "[LESSON_TITLE]",
        chinese: "[CHINESE_WORD]",
        pinyin: "[PINYIN]",
        mongolian: "[MONGOLIAN_GLOSS]",
        hskLevel: "HSK5",
        learnedCount: 0,
        uniqueLearnersCount: 0,
        engagement: "none",
      }),
    },
    {
      id: "quiz-improvement",
      title: "Quiz improvement",
      description: "Rewrite weak quiz questions with clearer wording and distractors.",
      issueType: "quiz_quality",
      prompt: buildQuestionImprovementPrompt({
        lessonId: "[LESSON_ID]",
        lessonTitle: "[LESSON_TITLE]",
        questionKey: "sample",
        orderIndex: 0,
        question: "[QUESTION_TEXT]",
        type: "multiple_choice",
        correctAnswer: "[CORRECT]",
        attemptsCount: 5,
        correctCount: 2,
        wrongCount: 3,
        accuracyPercent: 40,
        mostCommonWrongAnswers: ["wrong option A"],
        needsReview: true,
      }),
    },
    {
      id: "publish-readiness",
      title: "Publish readiness checklist",
      description: "Fill gaps to meet minimum publish requirements.",
      issueType: "publish_readiness",
      prompt: buildPublishReadinessPrompt(
        {
          id: "[LESSON_ID]",
          courseId: "hsk5",
          title: "[ENGLISH_TITLE]",
          chineseTitle: "[CHINESE_TITLE]",
          subtitle: "[SUMMARY]",
          description: "[DESCRIPTION]",
          duration: "10:00",
          vocabularyCount: 5,
          quizCount: 3,
          status: "available",
          publishStatus: "draft",
          videoPlaceholder: "",
          watchTotalTime: "",
          subtitlePreview: [],
          timedSubtitles: [],
          vocabulary: [],
          quizQuestions: [],
          quizTypes: [],
        },
        {
          subtitleCount: 1,
          vocabularyCount: 3,
          quizCount: 1,
          qaStatus: "needs_review",
          warnings: ["Below publish minimums"],
          publishReady: false,
        }
      ),
    },
    {
      id: "import-cleanup",
      title: "Import cleanup",
      description: "Fix JSON before bulk import (duplicates, quiz answer mismatches).",
      issueType: "import_cleanup",
      prompt: buildImportCleanupPrompt("[LESSON_ID]"),
    },
  ];
}

export const IMPROVEMENT_ISSUE_LABELS: Record<ImprovementIssueType, string> = {
  full_lesson: "Full lesson",
  missing_content: "Missing content",
  quiz_quality: "Quiz quality",
  vocabulary: "Vocabulary",
  subtitles: "Subtitles",
  publish_readiness: "Publish ready",
  question_fix: "Question fix",
  vocabulary_fix: "Vocabulary fix",
  import_cleanup: "Import cleanup",
};
