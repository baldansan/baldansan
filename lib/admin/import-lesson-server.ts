import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { ImportDraftApiBody } from "@/lib/admin/build-import-draft-request";
import { parseImportErrorDetails } from "@/lib/admin/import-error-details";
import type { LessonPackageImportResult } from "@/lib/admin/import-lesson-package";
import { sanitizeImportPayloadForServer } from "@/lib/admin/sanitize-import-payload";
import { upsertDraftLessonFromPackage } from "@/lib/admin/upsert-draft-lesson-from-package";
import { bulkImportLessonContent } from "@/lib/supabase/admin-import";

export async function importDraftLessonOnServer(
  client: SupabaseClient,
  body: ImportDraftApiBody
): Promise<LessonPackageImportResult> {
  const packageLessonId = body.lessonId.trim();
  const courseId = body.courseId.trim();
  const warnings = [...body.warnings];

  function fail(
    errors: string[],
    partial: Partial<LessonPackageImportResult> = {}
  ): LessonPackageImportResult {
    return {
      ok: false,
      lessonId: partial.lessonId ?? packageLessonId,
      packageLessonId,
      courseId,
      vocabularyInserted: 0,
      quizInserted: 0,
      subtitlesInserted: 0,
      mediaUploaded: 0,
      mediaFailures: [],
      warnings,
      errors,
      validationDetails: parseImportErrorDetails(errors, packageLessonId),
      ...partial,
    };
  }

  if (!body.importPayload) {
    return fail(["ZIP parse data missing. Please validate again."]);
  }

  console.log("[import-server] creating draft lesson", {
    courseId,
    packageLessonId,
    vocabularyCount: body.importPayload.vocabulary.length,
    quizCount: body.importPayload.quizQuestions.length,
    sourceNoteIsJson: Boolean(
      body.hskSourceNoteJson?.trim().startsWith("{") ||
        body.sourceNote?.trim().startsWith("{")
    ),
  });

  const shell = await upsertDraftLessonFromPackage(client, body);
  if (!shell.ok) {
    return fail([shell.error ?? "Draft lesson upsert failed."], {
      warnings: [...warnings, ...shell.warnings],
    });
  }

  warnings.push(...shell.warnings);

  const resolvedLessonId = shell.resolvedLessonId;
  const importPayload = sanitizeImportPayloadForServer(body.importPayload, body);
  const imported = await bulkImportLessonContent(
    resolvedLessonId,
    importPayload,
    {
      mode: "replace",
      client,
      skipAdminGate: true,
    }
  );

  if (imported.error || !imported.data) {
    return fail([imported.error ?? "Bulk content import failed."], {
      lessonId: resolvedLessonId,
      created: shell.created,
    });
  }

  revalidatePath("/admin/lessons");
  revalidatePath(`/admin/lessons/${resolvedLessonId}/edit`);
  revalidatePath(`/lessons/${resolvedLessonId}/quiz`);

  const message = shell.created
    ? "Шинэ draft lesson үүсгээд import амжилттай хийлээ."
    : "Одоо байгаа draft lesson дээр import хийлээ.";

  const result: LessonPackageImportResult = {
    ok: true,
    lessonId: resolvedLessonId,
    packageLessonId,
    courseId,
    vocabularyInserted: imported.data.vocabularyInserted,
    quizInserted: imported.data.quizQuestionsInserted,
    oldQuizCountDeleted: imported.data.oldQuizCountDeleted,
    newQuizCountInserted: imported.data.newQuizCountInserted,
    subtitlesInserted: imported.data.subtitlesInserted,
    mediaUploaded: 0,
    mediaFailures: [],
    warnings,
    errors: [],
    created: shell.created,
    message,
  };

  console.log("[import-server] import result", result);
  return result;
}
