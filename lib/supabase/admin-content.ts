import type { AdminContentStatus } from "@/lib/admin/lesson-status";
import {
  canonicalLessonId,
  lessonIdQueryCandidates,
  normalizeLessonRouteId,
} from "@/lib/lesson-id";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_ACTIVITY_ACTIONS,
  buildShallowDiffSummary,
  logAdminActivity,
  logAdminActivityFireAndForget,
  publishActionForStatus,
} from "@/lib/supabase/admin-activity";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { fetchLessonRowById } from "@/lib/supabase/content";

export type AdminContentResult<T> = {
  data: T | null;
  error: string | null;
};

export type AdminSubtitleLine = {
  id: number;
  lesson_id: string;
  start_time: string;
  end_time: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  order_index: number;
};

export type AdminVocabularyWord = {
  id: number;
  lesson_id: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  hsk_level: string | null;
  example_chinese: string | null;
  example_mongolian: string | null;
  order_index: number;
};

export type AdminQuizQuestion = {
  id: number;
  lesson_id: string;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_index: number;
};

export type LessonCounts = {
  vocabularyCount: number;
  quizCount: number;
};

export type LessonCompleteness = {
  hasMetadata: boolean;
  subtitleCount: number;
  vocabularyCount: number;
  quizCount: number;
  readyToPublish: boolean;
};

const VALID_LESSON_STATUSES: AdminContentStatus[] = [
  "draft",
  "available",
  "archived",
];

function isValidLessonStatus(status: string): status is AdminContentStatus {
  return (VALID_LESSON_STATUSES as string[]).includes(status);
}

async function queryLessonById<T extends Record<string, unknown>>(
  select: string,
  lessonId: string
): Promise<{ data: T | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase not configured." };
  }

  const normalizedId = normalizeLessonRouteId(lessonId);
  const candidates = lessonIdQueryCandidates(normalizedId);

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("lessons")
      .select(select)
      .eq("id", candidate)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }
    if (data) {
      if (typeof candidate === "number") {
        console.warn("[lesson-id] Admin content resolved lesson using numeric id", {
          lessonId: normalizedId,
          candidate,
        });
      }
      return { data: data as unknown as T, error: null };
    }
  }

  return { data: null, error: null };
}

function lessonIdForChildRows(lessonId: string): string {
  return canonicalLessonId(normalizeLessonRouteId(lessonId));
}

export type CreateDraftLessonInput = {
  id: string;
  courseId: string;
  title: string;
  chineseTitle: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  status?: AdminContentStatus;
  orderIndex?: number;
  language?: string;
};

export type UpdateLessonMetadataInput = {
  title: string;
  chineseTitle: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  status: AdminContentStatus;
  orderIndex: number;
  vocabularyCount: number;
  quizCount: number;
};

export type UpdateLessonMediaInput = {
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
  sourceNote?: string;
  mediaStatus: "missing" | "pending" | "ready";
};

export type AdminLessonMetadataRow = {
  id: string;
  course_id: string;
  title: string;
  chinese_title: string | null;
  subtitle: string | null;
  description: string | null;
  duration: string | null;
  status: string;
  order_index: number;
  vocabulary_count: number;
  quiz_count: number;
  video_url: string | null;
  thumbnail_url: string | null;
  image_url: string | null;
  audio_url: string | null;
  source_note: string | null;
  media_status: string;
};

function metadataSnapshotFromRow(
  row: AdminLessonMetadataRow
): Record<string, unknown> {
  return {
    title: row.title,
    chineseTitle: row.chinese_title,
    subtitle: row.subtitle,
    description: row.description,
    duration: row.duration,
    status: row.status,
    orderIndex: row.order_index,
    vocabularyCount: row.vocabulary_count,
    quizCount: row.quiz_count,
  };
}

function metadataSnapshotFromInput(
  input: UpdateLessonMetadataInput
): Record<string, unknown> {
  return {
    title: input.title,
    chineseTitle: input.chineseTitle,
    subtitle: input.subtitle ?? null,
    description: input.description ?? null,
    duration: input.duration ?? null,
    status: input.status,
    orderIndex: input.orderIndex,
    vocabularyCount: input.vocabularyCount,
    quizCount: input.quizCount,
  };
}

