import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoId } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildSnapshot,
  addDays,
  todayUB,
  topMissedKeys,
  type DashboardRaw,
  type Row,
} from "@/lib/organization/dashboard-snapshot";
import type { OrganizationDashboard } from "@/lib/organization/dashboard-types";

const PAGE = 1000;
const CHUNK = 100;

const str = (v: unknown): string | null => (v == null || String(v).trim() === "" ? null : String(v));
const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

type Opts = { gte?: [string, string]; eq?: [string, string]; maxPages?: number };

/** `col in (ids)` read in chunks (parallel) and pages (sequential). Never throws. */
async function byIds(
  client: SupabaseClient,
  table: string,
  cols: string,
  col: string,
  ids: string[],
  warnings: string[],
  opts: Opts = {}
): Promise<Row[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
  const maxPages = opts.maxPages ?? 10;
  const parts = await Promise.all(
    chunks.map(async (chunk) => {
      const rows: Row[] = [];
      for (let p = 0; p < maxPages; p += 1) {
        try {
          let q = client.from(table).select(cols).in(col, chunk);
          if (opts.gte) q = q.gte(opts.gte[0], opts.gte[1]);
          if (opts.eq) q = q.eq(opts.eq[0], opts.eq[1]);
          const { data, error } = await q.range(p * PAGE, p * PAGE + PAGE - 1);
          if (error) {
            warnings.push(`${table}: ${error.message}`);
            return rows;
          }
          const batch = (data ?? []) as unknown as Row[];
          rows.push(...batch);
          if (batch.length < PAGE) break;
        } catch (e) {
          warnings.push(`${table}: ${e instanceof Error ? e.message : "алдаа"}`);
          return rows;
        }
      }
      return rows;
    })
  );
  return parts.flat();
}

function emptyRaw(): DashboardRaw {
  return {
    today: todayUB(),
    classrooms: [], students: [], teacherNames: new Map(), assignments: [], results: [],
    attendance: [], exams: [], testLevels: new Map(), testAttempts: [], quizAttempts: [],
    sessions: [], daily: [], lessons: [], qAttempts: [], qTexts: new Map(),
    points: null, classPoints: null, ranking: null,
  };
}

/**
 * ONE call for the whole director dashboard. Queries run in parallel and the
 * function never throws: every section degrades to an empty state.
 */
