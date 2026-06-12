import {
  ADMIN_ACTIVITY_ACTIONS,
  logAdminActivityFireAndForget,
} from "@/lib/supabase/admin-activity";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  applyTeacherOverlayToSourceNote,
  extractTeacherOverlayFromSourceNote,
  type TeacherOverlayAdminState,
} from "@/lib/lesson/teacher-overlay-admin";
import type { AdminContentResult } from "@/lib/supabase/admin-content";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type { TeacherOverlayAdminState };

function notConfigured<T>(): AdminContentResult<T> {
  return { data: null, error: "Supabase тохируулагдаагүй." };
}

async function requireAdmin(): Promise<AdminContentResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

async function fetchLessonSourceNote(
  lessonId: string
): Promise<AdminContentResult<{ sourceNote: string | null }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const { data, error } = await supabase
    .from("lessons")
    .select("source_note")
    .eq("id", lessonId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Хичээл олдсонгүй." };

  return {
    data: { sourceNote: (data.source_note as string | null) ?? null },
    error: null,
  };
}

export async function loadLessonTeacherOverlay(
  lessonId: string
): Promise<AdminContentResult<TeacherOverlayAdminState>> {
  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const row = await fetchLessonSourceNote(lessonId);
  if (!row.data) return { data: null, error: row.error };

  return {
    data: extractTeacherOverlayFromSourceNote(row.data.sourceNote),
    error: null,
  };
}

export async function saveLessonTeacherOverlay(
  lessonId: string,
  state: TeacherOverlayAdminState
): Promise<AdminContentResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const row = await fetchLessonSourceNote(lessonId);
  if (!row.data) return { data: null, error: row.error };

  const applied = applyTeacherOverlayToSourceNote(row.data.sourceNote, state);
  if (applied.error || !applied.sourceNote) {
    return { data: null, error: applied.error ?? "Хадгалахад алдаа гарлаа." };
  }

  const { error } = await supabase
    .from("lessons")
    .update({ source_note: applied.sourceNote })
    .eq("id", lessonId);

  if (error) return { data: null, error: error.message };

  logAdminActivityFireAndForget({
    action: ADMIN_ACTIVITY_ACTIONS.lessonMetadataUpdated,
    entityType: "lesson",
    entityId: lessonId,
    lessonId,
    title: `Lesson ${lessonId} teacher overlay`,
    metadata: {
      teacherOverlay: true,
      grammarItemCount: state.grammarItems.length,
      sentenceCount: state.sentences.length,
    },
  });

  return { data: { id: lessonId }, error: null };
}
