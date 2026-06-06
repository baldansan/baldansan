import lesson01 from "../data/lesson-01.json";
import { resolveHskLessonPackageFromLesson } from "../lib/lesson/resolve-hsk-lesson-package";
import {
  listeningItemCount,
  resolveExercisesWorkbook,
} from "../lib/lesson/workbook-exercises";
import type { LessonContent } from "../types/lesson-content";

const wb = lesson01.exercises_workbook as Record<string, unknown>;
const listeningOnly = {
  listening: wb.listening,
};
const readingWritingOnly = {
  reading: wb.reading,
  writing: wb.writing,
};

const splitMerged = resolveExercisesWorkbook(
  { exercises_workbook: readingWritingOnly },
  listeningOnly,
  readingWritingOnly
);

console.log("split merge listening items:", listeningItemCount(splitMerged ?? {}));

const lesson: LessonContent = {
  id: "hsk4-l01",
  courseId: "hsk4",
  title: "test",
  chineseTitle: "",
  subtitle: "",
  description: "",
  duration: "",
  vocabularyCount: 0,
  quizCount: 0,
  status: "available",
  publishStatus: "available",
  videoPlaceholder: "",
  watchTotalTime: "",
  subtitlePreview: [],
  timedSubtitles: [],
  vocabulary: [],
  quizQuestions: [],
  quizTypes: [],
  sourceNote: JSON.stringify({
    packageLessonId: "hsk4-l01",
    hskStudyContent: {
      lessonTeaching: lesson01,
      workbook: listeningOnly,
    },
  }),
};

const pkg = resolveHskLessonPackageFromLesson(lesson);
const eb = pkg?.exercises_workbook as Record<string, unknown> | undefined;
console.log("resolved listening items:", listeningItemCount(eb ?? {}));
console.log(
  "modules has exercises_workbook:",
  pkg?.modules_enabled?.includes("exercises_workbook")
);

const firstPart = (eb?.listening as Record<string, unknown>)?.parts;
const firstItem = Array.isArray(firstPart)
  ? (firstPart[0] as Record<string, unknown>)?.items
  : null;
const audio = Array.isArray(firstItem)
  ? (firstItem[0] as Record<string, unknown>)?.audio
  : null;
console.log("q01 audio sample:", audio);

if (listeningItemCount(eb ?? {}) < 22) {
  process.exitCode = 1;
  console.error("FAIL: expected at least 22 listening items");
}
