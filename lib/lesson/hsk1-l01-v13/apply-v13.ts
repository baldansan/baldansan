import type { HskStudyContent } from "@/lib/lesson/hsk-lesson-content";
import type { LessonContent } from "@/types/lesson-content";
import { mergeHsk1L01CharacterNotes } from "@/lib/lesson/hsk1-l01-v13/characters";
import {
  buildHsk1L01V13GuidedSteps,
  HSK1_L01_CLASSROOM_EXPRESSIONS,
  HSK1_L01_TEACHING_GOALS,
  HSK1_L01_V13_DIALOGUES,
} from "@/lib/lesson/hsk1-l01-v13/guided-steps";
import { isHsk1L01Nihao } from "@/lib/lesson/hsk1-l01-v13/is-lesson";
import { mergeHsk1L01Quiz } from "@/lib/lesson/hsk1-l01-v13/quiz";
import { mergeHsk1L01Vocabulary } from "@/lib/lesson/hsk1-l01-v13/vocabulary";
import { resolveHsk1L01WorkbookSections } from "@/lib/lesson/hsk1-l01-v13/workbook";
import { getJsonSourceNoteField } from "@/lib/lesson/source-note-json";

function readWorkbookPayload(lesson: LessonContent): unknown {
  const fromNote = getJsonSourceNoteField(lesson.sourceNote, "hskWorkbook");
  if (fromNote) return fromNote;

  try {
    if (lesson.sourceNote?.trim().startsWith("{")) {
      const parsed = JSON.parse(lesson.sourceNote) as Record<string, unknown>;
      const study = parsed.hskStudyContent;
      if (study && typeof study === "object" && study !== null) {
        const wb = (study as Record<string, unknown>).workbook;
        if (wb) return wb;
      }
      if (parsed.hskWorkbook) return parsed.hskWorkbook;
    }
  } catch {
    // ignore
  }
  return lesson.hskStudy?.workbook ?? null;
}

/**
 * Apply V13 Gold Standard learner experience for HSK1 Lesson 1.
 * Preserves imported source data; overlays teacher-led flow and enrichments.
 */
export function applyHsk1L01V13GoldStandard(lesson: LessonContent): LessonContent {
  if (!isHsk1L01Nihao(lesson)) return lesson;

  const hskStudy: HskStudyContent = lesson.hskStudy ?? {
    profileId: "hsk1-pronunciation-character-basic",
    hskLevel: 1,
    objectives: [],
    pinyinIntro: [],
    pronunciationNotes: [],
    tones: [],
    dialogues: [],
    sentenceExplanations: [],
    characterNotes: [],
    studyGuideSteps: [],
    guidedSteps: [],
    teacherNotes: [],
    media: null,
  };

  const workbookPayload = readWorkbookPayload(lesson);
  const workbookSections = resolveHsk1L01WorkbookSections(workbookPayload);

  const mergedDialogues =
    hskStudy.dialogues.length >= 3
      ? hskStudy.dialogues
      : HSK1_L01_V13_DIALOGUES.map((d) => ({
          title: d.title,
          lines: d.lines,
        }));

  const objectives = [
    ...HSK1_L01_TEACHING_GOALS.pronunciation,
    ...HSK1_L01_TEACHING_GOALS.characters,
    ...HSK1_L01_TEACHING_GOALS.functional,
  ];

  const enrichedStudy: HskStudyContent = {
    ...hskStudy,
    profileId: hskStudy.profileId ?? "hsk1-pronunciation-character-basic",
    hskLevel: hskStudy.hskLevel ?? 1,
    objectives: hskStudy.objectives.length > 0 ? hskStudy.objectives : objectives,
    dialogues: mergedDialogues,
    characterNotes: mergeHsk1L01CharacterNotes(hskStudy.characterNotes),
    guidedSteps: buildHsk1L01V13GuidedSteps(),
    studyGuideSteps:
      hskStudy.studyGuideSteps.length > 0
        ? hskStudy.studyGuideSteps
        : HSK1_L01_TEACHING_GOALS.sequence,
    workbook: workbookSections,
    workbookPayload,
    classroomExpressions: HSK1_L01_CLASSROOM_EXPRESSIONS,
    teachingGoals: HSK1_L01_TEACHING_GOALS,
    packageVersion: "V13_GOLD_STANDARD",
  };

  const vocabulary = mergeHsk1L01Vocabulary(lesson.vocabulary ?? []);
  const quizQuestions = mergeHsk1L01Quiz(lesson.quizQuestions ?? []);

  return {
    ...lesson,
    chineseTitle: lesson.chineseTitle || "你好",
    title: lesson.title || "HSK1 Lesson 1 — 你好",
    subtitle: lesson.subtitle || "Hello / Сайн байна уу",
    vocabulary,
    vocabularyCount: vocabulary.length,
    quizQuestions,
    quizCount: quizQuestions.length,
    hskStudy: enrichedStudy,
  };
}