function mediaSnapshotFromRow(
  row: AdminLessonMetadataRow
): Record<string, unknown> {
  return {
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    imageUrl: row.image_url,
    audioUrl: row.audio_url,
    sourceNote: row.source_note,
    mediaStatus: row.media_status,
  };
}

function mediaSnapshotFromInput(
  input: UpdateLessonMediaInput
): Record<string, unknown> {
  return {
    videoUrl: input.videoUrl ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    imageUrl: input.imageUrl ?? null,
    audioUrl: input.audioUrl ?? null,
    sourceNote: input.sourceNote ?? null,
    mediaStatus: input.mediaStatus,
  };
}

export type CreateSubtitleLineInput = {
  lessonId: string;
  startTime: string;
  endTime: string;
  chinese: string;
  pinyin?: string;
  mongolian: string;
  orderIndex?: number;
};

export type CreateVocabularyWordInput = {
  lessonId: string;
  chinese: string;
  pinyin?: string;
  mongolian: string;
  hskLevel?: string;
  exampleChinese?: string;
  exampleMongolian?: string;
  orderIndex?: number;
};

export type CreateQuizQuestionInput = {
  lessonId: string;
  type: "multiple_choice" | "cloze";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  orderIndex?: number;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

const RLS_HINT = "Admin update policy may not be enabled.";

function notConfigured<T>(): AdminContentResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function parseOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.filter((item): item is string => typeof item === "string");
}

function formatWriteError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Ийм ID-тай lesson аль хэдийн байна.";
  }
  const message = error.message ?? "";
  if (
    error.code === "42501" ||
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return `${RLS_HINT} (${message})`;
  }
  return message || "Хадгалахад алдаа гарлаа.";
}

async function requireAdmin(): Promise<AdminContentResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

async function nextOrderIndex(
  table: "subtitle_lines" | "vocabulary_words" | "quiz_questions",
  lessonId: string
): Promise<number> {
  if (!supabase) return 1;
  const { data } = await supabase
    .from(table)
    .select("order_index")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.order_index ?? 0) + 1;
}

// --- Lesson metadata ---

export async function getNextLessonOrderIndex(
  courseId: string
): Promise<AdminContentResult<number>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("course_id", courseId.trim())
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    const next = (data?.order_index ?? 0) + 1;
    return { data: next, error: null };
  } catch {
    return { data: null, error: "Order index тооцоолоход алдаа гарлаа." };
  }
}

export async function createDraftLesson(
  input: CreateDraftLessonInput
): Promise<AdminContentResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const lessonId = input.id.trim();
  const courseId = input.courseId.trim();

  let orderIndex = input.orderIndex;
  if (orderIndex == null || !Number.isFinite(orderIndex)) {
    const next = await getNextLessonOrderIndex(courseId);
    if (next.error) {
      return { data: null, error: next.error };
    }
    orderIndex = next.data ?? 1;
  }

  const status = input.status ?? "draft";

  try {
    const { error } = await supabase.from("lessons").insert({
      id: lessonId,
      course_id: courseId,
      title: input.title.trim(),
      chinese_title: input.chineseTitle.trim(),
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      duration: input.duration?.trim() || null,
      vocabulary_count: 0,
      quiz_count: 0,
      status,
      order_index: orderIndex,
      language: input.language?.trim() || null,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.lessonCreated,
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: `Lesson ${lessonId} created`,
      description: input.title.trim(),
      metadata: { courseId, status, orderIndex },
    });

    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Хичээл үүсгэхэд алдаа гарлаа." };
  }
}

