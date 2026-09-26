import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-server";
import type { HskSourceLesson } from "@/types/hsk-source-lesson";
import type { HskSourceLessonRow } from "@/lib/admin/hsk-source-fetch";

const LIST_COLS = "id, level, book, lesson, title_zh, title_pinyin, title_en, status, updated_at";

/**
 * Суралцагчийн /books хэсэгт эх сурвалжийг уншина.
 * service role байвал түүгээр (RLS-ээс хамаарахгүй), үгүй бол ердийн клиент
 * (063 public-read policy шаардлагатай).
 */
async function client() {
  return createServiceRoleSupabaseClient() ?? (await createServerSupabaseClient());
}

export async function fetchPublicSourceLessonsByLevel(level: string): Promise<HskSourceLessonRow[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hsk_source_lessons")
    .select(LIST_COLS)
    .eq("level", level)
    .order("lesson");
  if (error || !data) return [];
  return data as HskSourceLessonRow[];
}

export async function fetchPublicSourceLessonCounts(): Promise<Record<string, number>> {
  const supabase = await client();
  if (!supabase) return {};
  const { data, error } = await supabase.from("hsk_source_lessons").select("level");
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const r of data as { level: string }[]) counts[r.level] = (counts[r.level] ?? 0) + 1;
  return counts;
}

export async function fetchPublicSourceLesson(
  id: string
): Promise<{ row: HskSourceLessonRow; payload: HskSourceLesson } | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("hsk_source_lessons")
    .select(`${LIST_COLS}, payload`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const { payload, ...row } = data as HskSourceLessonRow & { payload: HskSourceLesson };
  return { row, payload };
}
