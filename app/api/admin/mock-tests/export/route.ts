import { NextResponse } from "next/server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";

export const maxDuration = 60;

const SKILLS = new Set(["listening", "reading", "writing"]);

/**
 * GET /api/admin/mock-tests/export?skill=listening&level=1[&test=H11329][&format=csv]
 * Багшийн тайлбар бичихэд зориулсан асуултын экспорт (JSON, эсвэл format=csv).
 * Мөр: {id, test_id, hsk_level, skill, part, q_no, q_type, stem, options,
 *       correct_answer, audio_transcript, explanation_mn, has_tutor_note}
 */
export async function GET(request: Request) {
  const clientResult = await getAdminServiceRoleSupabaseClient();
  if (!clientResult.ok) {
    return NextResponse.json(
      { ok: false, errors: [clientResult.error] },
      { status: clientResult.status }
    );
  }

  const url = new URL(request.url);
  const skill = url.searchParams.get("skill")?.trim().toLowerCase() || null;
  const levelRaw = url.searchParams.get("level")?.trim() || null;
  const testId = url.searchParams.get("test")?.trim().toUpperCase() || null;
  const format = url.searchParams.get("format")?.trim().toLowerCase() === "csv" ? "csv" : "json";
  const level = levelRaw ? Number(levelRaw) : null;

  if (skill && !SKILLS.has(skill)) {
    return NextResponse.json(
      { ok: false, errors: ["skill нь listening | reading | writing байна."] },
      { status: 400 }
    );
  }
  if (level != null && (!Number.isInteger(level) || level < 1 || level > 6)) {
    return NextResponse.json(
      { ok: false, errors: ["level нь 1–6 байна."] },
      { status: 400 }
    );
  }

  const client = clientResult.client;

  let testQuery = client.from("mock_tests").select("id, hsk_level");
  if (level != null) testQuery = testQuery.eq("hsk_level", level);
  if (testId) testQuery = testQuery.eq("id", testId);
  const { data: tests, error: testErr } = await testQuery;
  if (testErr) {
    return NextResponse.json({ ok: false, errors: [testErr.message] }, { status: 500 });
  }
  const levelByTest = new Map<string, number>();
  for (const row of tests ?? []) levelByTest.set(String(row.id), Number(row.hsk_level));
  const testIds = [...levelByTest.keys()];
  if (testIds.length === 0) {
    return NextResponse.json([]);
  }

  let query = client
    .from("mock_test_questions")
    .select(
      "id, test_id, skill, part, q_no, q_type, stem, options, correct_answer, audio_transcript, explanation_mn, tutor_note"
    )
    .in("test_id", testIds)
    .order("test_id", { ascending: true })
    .order("q_no", { ascending: true });
  if (skill) query = query.eq("skill", skill);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, errors: [error.message] }, { status: 500 });
  }

  const rows = (data ?? []).map((row) => ({
    id: String(row.id),
    test_id: String(row.test_id),
    hsk_level: levelByTest.get(String(row.test_id)) ?? null,
    skill: String(row.skill),
    part: Number(row.part),
    q_no: Number(row.q_no),
    q_type: String(row.q_type),
    stem: row.stem ?? null,
    options: row.options ?? null,
    correct_answer: row.correct_answer ?? null,
    audio_transcript: row.audio_transcript ?? null,
    explanation_mn: row.explanation_mn ?? null,
    has_tutor_note: row.tutor_note != null,
  }));

  const nameParts = [
    "mock-questions",
    level != null ? `hsk${level}` : null,
    skill,
    testId,
  ].filter(Boolean);
  const baseName = nameParts.join("-");

  if (format === "csv") {
    const header = [
      "id",
      "test_id",
      "hsk_level",
      "skill",
      "part",
      "q_no",
      "q_type",
      "stem",
      "options",
      "correct_answer",
      "audio_transcript",
      "explanation_mn",
      "has_tutor_note",
    ];
    const cell = (value: unknown) => {
      const text =
        value == null
          ? ""
          : typeof value === "string"
            ? value
            : JSON.stringify(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(header.map((key) => cell((row as Record<string, unknown>)[key])).join(","));
    }
    return new NextResponse(`﻿${lines.join("\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.json"`,
    },
  });
}