export async function loadOrganizationDashboard(orgId: string): Promise<OrganizationDashboard> {
  const warnings: string[] = [];
  const raw = emptyRaw();
  let organizationName: string | null = null;
  let pointsAvailable = false;

  try {
    const client = await createServerSupabaseClient();
    if (!client) {
      warnings.push("Supabase тохиргоо алга.");
    } else {
      const today = raw.today;
      const since56 = addDays(today, -55);
      const since30 = `${addDays(today, -29)}T00:00:00Z`;
      const since90 = addDays(today, -89);

      // Stage 1 — organization, classes, members, points RPCs.
      const [orgRes, classRes, memberRes, classPtsRes, rankRes] = await Promise.all([
        client.from("organizations").select("name").eq("id", orgId).maybeSingle(),
        client.from("classrooms").select("id, name, teacher_user_id, organization_id").eq("organization_id", orgId).limit(500),
        client.from("organization_members").select("user_id, display_name, email").eq("organization_id", orgId).limit(2000),
        Promise.resolve(client.rpc("class_points_summary", { p_org_id: orgId, p_period: "all" })).catch(() => ({ data: null, error: { message: "rpc" } })),
        Promise.resolve(client.rpc("rank_organization", { p_org_id: orgId, p_period: "all" })).catch(() => ({ data: null, error: { message: "rpc" } })),
      ]);
      organizationName = str(orgRes.data?.name);
      if (classRes.error) warnings.push(`classrooms: ${classRes.error.message}`);
      raw.classrooms = (classRes.data ?? []) as Row[];
      for (const m of (memberRes.data ?? []) as Row[]) {
        const u = str(m.user_id);
        const label = str(m.display_name) ?? str(m.email);
        if (u && label) raw.teacherNames.set(u, label);
      }
      if (!classPtsRes.error && Array.isArray(classPtsRes.data)) {
        raw.classPoints = new Map(
          (classPtsRes.data as Row[]).map((r) => [String(r.classroom_id), { total: num(r.total_points), avg: num(r.avg_points) }])
        );
      }
      if (!rankRes.error && Array.isArray(rankRes.data)) {
        raw.ranking = (rankRes.data as Row[])
          .map((r) => ({
            userId: String(r.user_id),
            name: str(r.display_name) ?? "Сурагч",
            points: num(r.points),
            rank: num(r.rank),
            isDemo: r.is_demo === true || isDemoId(str(r.user_id)),
          }))
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 60);
      }

      const classIds = raw.classrooms.map((c) => String(c.id));

      // Stage 2 — everything keyed by class.
      const [students, assignments, exams, attendance] = await Promise.all([
        byIds(client, "classroom_students", "id, classroom_id, student_user_id, display_name, status", "classroom_id", classIds, warnings),
        byIds(client, "assignments", "id, classroom_id", "classroom_id", classIds, warnings),
        byIds(client, "classroom_exams", "id, classroom_id, test_id, title, scheduled_for, created_at", "classroom_id", classIds, warnings),
        byIds(client, "classroom_attendance", "classroom_id, student_id, session_date, status", "classroom_id", classIds, warnings, { gte: ["session_date", since90] }),
      ]);
      raw.students = students;
      raw.assignments = assignments;
      raw.exams = exams;
      raw.attendance = attendance;

      const userIds = [...new Set(students.map((s) => str(s.student_user_id)).filter((u): u is string => !!u))];
      const teacherIds = [...new Set(raw.classrooms.map((c) => str(c.teacher_user_id)).filter((u): u is string => !!u))];
      const testIds = [...new Set(exams.map((e) => str(e.test_id)).filter((u): u is string => !!u))];

      // Stage 3 — everything keyed by learner.
      const [results, testAttempts, quizAttempts, sessions, daily, lessons, qAttempts, pointRows, profiles, tests] = await Promise.all([
        byIds(client, "assignment_results", "assignment_id, student_user_id, status", "assignment_id", assignments.map((a) => String(a.id)), warnings),
        byIds(client, "user_test_attempts", "id, user_id, test_id, finished_at, raw_score, max_score, score_metadata", "user_id", userIds, warnings, { maxPages: 4 }),
        byIds(client, "user_quiz_attempts", "user_id, percentage, created_at", "user_id", userIds, warnings, { gte: ["created_at", `${since90}T00:00:00Z`], maxPages: 5 }),
        byIds(client, "user_activity_sessions", "user_id, seconds, day", "user_id", userIds, warnings, { gte: ["day", since56], maxPages: 12 }),
        byIds(client, "user_daily_activity", "user_id, activity_date", "user_id", userIds, warnings, { gte: ["activity_date", since56], maxPages: 6 }),
        byIds(client, "user_lesson_progress", "user_id", "user_id", userIds, warnings, { eq: ["status", "completed"], maxPages: 4 }),
        byIds(client, "question_attempts", "user_id, lesson_id, stage, question_id, question_type, is_correct, selected_answer, correct_answer, created_at", "user_id", userIds, warnings, { gte: ["created_at", since30], maxPages: 8 }),
        (async () => {
          const w: string[] = [];
          const rows = await byIds(client, "user_points_summary", "user_id, total, last_7d, prev_7d", "user_id", userIds, w);
          return { rows, failed: w.length > 0 };
        })(),
        byIds(client, "teacher_profiles", "user_id, display_name", "user_id", teacherIds, warnings),
        byIds(client, "mock_tests", "id, hsk_level", "id", testIds, warnings),
      ]);
      raw.results = results;
      raw.testAttempts = testAttempts;
      raw.quizAttempts = quizAttempts;
      raw.sessions = sessions;
      raw.daily = daily;
      raw.lessons = lessons;
      raw.qAttempts = qAttempts;
      for (const p of profiles) {
        const u = str(p.user_id);
        const name = str(p.display_name);
        if (u && name) raw.teacherNames.set(u, name);
      }
      for (const t of tests) raw.testLevels.set(String(t.id), num(t.hsk_level));

      if (!pointRows.failed) {
        pointsAvailable = true;
        raw.points = new Map(
          pointRows.rows.map((r) => [String(r.user_id), { total: num(r.total), last7: num(r.last_7d), prev7: num(r.prev_7d) }])
        );
      } else if (raw.classPoints || raw.ranking) {
        pointsAvailable = true;
      }

      // Question text for the most-missed questions (best effort).
      const keys = topMissedKeys(qAttempts).filter((k) => /^\d+$/.test(k.questionId));
      if (keys.length) {
        try {
          const { data } = await client.from("quiz_questions").select("id, lesson_id, question").in("id", keys.map((k) => Number(k.questionId)));
          for (const q of (data ?? []) as Row[]) raw.qTexts.set(`${q.lesson_id}:${q.id}`, String(q.question ?? ""));
        } catch {
          /* text is optional */
        }
      }
    }
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : "Дашбоард ачаалахад алдаа гарлаа.");
  }

  const hasDemo = raw.classrooms.some((c) => isDemoId(str(c.id)));
  return {
    organizationName,
    generatedAt: new Date().toISOString(),
    real: buildSnapshot(raw, false),
    all: hasDemo ? buildSnapshot(raw, true) : null,
    demoClassCount: raw.classrooms.filter((c) => isDemoId(str(c.id))).length,
    pointsAvailable,
    warnings,
  };
}
