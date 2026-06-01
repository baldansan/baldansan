import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportDraftApiBody } from "@/lib/admin/build-import-draft-request";
import { inferLanguageTagFromCourseId } from "@/lib/language-track";
import { canonicalLessonId } from "@/lib/lesson-id";
import {
  mergeJsonSourceNoteFields,
  parseLessonSourceNote,
} from "@/lib/lesson/source-note-json";
import { fetchLessonRowById } from "@/lib/supabase/content";

export type DraftLessonShellResult = {
  ok: boolean;
  resolvedLessonId: string;
  packageLessonId: string;
  created: boolean;
  error?: string;
  warnings: string[];
};

function courseTitleFromId(courseId: string): string {
  if (courseId === "korean-level-1" || courseId.startsWith("korean")) {
    return "Солонгос хэл";
  }
  if (courseId.includes("hsk")) {
    return courseId.toUpperCase();
  }
  return courseId;
}

function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

function isInvalidIdTypeError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid input syntax") ||
    lower.includes("cannot cast") ||
    (lower.includes("type") &&
      (lower.includes("integer") ||
        lower.includes("bigint") ||
        lower.includes("numeric") ||
        lower.includes("number")))
  );
}

function appendPackageLessonIdToSourceNote(
  sourceNote: string,
  packageLessonId: string
): string {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format === "json") {
    if (parsed.data.packageLessonId === packageLessonId) {
      return sourceNote;
    }
    return mergeJsonSourceNoteFields(sourceNote, {
      packageLessonId,
    });
  }

  const marker = `packageLessonId=${packageLessonId}`;
  if (sourceNote.includes(marker)) {
    return sourceNote;
  }
  return `${sourceNote} · ${marker}`;
}

function stripMultilingualColumns<T extends Record<string, unknown>>(payload: T) {
  const {
    target_language: _t,
    ui_language: _u,
    language: _l,
    ...basePayload
  } = payload;
  return basePayload;
}

async function resolveOrderIndex(
  client: SupabaseClient,
  courseId: string,
  preferred?: number
): Promise<number> {
  if (preferred != null && Number.isFinite(preferred) && preferred >= 1) {
    return Math.floor(preferred);
  }
  const { data } = await client
    .from("lessons")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.order_index ?? 0) + 1;
}

async function ensureDraftCourseExists(
  client: SupabaseClient,
  courseId: string,
  allowAutoCreate = true
): Promise<{ ok: boolean; error?: string; created?: boolean }> {
  const { data, error } = await client
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: `Course lookup failed: ${error.message}` };
  }
  if (data) {
    return { ok: true };
  }

  if (!allowAutoCreate) {
    return {
      ok: false,
      error: `${courseId} course байхгүй байна. Эхлээд course үүсгэнэ үү.`,
    };
  }

  const isKorean = courseId.toLowerCase().startsWith("korean");
  const { error: insertError } = await client.from("courses").insert({
    id: courseId,
    title: courseTitleFromId(courseId),
    description: isKorean
      ? "Korean Level 1 — auto-created from ZIP import."
      : `Auto-created from ZIP import (${courseId}).`,
    level: isKorean ? "Korean" : "HSK",
    status: "available",
    order_index: 10,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: true };
    }
    return {
      ok: false,
      error: `Course not found: ${courseId}. ${insertError.message}`,
    };
  }

  return { ok: true, created: true };
}

async function updateExistingLesson(
  client: SupabaseClient,
  resolvedId: string,
  rowPayload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const { error: updateError } = await client
    .from("lessons")
    .update(rowPayload)
    .eq("id", resolvedId);

  if (!updateError) {
    return { ok: true };
  }

  const message = updateError.message ?? "Update failed.";
  if (!isMissingColumnError(message)) {
    return { ok: false, error: `Failed to update draft lesson: ${message}` };
  }

  const { error: fallbackError } = await client
    .from("lessons")
    .update(stripMultilingualColumns(rowPayload))
    .eq("id", resolvedId);

  if (fallbackError) {
    return {
      ok: false,
      error: `Failed to update draft lesson: ${fallbackError.message}`,
    };
  }

  return { ok: true };
}

