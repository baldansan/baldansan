/**
 * «Гүнзгий заах» нэмэлт агуулгыг унших (сервер тал).
 *
 * Мөр байхгүй, эсвэл хүснэгт хараахан үүсээгүй бол null буцаана — хичээл
 * урьдын адил ажиллана. Энэ нь нэмэлт агуулга тул алдаа гарвал хичээлийг
 * унагаах ёсгүй.
 */

import type { LessonDeepTeaching } from "@/types/lesson-deep-teaching";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";

function asArray<T>(value: unknown): T[] | undefined {
  return Array.isArray(value) ? (value as T[]) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Өгөгдлийн сангийн JSON-г төрөлд оруулна — таарахгүй хэсгийг ЧИМЭЭГҮЙ хаяна. */
export function parseDeepTeachingPayload(
  lessonId: string,
  version: unknown,
  payload: unknown
): LessonDeepTeaching | null {
  if (!isRecord(payload)) return null;

  const parsed: LessonDeepTeaching = {
    lesson_id: lessonId,
    version: Number(version) || 1,
    words: asArray(payload.words),
    grammar: asArray(payload.grammar),
    hanzi: asArray(payload.hanzi),
    pronunciation: isRecord(payload.pronunciation)
      ? (payload.pronunciation as LessonDeepTeaching["pronunciation"])
      : undefined,
  };

  const hasAnything =
    (parsed.words?.length ?? 0) > 0 ||
    (parsed.grammar?.length ?? 0) > 0 ||
    (parsed.hanzi?.length ?? 0) > 0 ||
    Boolean(parsed.pronunciation);

  return hasAnything ? parsed : null;
}

export async function fetchLessonDeepTeaching(
  lessonId: string
): Promise<LessonDeepTeaching | null> {
  if (!hasServerSupabaseConfig) return null;

  try {
    const client = await createServerSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("lesson_deep_teaching")
      .select("lesson_id, version, payload")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    // Хүснэгт хараахан үүсээгүй байж болно (migration ажиллаагүй) — чимээгүй
    // өнгөрнө, хичээл нь ажиллах ёстой.
    if (error || !data) return null;

    return parseDeepTeachingPayload(
      String(data.lesson_id),
      data.version,
      data.payload
    );
  } catch {
    return null;
  }
}
