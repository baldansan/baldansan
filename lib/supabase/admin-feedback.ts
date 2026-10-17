import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminFeedbackRow = {
  id: string;
  userId: string | null;
  lessonId: string | null;
  stage: string;
  questionId: string | null;
  rating: string | null;
  note: string | null;
  pagePath: string | null;
  screenshotUrl: string | null;
  userAgent: string | null;
  viewport: string | null;
  createdAt: string;
};

const WITH_SHOT =
  "id, user_id, lesson_id, stage, question_id, rating, note, page_path, screenshot_url, user_agent, viewport, created_at";
const LEGACY = "id, user_id, lesson_id, stage, question_id, rating, note, page_path, created_at";

/** Note дотор хадгалагдсан (077 migration-оос өмнөх) 📷 URL-ийг салгана. */
function splitLegacyNote(note: string | null): { note: string | null; shot: string | null } {
  if (!note) return { note, shot: null };
  const m = /📷 (https?:\/\/\S+)/.exec(note);
  if (!m) return { note, shot: null };
  return { note: note.replace(/\n*📷 https?:\/\/\S+/, "").trim() || null, shot: m[1] };
}

/** Бүх санал/алдааны мэдээлэл — сүүлийнх нь эхэнд (admin RLS select). */
export async function getAdminFeedback(options: {
  stage?: string | null;
  limit?: number;
} = {}): Promise<{ rows: AdminFeedbackRow[]; warnings: string[] }> {
  const warnings: string[] = [];
  const client = await createServerSupabaseClient();
  if (!client) return { rows: [], warnings: ["Supabase тохиргоо байхгүй."] };
  const limit = options.limit ?? 200;

  const run = (select: string) => {
    let q = client.from("feedback").select(select).order("created_at", { ascending: false }).limit(limit);
    if (options.stage) q = q.eq("stage", options.stage);
    return q;
  };

  let { data, error } = await run(WITH_SHOT);
  let legacy = false;
  if (error && /column|schema cache/i.test(error.message)) {
    legacy = true;
    ({ data, error } = await run(LEGACY));
  }
  if (error) {
    warnings.push(error.message);
    return { rows: [], warnings };
  }
  if (legacy) warnings.push("077_feedback_screenshot.sql migration хараахан ажиллаагүй — зургийн URL note дотроос уншиж байна.");

  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => {
    const rawNote = r.note ? String(r.note) : null;
    const direct = r.screenshot_url ? String(r.screenshot_url) : null;
    const { note, shot } = direct ? { note: rawNote, shot: direct } : splitLegacyNote(rawNote);
    return {
      id: String(r.id),
      userId: r.user_id ? String(r.user_id) : null,
      lessonId: r.lesson_id ? String(r.lesson_id) : null,
      stage: String(r.stage),
      questionId: r.question_id ? String(r.question_id) : null,
      rating: r.rating ? String(r.rating) : null,
      note,
      pagePath: r.page_path ? String(r.page_path) : null,
      screenshotUrl: shot,
      userAgent: r.user_agent ? String(r.user_agent) : null,
      viewport: r.viewport ? String(r.viewport) : null,
      createdAt: String(r.created_at),
    };
  });
  return { rows, warnings };
}
