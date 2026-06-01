import type { ImportDraftApiBody } from "@/lib/admin/build-import-draft-request";
import type { LessonImportPayload } from "@/lib/supabase/admin-import";
import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";

function inferHskLevelFromCourseId(courseId: string): string | null {
  const match = courseId.toLowerCase().match(/hsk(\d)/);
  if (match?.[1]) return match[1];
  return null;
}

export function inferDefaultHskLevelForImport(body: ImportDraftApiBody): string {
  const jsonRaw = body.hskSourceNoteJson?.trim() || body.sourceNote?.trim() || "";
  if (jsonRaw.startsWith("{")) {
    const parsed = parseLessonSourceNote(jsonRaw);
    if (parsed.format === "json") {
      const fromNote = parsed.data.hskLevel;
      if (fromNote != null && String(fromNote).trim()) {
        return String(fromNote).trim();
      }
    }
  }

  const fromCourse = inferHskLevelFromCourseId(body.courseId);
  if (fromCourse) return fromCourse;

  return "1";
}

/** Fill optional vocabulary fields before server bulk import. */
export function sanitizeImportPayloadForServer(
  payload: LessonImportPayload,
  body: ImportDraftApiBody
): LessonImportPayload {
  const defaultHskLevel = inferDefaultHskLevelForImport(body);

  return {
    subtitles: payload.subtitles,
    quizQuestions: payload.quizQuestions,
    vocabulary: payload.vocabulary.map((row) => ({
      ...row,
      hskLevel: row.hskLevel?.trim() || defaultHskLevel,
    })),
  };
}