export function validateUpdateLessonMetadataInput(
  input: UpdateLessonMetadataInput
): AdminContentResult<UpdateLessonMetadataInput> {
  const title = input.title?.trim() ?? "";
  const chineseTitle = input.chineseTitle?.trim() ?? "";

  if (!title) {
    return { data: null, error: "Title заавал." };
  }
  if (!chineseTitle) {
    return { data: null, error: "Chinese title заавал." };
  }
  if (!isValidLessonStatus(input.status)) {
    return {
      data: null,
      error: "Status: draft, available, archived л сонгоно уу.",
    };
  }
  if (!Number.isFinite(input.orderIndex) || input.orderIndex < 1) {
    return { data: null, error: "Order index 1-ээс эхлэх тоо байх ёстой." };
  }
  if (!Number.isFinite(input.vocabularyCount) || input.vocabularyCount < 0) {
    return { data: null, error: "Vocabulary count 0 буюу түүнээс их байх ёстой." };
  }
  if (!Number.isFinite(input.quizCount) || input.quizCount < 0) {
    return { data: null, error: "Quiz count 0 буюу түүнээс их байх ёстой." };
  }

  return {
    data: {
      title,
      chineseTitle,
      subtitle: input.subtitle?.trim() ?? "",
      description: input.description?.trim() ?? "",
      duration: input.duration?.trim() ?? "",
      status: input.status,
      orderIndex: Math.floor(input.orderIndex),
      vocabularyCount: Math.floor(input.vocabularyCount),
      quizCount: Math.floor(input.quizCount),
    },
    error: null,
  };
}

function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

export async function getAdminLessonMetadataById(
  lessonId: string
): Promise<AdminContentResult<AdminLessonMetadataRow>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const fullSelect =
      "id, course_id, title, chinese_title, subtitle, description, duration, status, order_index, vocabulary_count, quiz_count, video_url, thumbnail_url, image_url, audio_url, source_note, media_status";
    const coreSelect =
      "id, course_id, title, chinese_title, subtitle, description, duration, status, order_index, vocabulary_count, quiz_count, video_url, thumbnail_url, audio_url, source_note, media_status";

    let result = await queryLessonById<AdminLessonMetadataRow>(fullSelect, lessonId);
    if (result.error && isMissingColumnError(result.error)) {
      result = await queryLessonById<AdminLessonMetadataRow>(coreSelect, lessonId);
    }

    if (result.error) {
      return { data: null, error: result.error };
    }
    if (!result.data) {
      return { data: null, error: "Хичээл олдсонгүй." };
    }

    return { data: result.data, error: null };
  } catch {
    return { data: null, error: "Metadata уншихад алдаа гарлаа." };
  }
}

export async function updateLessonMetadata(
  lessonId: string,
  input: UpdateLessonMetadataInput
): Promise<AdminContentResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const validated = validateUpdateLessonMetadataInput(input);
  if (validated.error || !validated.data) {
    return { data: null, error: validated.error ?? "Validation failed." };
  }

  const v = validated.data;

  const beforeRow = await getAdminLessonMetadataById(lessonId);
  const beforeSnapshot = beforeRow.data
    ? metadataSnapshotFromRow(beforeRow.data)
    : undefined;
  const afterSnapshot = metadataSnapshotFromInput(v);

  try {
    const { error } = await supabase
      .from("lessons")
      .update({
        title: v.title,
        chinese_title: v.chineseTitle,
        subtitle: v.subtitle || null,
        description: v.description || null,
        duration: v.duration || null,
        status: v.status,
        order_index: v.orderIndex,
        vocabulary_count: v.vocabularyCount,
        quiz_count: v.quizCount,
      })
      .eq("id", lessonId);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await logAdminActivity({
      action: ADMIN_ACTIVITY_ACTIONS.lessonMetadataUpdated,
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: `Lesson ${lessonId} metadata updated`,
      description: v.title,
      metadata: { status: v.status, orderIndex: v.orderIndex },
      beforeSnapshot,
      afterSnapshot,
      diffSummary: buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
    });

    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Metadata хадгалахад алдаа гарлаа." };
  }
}

const VALID_MEDIA_STATUSES = ["missing", "pending", "ready"] as const;

function isValidMediaStatus(
  status: string
): status is UpdateLessonMediaInput["mediaStatus"] {
  return (VALID_MEDIA_STATUSES as readonly string[]).includes(status);
}