async function insertDraftLessonRow(
  client: SupabaseClient,
  packageLessonId: string,
  rowPayload: Record<string, unknown>
): Promise<{ ok: boolean; resolvedLessonId?: string; error?: string }> {
  const insertWithId = async (payload: Record<string, unknown>) =>
    client
      .from("lessons")
      .insert({ id: packageLessonId, ...payload })
      .select("id")
      .single();

  const insertWithoutId = async (payload: Record<string, unknown>) =>
    client.from("lessons").insert(payload).select("id").single();

  let result = await insertWithId(rowPayload);

  if (result.error) {
    const message = result.error.message ?? "Insert failed.";

    if (result.error.code === "23505") {
      const existing = await fetchLessonRowById(client, packageLessonId);
      if (existing) {
        return { ok: true, resolvedLessonId: existing.canonicalId };
      }
    }

    if (isMissingColumnError(message)) {
      result = await insertWithId(stripMultilingualColumns(rowPayload));
    } else if (isInvalidIdTypeError(message)) {
      result = await insertWithoutId({
        ...stripMultilingualColumns(rowPayload),
        source_note: appendPackageLessonIdToSourceNote(
          String(rowPayload.source_note ?? "ZIP package import"),
          packageLessonId
        ),
      });
    } else {
      return { ok: false, error: `Draft lesson create failed: ${message}` };
    }
  }

  if (result.error) {
    const message = result.error.message ?? "Insert failed.";
    if (isInvalidIdTypeError(message)) {
      result = await insertWithoutId({
        ...stripMultilingualColumns(rowPayload),
        source_note: appendPackageLessonIdToSourceNote(
          String(rowPayload.source_note ?? "ZIP package import"),
          packageLessonId
        ),
      });
    } else {
      return { ok: false, error: `Draft lesson create failed: ${message}` };
    }
  }

  if (result.error) {
    return {
      ok: false,
      error: `Draft lesson create failed: ${result.error.message ?? "Insert failed."}`,
    };
  }

  if (!result.data?.id) {
    return { ok: false, error: "Draft lesson create failed: no id returned." };
  }

  return {
    ok: true,
    resolvedLessonId: canonicalLessonId(result.data.id),
  };
}

/** Create or update a draft lesson shell from a ZIP import package body. */
export async function upsertDraftLessonFromPackage(
  client: SupabaseClient,
  body: ImportDraftApiBody
): Promise<DraftLessonShellResult> {
  const packageLessonId = body.lessonId.trim();
  const courseId = body.courseId.trim();
  const warnings: string[] = [];
  const allowAutoCreateCourse = body.allowAutoCreateCourse !== false;

  if (!courseId || !packageLessonId) {
    return {
      ok: false,
      resolvedLessonId: packageLessonId,
      packageLessonId,
      created: false,
      error: "courseId and lessonId are required.",
      warnings,
    };
  }

  const courseReady = await ensureDraftCourseExists(
    client,
    courseId,
    allowAutoCreateCourse
  );
  if (!courseReady.ok) {
    return {
      ok: false,
      resolvedLessonId: packageLessonId,
      packageLessonId,
      created: false,
      error: courseReady.error,
      warnings,
    };
  }
  if (courseReady.created) {
    warnings.push(
      `Course "${courseId}" was auto-created (${courseTitleFromId(courseId)}).`
    );
  }

  const existing = await fetchLessonRowById(client, packageLessonId);
  const sourceNoteBase =
    body.sourceNote ?? `ZIP package import (${body.packageVersion ?? "1.0"})`;
  const sourceNote =
    body.lessonType === "prelesson"
      ? `${sourceNoteBase} · lessonType=prelesson`
      : sourceNoteBase;

  const language = body.language || inferLanguageTagFromCourseId(courseId);
  const mediaStatus =
    body.mediaStatus === "ready" || body.mediaStatus === "pending"
      ? body.mediaStatus
      : "missing";

  const rowPayload = {
    course_id: courseId,
    title: body.title,
    chinese_title: body.targetTitle,
    subtitle: body.subtitle ?? null,
    description: body.description ?? null,
    duration: body.duration ?? null,
    status: "draft" as const,
    order_index: existing
      ? (body.orderIndex ?? existing.row.order_index ?? 1)
      : await resolveOrderIndex(client, courseId, body.orderIndex),
    source_note: sourceNote,
    media_status: mediaStatus,
    language,
    target_language: body.targetLanguage ?? null,
    ui_language: body.uiLanguage ?? null,
    vocabulary_count: 0,
    quiz_count: 0,
  };

  if (existing) {
    const updated = await updateExistingLesson(
      client,
      existing.canonicalId,
      rowPayload
    );
    if (!updated.ok) {
      return {
        ok: false,
        resolvedLessonId: existing.canonicalId,
        packageLessonId,
        created: false,
        error: updated.error,
        warnings,
      };
    }

    return {
      ok: true,
      resolvedLessonId: existing.canonicalId,
      packageLessonId,
      created: false,
      warnings,
    };
  }

  const inserted = await insertDraftLessonRow(
    client,
    packageLessonId,
    rowPayload
  );
  if (!inserted.ok || !inserted.resolvedLessonId) {
    return {
      ok: false,
      resolvedLessonId: packageLessonId,
      packageLessonId,
      created: false,
      error: inserted.error ?? "Draft lesson create failed.",
      warnings,
    };
  }

  const verified = await fetchLessonRowById(client, inserted.resolvedLessonId);
  if (!verified) {
    return {
      ok: false,
      resolvedLessonId: inserted.resolvedLessonId,
      packageLessonId,
      created: false,
      error: `Draft lesson was not saved to the database (${packageLessonId}). Check admin permissions and RLS policies.`,
      warnings,
    };
  }

  if (inserted.resolvedLessonId !== packageLessonId) {
    warnings.push(
      `Package lessonId "${packageLessonId}" stored in source_note; database id is "${inserted.resolvedLessonId}".`
    );
  }

  return {
    ok: true,
    resolvedLessonId: verified.canonicalId,
    packageLessonId,
    created: true,
    warnings,
  };
}
