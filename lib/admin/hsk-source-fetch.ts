import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { HskSourceLesson } from "@/types/hsk-source-lesson";

export type HskSourceLessonRow = {
  id: string;
  level: string;
  book: string;
  lesson: number;
  title_zh: string;
  title_pinyin: string | null;
  title_en: string | null;
  status: string;
  updated_at: string;
};

/** Жагсаалт — payload-гүй (хөнгөн). */
export async function fetchHskSourceLessonList(): Promise<HskSourceLessonRow[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hsk_source_lessons")
    .select("id, level, book, lesson, title_zh, title_pinyin, title_en, status, updated_at")
    .order("level")
    .order("lesson");
  if (error || !data) return [];
  return data as HskSourceLessonRow[];
}

export async function fetchHskSourceLesson(
  id: string
): Promise<{ row: HskSourceLessonRow; payload: HskSourceLesson } | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("hsk_source_lessons")
    .select("id, level, book, lesson, title_zh, title_pinyin, title_en, status, updated_at, payload")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const { payload, ...row } = data as HskSourceLessonRow & { payload: HskSourceLesson };
  return { row, payload };
}