export function validateUpdateLessonMediaInput(
  input: UpdateLessonMediaInput
): {
  data: UpdateLessonMediaInput | null;
  error: string | null;
  warnings: string[];
} {
  if (!isValidMediaStatus(input.mediaStatus)) {
    return {
      data: null,
      error: "media_status must be missing, pending, or ready.",
      warnings: [],
    };
  }

  const warnings: string[] = [];
  const checkUrl = (label: string, value?: string) => {
    const trimmed = value?.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      warnings.push(`${label} should start with http:// or https://`);
    }
  };

  checkUrl("Video URL", input.videoUrl);
  checkUrl("Thumbnail URL", input.thumbnailUrl);
  checkUrl("Image URL", input.imageUrl);
  checkUrl("Audio URL", input.audioUrl);

  return {
    data: {
      videoUrl: input.videoUrl?.trim() || undefined,
      thumbnailUrl: input.thumbnailUrl?.trim() || undefined,
      imageUrl: input.imageUrl?.trim() || undefined,
      audioUrl: input.audioUrl?.trim() || undefined,
      sourceNote: input.sourceNote?.trim() || undefined,
      mediaStatus: input.mediaStatus,
    },
    error: null,
    warnings,
  };
}

export async function updateLessonMedia(
  lessonId: string,
  input: UpdateLessonMediaInput
): Promise<AdminContentResult<{ id: string; warnings?: string[] }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const validated = validateUpdateLessonMediaInput(input);
  if (!validated.data) {
    return { data: null, error: validated.error ?? "Validation failed." };
  }

  const v = validated.data;

  const beforeRow = await getAdminLessonMetadataById(lessonId);
  const beforeSnapshot = beforeRow.data
    ? mediaSnapshotFromRow(beforeRow.data)
    : undefined;
  const afterSnapshot = mediaSnapshotFromInput(v);

  try {
    const heroUrl = v.imageUrl || v.thumbnailUrl;
    const updatePayload: Record<string, unknown> = {
      video_url: v.videoUrl || null,
      thumbnail_url: heroUrl || null,
      audio_url: v.audioUrl || null,
      source_note: v.sourceNote || null,
      media_status: v.mediaStatus,
    };
    if (heroUrl) {
      updatePayload.image_url = heroUrl;
    }

    let { error } = await supabase
      .from("lessons")
      .update(updatePayload)
      .eq("id", lessonId);

    if (error && isMissingColumnError(error.message) && "image_url" in updatePayload) {
      const { image_url: _removed, ...withoutImageUrl } = updatePayload;
      ({ error } = await supabase
        .from("lessons")
        .update(withoutImageUrl)
        .eq("id", lessonId));
    }

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    const cleared =
      !v.videoUrl && !v.thumbnailUrl && !v.imageUrl && !v.audioUrl && v.mediaStatus === "missing";
    await logAdminActivity({
      action: cleared
        ? ADMIN_ACTIVITY_ACTIONS.mediaCleared
        : ADMIN_ACTIVITY_ACTIONS.mediaUpdated,
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: cleared
        ? `Lesson ${lessonId} media cleared`
        : `Lesson ${lessonId} media updated`,
      metadata: { mediaStatus: v.mediaStatus },
      beforeSnapshot,
      afterSnapshot,
      diffSummary: buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
    });

    return {
      data: {
        id: lessonId,
        warnings: validated.warnings.length > 0 ? validated.warnings : undefined,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Media metadata хадгалахад алдаа гарлаа." };
  }
}

export async function clearLessonMedia(
  lessonId: string
): Promise<AdminContentResult<{ id: string }>> {
  return updateLessonMedia(lessonId, {
    videoUrl: "",
    thumbnailUrl: "",
    audioUrl: "",
    sourceNote: "",
    mediaStatus: "missing",
  });
}

export async function updateLessonStatus(
  lessonId: string,
  status: AdminContentStatus
): Promise<AdminContentResult<{ id: string; status: AdminContentStatus }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  if (!isValidLessonStatus(status)) {
    return { data: null, error: "Буруу статус: draft, available, archived л зөвшөөрнө." };
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const beforeResult = await queryLessonById<{ status: string; release_status?: string }>(
    "status, release_status",
    lessonId
  );
  const beforeSnapshot = beforeResult.data
    ? {
        status: beforeResult.data.status,
        releaseStatus: beforeResult.data.release_status ?? null,
      }
    : undefined;
  const afterSnapshot = { status, releaseStatus: beforeResult.data?.release_status ?? null };

  try {
    const { error } = await supabase
      .from("lessons")
      .update({ status })
      .eq("id", lessonId);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await logAdminActivity({
      action: publishActionForStatus(status),
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: `Lesson ${lessonId} status → ${status}`,
      metadata: { status },
      beforeSnapshot,
      afterSnapshot: { status, releaseStatus: afterSnapshot.releaseStatus },
      diffSummary: buildShallowDiffSummary(beforeSnapshot, {
        status,
        releaseStatus: afterSnapshot.releaseStatus,
      }),
    });

    return { data: { id: lessonId, status }, error: null };
  } catch {
    return { data: null, error: "Status шинэчлэхэд алдаа гарлаа." };
  }
}

async function deleteLessonChildRows(
  resolvedLessonId: string
): Promise<string | null> {
  if (!supabase) return "Supabase not configured.";

  for (const table of [
    "subtitle_lines",
    "vocabulary_words",
    "quiz_questions",
  ] as const) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("lesson_id", resolvedLessonId);
    if (error) {
      return formatWriteError(error);
    }
  }

  return null;
}

