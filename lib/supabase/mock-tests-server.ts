import {
  collectTargetLessonIds,
  type LessonTitleRow,
  weakLessonsFromResponses,
  type WeakLessonRecommendation,
} from "@/lib/mock-test/weak-lessons";
import { scoreResultFromSavedResponses } from "@/lib/mock-test/scoring";
import type {
  MockTestQuestionRow,
  MockTestRow,
  MockTestScoreResult,
  MockTestSection,
} from "@/lib/mock-test/types";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";

function mapSections(raw: unknown): MockTestSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const sec = s as Record<string, unknown>;
    return {
      skill: String(sec.skill ?? ""),
      audio_url: sec.audio_url ? String(sec.audio_url) : null,
      parts: Array.isArray(sec.parts)
        ? sec.parts.map((p) => {
            const part = p as Record<string, unknown>;
            return {
              part: Number(part.part),
              q_type: String(part.q_type ?? ""),
              range: part.range as [number, number],
              desc: part.desc ? String(part.desc) : undefined,
            };
          })
        : undefined,
    };
  });
}

function mapTest(raw: Record<string, unknown>): MockTestRow {
  return {
    id: String(raw.id),
    hsk_level: Number(raw.hsk_level),
    title: String(raw.title),
    total_questions: Number(raw.total_questions),
    time_limit_min: Number(raw.time_limit_min),
    has_writing: Boolean(raw.has_writing),
    sections: mapSections(raw.sections),
    created_at: String(raw.created_at),
  };
}

function mapQuestion(raw: Record<string, unknown>): MockTestQuestionRow {
  let options = null;
  if (raw.options != null && Array.isArray(raw.options)) {
    options = raw.options.map((o) => {
      const opt = o as Record<string, unknown>;
      return {
        key: String(opt.key ?? ""),
        text: opt.text != null ? String(opt.text) : undefined,
        image_url: opt.image_url ? String(opt.image_url) : null,
      };
    });
  }

  return {
    id: String(raw.id),
    test_id: String(raw.test_id),
    skill: String(raw.skill),
    part: Number(raw.part),
    q_no: Number(raw.q_no),
    q_type: String(raw.q_type),
    stem: raw.stem ? String(raw.stem) : null,
    options,
    correct_answer: raw.correct_answer ? String(raw.correct_answer) : null,
    autograde: String(raw.autograde ?? "auto"),
    points: Number(raw.points ?? 1),
    audio_url: raw.audio_url ? String(raw.audio_url) : null,
    image_url: raw.image_url ? String(raw.image_url) : null,
    needs_image: Boolean(raw.needs_image),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    target_lesson_id: raw.target_lesson_id ? String(raw.target_lesson_id) : null,
    explanation_mn: raw.explanation_mn ? String(raw.explanation_mn) : null,
  };
}

export async function fetchMockTests(
  hskLevel?: number
): Promise<MockTestRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  let query = client
    .from("mock_tests")
    .select("*")
    .order("hsk_level", { ascending: true })
    .order("id", { ascending: true });

  if (hskLevel != null) {
    query = query.eq("hsk_level", hskLevel);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => mapTest(row as Record<string, unknown>));
}

export async function fetchMockTestById(
  testId: string
): Promise<MockTestRow | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("mock_tests")
    .select("*")
    .eq("id", testId.toUpperCase())
    .maybeSingle();

  if (error || !data) return null;
  return mapTest(data as Record<string, unknown>);
}

export async function fetchMockTestQuestions(
  testId: string
): Promise<MockTestQuestionRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("mock_test_questions")
    .select("*")
    .eq("test_id", testId.toUpperCase())
    .order("q_no", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapQuestion(row as Record<string, unknown>));
}

export type MockTestLatestScore = {
  attemptId: string;
  rawScore: number;
  maxScore: number;
};

export async function fetchAvailableLessonsByIds(
  lessonIds: string[]
): Promise<LessonTitleRow[]> {
  if (!hasServerSupabaseConfig || lessonIds.length === 0) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("lessons")
    .select("id, title")
    .in("id", lessonIds)
    .eq("status", "available");

  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    title: String(row.title),
  }));
}

export async function fetchLatestMockTestScores(
  testIds: string[]
): Promise<Record<string, MockTestLatestScore>> {
  if (!hasServerSupabaseConfig || testIds.length === 0) return {};
  const client = await createServerSupabaseClient();
  if (!client) return {};

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return {};

  const { data, error } = await client
    .from("user_test_attempts")
    .select("id, test_id, raw_score, max_score, finished_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .in("test_id", testIds)
    .order("finished_at", { ascending: false });

  if (error || !data) return {};

  const byTest: Record<string, MockTestLatestScore> = {};
  for (const row of data) {
    const testId = row.test_id ? String(row.test_id) : "";
    if (!testId || byTest[testId]) continue;
    byTest[testId] = {
      attemptId: String(row.id),
      rawScore: Number(row.raw_score ?? 0),
      maxScore: Number(row.max_score ?? 0),
    };
  }
  return byTest;
}

export async function loadMockTestListPageData(): Promise<{
  tests: MockTestRow[];
  latestScores: Record<string, MockTestLatestScore>;
}> {
  const tests = await fetchMockTests();
  const latestScores = await fetchLatestMockTestScores(tests.map((test) => test.id));
  return { tests, latestScores };
}

export type MockTestAttemptReview = {
  test: MockTestRow;
  questions: MockTestQuestionRow[];
  result: MockTestScoreResult;
  weakLessons: WeakLessonRecommendation[];
  finishedAt: string | null;
};

export async function fetchMockTestAttemptReview(
  attemptId: string
): Promise<MockTestAttemptReview | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const { data: attempt, error: attemptErr } = await client
    .from("user_test_attempts")
    .select("id, test_id, finished_at, status")
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptErr || !attempt?.test_id || attempt.status !== "completed") {
    return null;
  }

  const testId = String(attempt.test_id);
  const [test, questions, responsesResult] = await Promise.all([
    fetchMockTestById(testId),
    fetchMockTestQuestions(testId),
    client
      .from("user_question_responses")
      .select("question_id, user_answer, is_correct")
      .eq("attempt_id", attemptId),
  ]);

  if (!test || !questions.length || responsesResult.error) {
    return null;
  }

  const responses = responsesResult.data ?? [];
  const lessonIds = collectTargetLessonIds(questions);
  const lessons = await fetchAvailableLessonsByIds(lessonIds);
  const result = scoreResultFromSavedResponses(questions, responses);
  const weakLessons = weakLessonsFromResponses(responses, questions, lessons);

  return {
    test,
    questions,
    result,
    weakLessons,
    finishedAt: attempt.finished_at ? String(attempt.finished_at) : null,
  };
}
