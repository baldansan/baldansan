import type { AdminContentStatus } from "@/lib/admin/lesson-status";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type AdminContentResult<T> = {
  data: T | null;
  error: string | null;
};

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
};

export type UpdateLessonMetadataInput = {
  title?: string;
  chineseTitle?: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  status?: AdminContentStatus;
  orderIndex?: number;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

const RLS_HINT =
  "Admin write policy may not be enabled. Run/review admin content policies.";

function notConfigured<T>(): AdminContentResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
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
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Хичээл үүсгэхэд алдаа гарлаа." };
  }
}

/** For a future edit-save step; not wired in UI yet. */
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

  const patch: Record<string, string | number> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.chineseTitle !== undefined) {
    patch.chinese_title = input.chineseTitle.trim();
  }
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle.trim() || "";
  if (input.description !== undefined) {
    patch.description = input.description.trim() || "";
  }
  if (input.duration !== undefined) patch.duration = input.duration.trim() || "";
  if (input.status !== undefined) patch.status = input.status;
  if (input.orderIndex !== undefined) patch.order_index = input.orderIndex;

  if (Object.keys(patch).length === 0) {
    return { data: { id: lessonId }, error: null };
  }

  try {
    const { error } = await supabase
      .from("lessons")
      .update(patch)
      .eq("id", lessonId);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Хичээл шинэчлэхэд алдаа гарлаа." };
  }
}