/** Permanently delete a lesson and related content (DB cascade or manual child delete). */
export async function deleteAdminLesson(
  lessonId: string
): Promise<AdminContentResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const beforeResult = await queryLessonById<{
    id: string;
    title: string | null;
    status: string;
    course_id: string;
  }>("id, title, status, course_id", lessonId);

  if (!beforeResult.data) {
    return {
      data: null,
      error: beforeResult.error ?? "Хичээл олдсонгүй.",
    };
  }

  const resolvedId = canonicalLessonId(beforeResult.data.id);
  const beforeSnapshot = {
    id: resolvedId,
    title: beforeResult.data.title,
    status: beforeResult.data.status,
    courseId: beforeResult.data.course_id,
  };

  try {
    let { error } = await supabase.from("lessons").delete().eq("id", resolvedId);

    if (error) {
      const childError = await deleteLessonChildRows(resolvedId);
      if (childError) {
        return { data: null, error: childError };
      }

      const retry = await supabase.from("lessons").delete().eq("id", resolvedId);
      error = retry.error;
    }

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await logAdminActivity({
      action: ADMIN_ACTIVITY_ACTIONS.lessonDeleted,
      entityType: "lesson",
      entityId: resolvedId,
      lessonId: resolvedId,
      title: `Lesson ${resolvedId} deleted`,
      metadata: { courseId: beforeResult.data.course_id },
      beforeSnapshot,
      afterSnapshot: {},
      diffSummary: buildShallowDiffSummary(beforeSnapshot, null),
    });

    return { data: { id: resolvedId }, error: null };
  } catch {
    return { data: null, error: "Хичээл устгахад алдаа гарлаа." };
  }
}

function lessonHasMetadata(row: {
  title: string | null;
  chinese_title: string | null;
  description: string | null;
  duration: string | null;
}): boolean {
  return Boolean(
    row.title?.trim() &&
      row.chinese_title?.trim() &&
      row.description?.trim() &&
      row.duration?.trim()
  );
}

export type LessonContentRowCounts = {
  subtitles: number;
  vocabulary: number;
  quizQuestions: number;
};

export async function getLessonContentRowCounts(
  lessonId: string
): Promise<AdminContentResult<LessonContentRowCounts>> {
  const result = await getLessonCompleteness(lessonId);
  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }
  return {
    data: {
      subtitles: result.data.subtitleCount,
      vocabulary: result.data.vocabularyCount,
      quizQuestions: result.data.quizCount,
    },
    error: null,
  };
}

