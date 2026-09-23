/**
 * Хичээлийн импортын ZIP-ийг импортлохоос ӨМНӨ шалгана (яг /admin/import/chinese-ийн parser).
 *   npx tsx scripts/validate-lesson-zip.mts path/to/hsk3-l02.zip
 */
import { readFileSync } from "node:fs";
import { buildLessonImportPreview } from "@/lib/import/lesson-zip-import";
import { parseChineseLessonZip } from "@/lib/import/chinese-lesson-zip-import";

(globalThis as unknown as { window: unknown }).window = globalThis; // parser зөвхөн browser-т ажилладаг гэсэн хамгаалалтыг тойрно

const path = process.argv[2];
if (!path) {
  console.error("ZIP файлын зам өгнө үү.");
  process.exit(1);
}
const buf = readFileSync(path);
const file = new File([buf], path.split("/").pop() ?? "lesson.zip", { type: "application/zip" });

(async () => {
  const res = await parseChineseLessonZip(file);
  console.log("errors:", res.errors);
  console.log("warnings:", res.warnings);
  console.log("preview:", buildLessonImportPreview(res));
  const note = res.lesson?.sourceNote;
  if (typeof note === "string" && note.startsWith("{")) {
    const json = JSON.parse(note) as Record<string, unknown>;
    const study = json.hskStudyContent as Record<string, unknown> | undefined;
    console.log("source_note keys:", Object.keys(json));
    if (study) {
      const texts = study.texts as Record<string, unknown> | null;
      console.log(
        "hskStudyContent: texts keys =",
        texts ? Object.keys(texts).length : 0,
        "| grammar =",
        Array.isArray(study.grammar) ? study.grammar.length : 0,
        "| vocabularyNotes =",
        Array.isArray(study.vocabularyNotes) ? study.vocabularyNotes.length : 0,
        "| workbook =",
        study.workbook ? Object.keys(study.workbook as object) : null
      );
    }
  }
  console.log("vocabulary:", res.vocabulary.length, "quiz:", res.quizQuestions.length, "media:", res.mediaFiles.length);
  process.exit(res.errors.length ? 2 : 0);
})();
