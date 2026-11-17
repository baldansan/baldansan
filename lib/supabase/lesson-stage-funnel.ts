import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";

/** Хичээлийн замын үеүүд — build-lesson-path.ts-тэй ижил дараалал. */
export const FUNNEL_STAGES = [
  { id: "goal_warmup", label: "Зорилго ба халаалт" },
  { id: "vocabulary", label: "Шинэ үгс" },
  { id: "text", label: "Эх бичвэр" },
  { id: "grammar", label: "Дүрэм" },
  { id: "practice", label: "Дасгал" },
  { id: "quiz", label: "Сорил" },
  { id: "summary", label: "Дүгнэлт" },
] as const;

export type LessonStageFunnel = {
  /** Хичээл нээсэн (user × lesson) мөрийн тоо. */
  opened: number;
  /** Нэг ч үе дуусгаагүй. */
  noStage: number;
  /** Үе бүрийг дуусгасан мөрийн тоо. */
  byStage: { id: string; label: string; count: number }[];
  /** Хичээлийг бүтнээр дуусгасан. */
  completed: number;
  /** Ядаж нэг хичээл нээсэн хүний тоо. */
  learners: number;
  warnings: string[];
};

function parseStages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Хүмүүс хичээлийн аль үе дээр зогсож байгааг харуулна (админ RLS). */
export async function getLessonStageFunnel(): Promise<LessonStageFunnel> {
  const empty: LessonStageFunnel = {
    opened: 0,
    noStage: 0,
    byStage: FUNNEL_STAGES.map((s) => ({ ...s, count: 0 })),
    completed: 0,
    learners: 0,
    warnings: [],
  };
  if (!hasSupabaseConfig) return empty;
  const client = await createServerSupabaseClient();
  if (!client) return empty;

  const rows: Record<string, unknown>[] = [];
  const PAGE = 1000;
  for (let from = 0; from < 20000; from += PAGE) {
    const { data, error } = await client
      .from("user_lesson_progress")
      .select("user_id, status, completed_stages")
      .range(from, from + PAGE - 1);
    if (error) {
      empty.warnings.push("Хичээлийн ахицыг уншиж чадсангүй.");
      return empty;
    }
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }

  const counts = new Map<string, number>();
  const learners = new Set<string>();
  let noStage = 0;
  let completed = 0;
  for (const row of rows) {
    if (row.user_id) learners.add(String(row.user_id));
    const stages = parseStages(row.completed_stages);
    const done = String(row.status) === "completed";
    if (done) completed += 1;
    if (stages.length === 0 && !done) noStage += 1;
    for (const id of new Set(stages)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return {
    opened: rows.length,
    noStage,
    byStage: FUNNEL_STAGES.map((s) => ({ ...s, count: counts.get(s.id) ?? 0 })),
    completed,
    learners: learners.size,
    warnings: [],
  };
}