export async function getLessonCompleteness(
  lessonId: string,
  client?: import("@supabase/supabase-js").SupabaseClient,
  options?: { skipAdminGate?: boolean }
): Promise<AdminContentResult<LessonCompleteness>> {
  const db = client ?? supabase;
  if (!db || !hasSupabaseConfig) {
    return notConfigured();
  }

  if (!options?.skipAdminGate && !client) {
    const gate = await requireAdmin();
    if (gate.error) {
      return { data: null, error: gate.error };
    }
  }

  const trimmedId = lessonId.trim();
  const idCandidates = [
    trimmedId,
    ...lessonIdQueryCandidates(trimmedId).map(String),
  ];

  try {
    let lesson: {
      id: string | number;
      title: string;
      chinese_title: string | null;
      description: string | null;
      duration: string | null;
    } | null = null;

    for (const candidate of [...new Set(idCandidates)]) {
      const { data, error: lessonError } = await db
        .from("lessons")
        .select("id, title, chinese_title, description, duration")
        .eq("id", candidate)
        .maybeSingle();

      if (lessonError) {
        return { data: null, error: formatWriteError(lessonError) };
      }
      if (data) {
        lesson = data;
        break;
      }
    }

    if (!lesson) {
      const { data: ilikeRow, error: ilikeError } = await db
        .from("lessons")
        .select("id, title, chinese_title, description, duration")
        .ilike("id", trimmedId)
        .maybeSingle();

      if (ilikeError) {
        return { data: null, error: formatWriteError(ilikeError) };
      }
      lesson = ilikeRow;
    }

    if (!lesson) {
      return { data: null, error: "Lesson metadata not found." };
    }

    const resolvedId = canonicalLessonId(lesson.id);
    const [subtitles, vocabulary, quiz] = await Promise.all([
      db
        .from("subtitle_lines")
        .select("id", { count: "exact", head: true })
        .eq("lesson_id", resolvedId),
      db
        .from("vocabulary_words")
        .select("id", { count: "exact", head: true })
        .eq("lesson_id", resolvedId),
      db
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .eq("lesson_id", resolvedId),
    ]);

    if (subtitles.error) {
      return { data: null, error: formatWriteError(subtitles.error) };
    }
    if (vocabulary.error) {
      return { data: null, error: formatWriteError(vocabulary.error) };
    }
    if (quiz.error) {
      return { data: null, error: formatWriteError(quiz.error) };
    }

    const hasMetadata = lessonHasMetadata(lesson);
    const subtitleCount = subtitles.count ?? 0;
    const vocabularyCount = vocabulary.count ?? 0;
    const quizCount = quiz.count ?? 0;
    const readyToPublish =
      hasMetadata &&
      subtitleCount > 0 &&
      vocabularyCount >= 5 &&
      quizCount >= 3;

    return {
      data: {
        hasMetadata,
        subtitleCount,
        vocabularyCount,
        quizCount,
        readyToPublish,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Бүрэн байдлыг шалгахад алдаа гарлаа." };
  }
}

export async function getLessonMetadataCounts(
  lessonId: string
): Promise<AdminContentResult<LessonCounts & { metaVocabulary: number; metaQuiz: number }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("lessons")
      .select("vocabulary_count, quiz_count")
      .eq("id", lessonId)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }
    if (!data) {
      return { data: null, error: "Хичээл олдсонгүй." };
    }

    const vocab = await getVocabularyWordsByLessonId(lessonId);
    const quiz = await getQuizQuestionsByLessonId(lessonId);
    if (vocab.error) return { data: null, error: vocab.error };
    if (quiz.error) return { data: null, error: quiz.error };

    return {
      data: {
        metaVocabulary: data.vocabulary_count,
        metaQuiz: data.quiz_count,
        vocabularyCount: vocab.data?.length ?? 0,
        quizCount: quiz.data?.length ?? 0,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Тоо уншихад алдаа гарлаа." };
  }
}

export async function refreshLessonCounts(
  lessonId: string,
  client?: import("@supabase/supabase-js").SupabaseClient,
  options?: { skipAdminGate?: boolean }
): Promise<AdminContentResult<LessonCounts>> {
  const db = client ?? supabase;
  if (!db || !hasSupabaseConfig) {
    return notConfigured();
  }

  if (!options?.skipAdminGate) {
    const gate = await requireAdmin();
    if (gate.error) {
      return { data: null, error: gate.error };
    }
  }

  try {
    let resolvedId = lessonId.trim();
    if (client) {
      const row = await fetchLessonRowById(client, resolvedId);
      if (row) {
        resolvedId = row.canonicalId;
      }
    }

    const { count: vocabCount, error: vocabError } = await db
      .from("vocabulary_words")
      .select("id", { count: "exact", head: true })
      .eq("lesson_id", resolvedId);

    if (vocabError) {
      return { data: null, error: formatWriteError(vocabError) };
    }

    const { count: quizRowCount, error: quizError } = await db
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("lesson_id", resolvedId);

    if (quizError) {
      return { data: null, error: formatWriteError(quizError) };
    }

    const vocabularyCount = vocabCount ?? 0;
    const quizCount = quizRowCount ?? 0;

    const { error: updateError } = await db
      .from("lessons")
      .update({
        vocabulary_count: vocabularyCount,
        quiz_count: quizCount,
      })
      .eq("id", resolvedId);

    if (updateError) {
      return { data: null, error: formatWriteError(updateError) };
    }

    return { data: { vocabularyCount, quizCount }, error: null };
  } catch {
    return { data: null, error: "Тоо шинэчлэхэд алдаа гарлаа." };
  }
}

// --- Subtitles ---

export async function getSubtitleLinesByLessonId(
  lessonId: string
): Promise<AdminContentResult<AdminSubtitleLine[]>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("subtitle_lines")
      .select(
        "id, lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: (data as AdminSubtitleLine[]) ?? [], error: null };
  } catch {
    return { data: null, error: "Subtitle уншихад алдаа гарлаа." };
  }
}

