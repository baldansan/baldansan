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

// IMPORTANT: isCurrentUserAdmin() (and the plain `supabase` client used below
// for the actual table reads/writes) relies on the browser Supabase client
// from lib/supabase/client.ts, which carries the signed-in user's session via
// cookies managed by @supabase/ssr's createBrowserClient. That only works
// when this code executes IN THE BROWSER (e.g. called directly from a
// "use client" component), the same way every other admin-write module in
// this codebase is used (admin-content.ts, admin-release.ts, etc.) — never
// from inside a Next.js Route Handler / Server Action, where this client has
// no request cookies attached and always resolves to "not admin". Call
// loadLessonTeacherOverlay/saveLessonTeacherOverlay directly from client
// components; do not wrap them in an API route.
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
