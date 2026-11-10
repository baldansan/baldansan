import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";

/**
 * Хяналтын самбарын «нэг харцаар» тойм — бүх тоо хувиар, курс/түвшин бүрээр.
 * Хүнд lesson-content ачаалахгүй; зөвхөн count/status асуулга.
 */

export type CourseOverviewRow = {
  courseId: string;
  title: string;
  family: "HSK" | "YCT" | "发展汉语" | "Бусад";
  total: number;
  available: number;
  draft: number;
  archived: number;
  /** available / total, 0–100 */
  pct: number;
};

export type MockLevelRow = {
  level: number;
  tests: number;
  questions: number;
  explained: number;
  tutorNotes: number;
  listening: number;
  withAudio: number;
  explainedPct: number;
  tutorPct: number;
  audioPct: number;
};

export type AdminOverview = {
  courses: CourseOverviewRow[];
  coursesTotal: { total: number; available: number; pct: number };
  mock: MockLevelRow[];
  mockTotal: { tests: number; questions: number; explainedPct: number };
  feedback: { open: number; total: number };
  warnings: string[];
};

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function familyOf(courseId: string): CourseOverviewRow["family"] {
  if (courseId.startsWith("hsk")) return "HSK";
  if (courseId.startsWith("yct")) return "YCT";
  if (courseId.startsWith("fazhan")) return "发展汉语";
  return "Бусад";
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const warnings: string[] = [];
  const empty: AdminOverview = {
    courses: [],
    coursesTotal: { total: 0, available: 0, pct: 0 },
    mock: [],
    mockTotal: { tests: 0, questions: 0, explainedPct: 0 },
    feedback: { open: 0, total: 0 },
    warnings,
  };
  if (!hasSupabaseConfig) {
    warnings.push("Supabase тохиргоо байхгүй.");
    return empty;
  }
  const client = await createServerSupabaseClient();
  if (!client) {
    warnings.push("Supabase холболт үүссэнгүй.");
    return empty;
  }

  // ---- Курс бүрийн хичээлийн төлөв
  const [coursesRes, lessonsRes] = await Promise.all([
    client.from("courses").select("id,title,order_index").order("order_index"),
    client.from("lessons").select("course_id,status").limit(5000),
  ]);
  if (coursesRes.error) warnings.push(`courses: ${coursesRes.error.message}`);
  if (lessonsRes.error) warnings.push(`lessons: ${lessonsRes.error.message}`);

  const byCourse = new Map<string, CourseOverviewRow>();
  for (const c of coursesRes.data ?? []) {
    byCourse.set(c.id, {
      courseId: c.id,
      title: c.title ?? c.id,
      family: familyOf(c.id),
      total: 0,
      available: 0,
      draft: 0,
      archived: 0,
      pct: 0,
    });
  }
  for (const l of lessonsRes.data ?? []) {
    const row =
      byCourse.get(l.course_id) ??
      (() => {
        const r: CourseOverviewRow = {
          courseId: l.course_id,
          title: l.course_id,
          family: familyOf(l.course_id),
          total: 0,
          available: 0,
          draft: 0,
          archived: 0,
          pct: 0,
        };
        byCourse.set(l.course_id, r);
        return r;
      })();
    row.total += 1;
    if (l.status === "available") row.available += 1;
    else if (l.status === "archived") row.archived += 1;
    else row.draft += 1;
  }
  const courses = [...byCourse.values()]
    .filter((r) => r.total > 0)
    .map((r) => ({ ...r, pct: pct(r.available, r.total) }));
  const coursesTotal = courses.reduce(
    (acc, r) => ({ total: acc.total + r.total, available: acc.available + r.available, pct: 0 }),
    { total: 0, available: 0, pct: 0 }
  );
  coursesTotal.pct = pct(coursesTotal.available, coursesTotal.total);

  // ---- Загвар шалгалт түвшин бүрээр (зөвхөн count асуулга)
  const testsRes = await client.from("mock_tests").select("id,hsk_level,total_questions");
  if (testsRes.error) warnings.push(`mock_tests: ${testsRes.error.message}`);
  const levels = [1, 2, 3, 4, 5, 6];
  const testIdsByLevel = new Map<number, string[]>();
  for (const t of testsRes.data ?? []) {
    const arr = testIdsByLevel.get(t.hsk_level) ?? [];
    arr.push(t.id);
    testIdsByLevel.set(t.hsk_level, arr);
  }
  type CountQuery = ReturnType<
    ReturnType<typeof client.from>["select"]
  >;
  const count = async (ids: string[], mod?: (q: CountQuery) => CountQuery) => {
    if (ids.length === 0) return 0;
    let q = client
      .from("mock_test_questions")
      .select("test_id", { count: "exact", head: true })
      .in("test_id", ids) as unknown as CountQuery;
    if (mod) q = mod(q);
    const { count: n, error } = await q;
    if (error) {
      warnings.push(`mock_test_questions: ${error.message}`);
      return 0;
    }
    return n ?? 0;
  };
  const mock: MockLevelRow[] = await Promise.all(
    levels.map(async (level) => {
      const ids = testIdsByLevel.get(level) ?? [];
      const [questions, explained, tutorNotes, listening, withAudio] = await Promise.all([
        count(ids),
        count(ids, (q) => q.not("explanation_mn", "is", null)),
        count(ids, (q) => q.not("tutor_note", "is", null)),
        count(ids, (q) => q.eq("skill", "listening")),
        count(ids, (q) => q.eq("skill", "listening").not("audio_url", "is", null)),
      ]);
      return {
        level,
        tests: ids.length,
        questions,
        explained,
        tutorNotes,
        listening,
        withAudio,
        explainedPct: pct(explained, questions),
        tutorPct: pct(tutorNotes, questions),
        audioPct: pct(withAudio, listening),
      };
    })
  );
  const mockTotal = {
    tests: mock.reduce((s, r) => s + r.tests, 0),
    questions: mock.reduce((s, r) => s + r.questions, 0),
    explainedPct: pct(
      mock.reduce((s, r) => s + r.explained, 0),
      mock.reduce((s, r) => s + r.questions, 0)
    ),
  };

  // ---- Алдааны мэдээлэл
  let feedback = { open: 0, total: 0 };
  const fbAll = await client.from("feedback").select("id", { count: "exact", head: true });
  if (!fbAll.error) {
    const fbOpen = await client
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null);
    feedback = { total: fbAll.count ?? 0, open: fbOpen.error ? fbAll.count ?? 0 : fbOpen.count ?? 0 };
  }

  return { courses, coursesTotal, mock, mockTotal, feedback, warnings };
}