export async function createSubtitleLine(
  input: CreateSubtitleLineInput
): Promise<AdminContentResult<AdminSubtitleLine>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const orderIndex =
    input.orderIndex ?? (await nextOrderIndex("subtitle_lines", input.lessonId));

  try {
    const { error } = await supabase.from("subtitle_lines").insert({
      lesson_id: input.lessonId,
      start_time: input.startTime.trim(),
      end_time: input.endTime.trim(),
      chinese: input.chinese.trim(),
      pinyin: input.pinyin?.trim() || null,
      mongolian: input.mongolian.trim(),
      order_index: orderIndex,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    const list = await getSubtitleLinesByLessonId(input.lessonId);
    const created = list.data?.find((row) => row.order_index === orderIndex);
    if (!created) {
      return { data: null, error: null };
    }
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.subtitleCreated,
      entityType: "subtitle",
      entityId: String(created.id),
      lessonId: input.lessonId,
      title: `Subtitle added to lesson ${input.lessonId}`,
      metadata: { orderIndex },
    });
    return { data: created, error: null };
  } catch {
    return { data: null, error: "Subtitle нэмэхэд алдаа гарлаа." };
  }
}

export async function deleteSubtitleLine(
  id: number,
  lessonId?: string
): Promise<AdminContentResult<null>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { error } = await supabase.from("subtitle_lines").delete().eq("id", id);
    if (error) {
      return { data: null, error: formatWriteError(error) };
    }
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.subtitleDeleted,
      entityType: "subtitle",
      entityId: String(id),
      lessonId,
      title: `Subtitle ${id} deleted`,
    });
    return { data: null, error: null };
  } catch {
    return { data: null, error: "Subtitle устгахад алдаа гарлаа." };
  }
}

// --- Vocabulary ---

export async function getVocabularyWordsByLessonId(
  lessonId: string
): Promise<AdminContentResult<AdminVocabularyWord[]>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("vocabulary_words")
      .select(
        "id, lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: (data as AdminVocabularyWord[]) ?? [], error: null };
  } catch {
    return { data: null, error: "Vocabulary уншихад алдаа гарлаа." };
  }
}

