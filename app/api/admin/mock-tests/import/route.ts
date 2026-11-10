import { NextResponse } from "next/server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";
import {
  validateMockPackage,
  isRelativeAsset,
  type MockPackage,
} from "@/lib/mock-test/import-package";

export const maxDuration = 60;

const BATCH = 50;

function tagCategory(tag: string): string {
  if (tag.startsWith("sk.")) return "skill";
  if (tag.startsWith("gr.")) return "grammar";
  if (tag.startsWith("voc.")) return "vocab";
  if (tag.startsWith("topic.")) return "topic";
  return "other";
}

/**
 * POST /api/admin/mock-tests/import
 * Бие: { package: <TID>.json (asset замууд URL болж солигдсон байх ёстой), mode?: "upsert" | "patch" }
 *  - upsert (default): mock_tests + бүх асуултыг (test_id,q_no)-оор upsert.
 *  - patch: зөвхөн явуулсан асуултуудын явуулсан талбаруудыг update (explanation_mn, tutor_note, audio_* …).
 * Буцаах: { ok, testId, questions, errors, warnings }
 */
export async function POST(request: Request) {
  const clientResult = await getAdminServiceRoleSupabaseClient();
  if (!clientResult.ok) {
    return NextResponse.json({ ok: false, errors: [clientResult.error] }, { status: clientResult.status });
  }
  const supabase = clientResult.client;

  let body: { package?: unknown; mode?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, errors: ["JSON бие буруу."] }, { status: 400 });
  }
  const mode = body.mode === "patch" ? "patch" : "upsert";

  if (mode === "patch") {
    return patchQuestions(supabase, body.package);
  }

  const { pkg, report } = validateMockPackage(body.package);
  if (!pkg) {
    return NextResponse.json({ ok: false, errors: report.errors, warnings: report.warnings }, { status: 422 });
  }
  const unresolved = report.assetRefs.filter((r) => isRelativeAsset(r));
  if (unresolved.length) {
    return NextResponse.json(
      { ok: false, errors: [`Storage-д ороогүй asset: ${unresolved.slice(0, 5).join(", ")}${unresolved.length > 5 ? " …" : ""}`] },
      { status: 422 }
    );
  }

  try {
    await upsertPackage(supabase, pkg);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Импорт амжилтгүй.";
    console.error("[api/admin/mock-tests/import]", message);
    return NextResponse.json({ ok: false, errors: [message] }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    testId: pkg.test_id,
    questions: pkg.questions.length,
    warnings: report.warnings,
    stats: report.stats,
  });
}

type Client = Awaited<ReturnType<typeof getAdminServiceRoleSupabaseClient>> extends infer R
  ? R extends { ok: true; client: infer C }
    ? C
    : never
  : never;

async function upsertPackage(supabase: Client, pkg: MockPackage) {
  const header = {
    id: pkg.test_id,
    hsk_level: pkg.hsk_level,
    title: pkg.title,
    total_questions: pkg.total_questions,
    time_limit_min: pkg.time_limit_min,
    has_writing: pkg.has_writing,
    sections: pkg.sections,
  };
  const { error: tErr } = await supabase.from("mock_tests").upsert(header, { onConflict: "id" });
  if (tErr) throw new Error(`mock_tests: ${tErr.message}`);

  const rows = pkg.questions.map((q) => ({
    test_id: pkg.test_id,
    skill: q.skill,
    part: q.part,
    q_no: q.q_no,
    q_type: q.q_type,
    stem: q.stem ?? null,
    options: q.options ?? null,
    correct_answer: q.correct_answer ?? null,
    autograde: q.autograde ?? "auto",
    points: q.points ?? 1,
    audio_url: q.audio_url ?? null,
    image_url: q.image_url ?? null,
    needs_image: Boolean(q.needs_image),
    tags: q.tags ?? [],
    target_lesson_id: q.target_lesson_id ?? null,
    explanation_mn: q.explanation_mn ?? null,
    audio_start_sec: q.audio_start_sec ?? null,
    audio_end_sec: q.audio_end_sec ?? null,
    audio_transcript: q.audio_transcript ?? null,
    tutor_note: q.tutor_note ?? null,
  }));

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("mock_test_questions")
      .upsert(chunk, { onConflict: "test_id,q_no" });
    if (error) throw new Error(`questions ${i + 1}–${i + chunk.length}: ${error.message}`);
  }

  // Багцад байхгүй болсон хуучин асуултуудыг устгана (тестийг дахин оруулахад).
  const keep = rows.map((r) => r.q_no);
  if (keep.length) {
    const { error: dErr } = await supabase
      .from("mock_test_questions")
      .delete()
      .eq("test_id", pkg.test_id)
      .not("q_no", "in", `(${keep.join(",")})`);
    if (dErr) throw new Error(`cleanup: ${dErr.message}`);
  }

  const tagSet = new Set<string>();
  rows.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
  if (tagSet.size) {
    const tagRows = [...tagSet].map((tag) => ({
      tag,
      category: tagCategory(tag),
      label_mn: tag,
      hsk_level: pkg.hsk_level,
    }));
    const { error: sErr } = await supabase
      .from("skill_tags")
      .upsert(tagRows, { onConflict: "tag", ignoreDuplicates: true });
    if (sErr) throw new Error(`skill_tags: ${sErr.message}`);
  }
}

const PATCHABLE = new Set([
  "explanation_mn",
  "tutor_note",
  "audio_start_sec",
  "audio_end_sec",
  "audio_transcript",
  "audio_url",
  "image_url",
  "stem",
  "options",
  "correct_answer",
]);

async function patchQuestions(supabase: Client, raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ ok: false, errors: ["package объект биш."] }, { status: 400 });
  }
  const pkg = raw as { test_id?: unknown; questions?: unknown; sections?: unknown };
  const testId = typeof pkg.test_id === "string" ? pkg.test_id.trim() : "";
  if (!testId) return NextResponse.json({ ok: false, errors: ["test_id алга."] }, { status: 400 });
  const qs = Array.isArray(pkg.questions) ? pkg.questions : [];
  const errors: string[] = [];
  let updated = 0;

  if (Array.isArray(pkg.sections) && pkg.sections.length) {
    const { error } = await supabase.from("mock_tests").update({ sections: pkg.sections }).eq("id", testId);
    if (error) errors.push(`sections: ${error.message}`);
  }

  for (const q of qs) {
    if (!q || typeof q !== "object") continue;
    const row = q as Record<string, unknown>;
    const qNo = Number(row.q_no);
    if (!Number.isInteger(qNo)) {
      errors.push("q_no буруу мөр алгасав.");
      continue;
    }
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (PATCHABLE.has(k)) patch[k] = v;
    }
    if (!Object.keys(patch).length) continue;
    const { error, count } = await supabase
      .from("mock_test_questions")
      .update(patch, { count: "exact" })
      .eq("test_id", testId)
      .eq("q_no", qNo);
    if (error) errors.push(`q${qNo}: ${error.message}`);
    else if (!count) errors.push(`q${qNo}: мөр олдсонгүй.`);
    else updated += 1;
  }

  return NextResponse.json({ ok: errors.length === 0, testId, updated, errors });
}
