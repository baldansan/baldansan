/**
 * «Миний дүн» — зөвхөн ангид бүртгэлтэй (classroom_students мөр бүхий) сурагчид.
 * Жирийн хэрэглэгчид энэ хэсэг огт харагдахгүй.
 */

import { fetchLessonTitles } from "@/lib/teacher/class-insights";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type MyClassroom = { id: string; name: string | null };

let membershipCache: { userId: string; at: number; value: MyClassroom[] } | null = null;
const MEMBERSHIP_TTL_MS = 5 * 60_000;

/** Миний ангиуд. Хоосон массив = ангид бүртгэлгүй (жирийн хэрэглэгч). */
export async function getMyClassrooms(): Promise<MyClassroom[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return [];
  if (
    membershipCache &&
    membershipCache.userId === userId &&
    Date.now() - membershipCache.at < MEMBERSHIP_TTL_MS
  ) {
    return membershipCache.value;
  }
  const { data, error } = await supabase
    .from("classroom_students")
    .select("classroom_id, classrooms(name)")
    .eq("student_user_id", userId);
  if (error) return [];
  const seen = new Set<string>();
  const value: MyClassroom[] = [];
  for (const row of (data ?? []) as unknown as {
    classroom_id: string;
    classrooms: { name: string | null } | { name: string | null }[] | null;
  }[]) {
    if (seen.has(row.classroom_id)) continue;
    seen.add(row.classroom_id);
    const c = Array.isArray(row.classrooms) ? row.classrooms[0] : row.classrooms;
    value.push({ id: row.classroom_id, name: c?.name ?? null });
  }
  membershipCache = { userId, at: Date.now(), value };
  return value;
}

export async function isClassStudent(): Promise<boolean> {
  return (await getMyClassrooms()).length > 0;
}

export type MyLessonRecord = {
  lessonId: string;
  title: string | null;
  bestScorePct: number;
  attempts: number;
  lastAttemptAt: string | null;
  firstAttemptAt: string | null;
};

type RecordRow = {
  lesson_id: string;
  best_score_pct: number;
  attempts: number;
  last_attempt_at: string | null;
  first_attempt_at: string | null;
};

export async function getMyLessonRecords(): Promise<MyLessonRecord[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("student_lesson_records")
    .select("lesson_id, best_score_pct, attempts, last_attempt_at, first_attempt_at")
    .eq("user_id", userId)
    .order("last_attempt_at", { ascending: false })
    .limit(300);
  if (error) return [];
  const rows = (data ?? []) as RecordRow[];
  const titles = await fetchLessonTitles(rows.map((r) => r.lesson_id));
  return rows.map((r) => ({
    lessonId: r.lesson_id,
    title: titles[r.lesson_id] ?? null,
    bestScorePct: Number(r.best_score_pct),
    attempts: Number(r.attempts),
    lastAttemptAt: r.last_attempt_at,
    firstAttemptAt: r.first_attempt_at,
  }));
}

export type MyLessonBest = { bestScorePct: number; attempts: number };

/** Хичээлийн үр дүнгийн дэлгэц дээр: дээд оноо + оролдлогын тоо (ангийн сурагчид л). */
export async function getMyLessonBest(lessonId: string): Promise<MyLessonBest | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  if (!(await isClassStudent())) return null;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("student_lesson_records")
    .select("best_score_pct, attempts")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error || !data) return null;
  return { bestScorePct: Number(data.best_score_pct), attempts: Number(data.attempts) };
}