export async function createVocabularyWord(
  input: CreateVocabularyWordInput
): Promise<AdminContentResult<AdminVocabularyWord>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const orderIndex =
    input.orderIndex ??
    (await nextOrderIndex("vocabulary_words", input.lessonId));

  try {
    const { error } = await supabase.from("vocabulary_words").insert({
      lesson_id: input.lessonId,
      chinese: input.chinese.trim(),
      pinyin: input.pinyin?.trim() || null,
      mongolian: input.mongolian.trim(),
      hsk_level: input.hskLevel?.trim() || null,
      example_chinese: input.exampleChinese?.trim() || null,
      example_mongolian: input.exampleMongolian?.trim() || null,
      order_index: orderIndex,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(input.lessonId);

    const list = await getVocabularyWordsByLessonId(input.lessonId);
    const created = list.data?.find((row) => row.order_index === orderIndex);
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.vocabularyCreated,
      entityType: "vocabulary",
      entityId: created ? String(created.id) : undefined,
      lessonId: input.lessonId,
      title: `Vocabulary added to lesson ${input.lessonId}`,
      metadata: { chinese: input.chinese.trim() },
    });
    return { data: created ?? null, error: null };
  } catch {
    return { data: null, error: "Vocabulary нэмэхэд алдаа гарлаа." };
  }
}

export async function deleteVocabularyWord(
  id: number,
  lessonId: string
): Promise<AdminContentResult<null>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { error } = await supabase
      .from("vocabulary_words")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(lessonId);
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.vocabularyDeleted,
      entityType: "vocabulary",
      entityId: String(id),
      lessonId,
      title: `Vocabulary ${id} deleted from lesson ${lessonId}`,
    });
    return { data: null, error: null };
  } catch {
    return { data: null, error: "Vocabulary устгахад алдаа гарлаа." };
  }
}

// --- Quiz ---

export async function getQuizQuestionsByLessonId(
  lessonId: string
): Promise<AdminContentResult<AdminQuizQuestion[]>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select(
        "id, lesson_id, type, question, options, correct_answer, explanation, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    const rows = (data ?? []).map((row) => ({
      ...(row as Omit<AdminQuizQuestion, "options">),
      options: parseOptions((row as { options: unknown }).options),
    }));

    return { data: rows, error: null };
  } catch {
    return { data: null, error: "Quiz уншихад алдаа гарлаа." };
  }
}

export async function createQuizQuestion(
  input: CreateQuizQuestionInput
): Promise<AdminContentResult<AdminQuizQuestion>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const orderIndex =
    input.orderIndex ??
    (await nextOrderIndex("quiz_questions", input.lessonId));

  try {
    const { error } = await supabase.from("quiz_questions").insert({
      lesson_id: input.lessonId,
      type: input.type,
      question: input.question.trim(),
      options: input.options,
      correct_answer: input.correctAnswer.trim(),
      explanation: input.explanation?.trim() || null,
      order_index: orderIndex,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(input.lessonId);

    const list = await getQuizQuestionsByLessonId(input.lessonId);
    const created = list.data?.find((row) => row.order_index === orderIndex);
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.quizCreated,
      entityType: "quiz",
      entityId: created ? String(created.id) : undefined,
      lessonId: input.lessonId,
      title: `Quiz question added to lesson ${input.lessonId}`,
    });
    return { data: created ?? null, error: null };
  } catch {
    return { data: null, error: "Quiz нэмэхэд алдаа гарлаа." };
  }
}

export async function deleteQuizQuestion(
  id: number,
  lessonId: string
): Promise<AdminContentResult<null>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(lessonId);
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.quizDeleted,
      entityType: "quiz",
      entityId: String(id),
      lessonId,
      title: `Quiz question ${id} deleted from lesson ${lessonId}`,
    });
    return { data: null, error: null };
  } catch {
    return { data: null, error: "Quiz устгахад алдаа гарлаа." };
  }
}
