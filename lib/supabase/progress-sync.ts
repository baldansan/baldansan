import { getLessonById } from "@/lib/content";
import {
  clearLocalProgressAfterSync,
  getAllLearnedWords,
  getAllQuizResults,
  getAllLessonProgress,
  hasAnyProgress,
  vocabularyWordKey,
  type LessonStatus,
} from "@/lib/progress";
import {
  getUserLessonProgress,
  markSupabaseLessonCompleted,
  markSupabaseLessonStarted,
  normalizeLessonStatus,
} from "@/lib/supabase/progress";
import { saveSupabaseQuizAttempt } from "@/lib/supabase/quiz-attempts";
import {
  getUserVocabularyProgress,
  isLearnedVocabularyStatus,
  lookupVocabularyWordDbId,
  markSupabaseWordLearned,
} from "@/lib/supabase/vocabulary-progress";
import { getVocabularyDbIdMapForLesson } from "@/lib/supabase/content";

const SYNC_DISMISS_KEY = "buunduu-surtsgaay-progress-sync-dismissed";

export type LocalProgressSummary = {
  completedLessons: number;
  startedLessons: number;
  learnedWords: number;
  quizResults: number;
};

export type ProgressSyncCounts = {
  lessons: number;
  vocabulary: number;
  quizzes: number;
};

export type ProgressSyncResult = {
  ok: boolean;
  error: string | null;
  synced: ProgressSyncCounts;
  skipped: { vocabulary: number };
};

function lessonStatusRank(status: LessonStatus): number {
  switch (status) {
    case "completed":
      return 2;
    case "started":
      return 1;
    default:
      return 0;
  }
}

function mergeLessonStatus(
  local: LessonStatus,
  remote: LessonStatus
): LessonStatus {
  return lessonStatusRank(local) >= lessonStatusRank(remote) ? local : remote;
}

export function dismissProgressSyncOffer(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(SYNC_DISMISS_KEY, "1");
}

export function resetProgressSyncDismiss(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(SYNC_DISMISS_KEY);
}

export function hasLocalProgressToSync(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (sessionStorage.getItem(SYNC_DISMISS_KEY) === "1") {
    return false;
  }
  return hasAnyProgress();
}

export function getLocalProgressSummary(): LocalProgressSummary {
  const lessons = getAllLessonProgress();
  let completedLessons = 0;
  let startedLessons = 0;

  for (const lesson of Object.values(lessons)) {
    if (lesson.status === "completed") {
      completedLessons += 1;
    } else if (lesson.status === "started") {
      startedLessons += 1;
    }
  }

  return {
    completedLessons,
    startedLessons,
    learnedWords: getAllLearnedWords().length,
    quizResults: getAllQuizResults().length,
  };
}

export { clearLocalProgressAfterSync };

async function resolveVocabularyWordDbIdForSync(
  lessonId: string,
  wordKey: string,
  chineseByKey: Map<string, string>
): Promise<number | null> {
  const chinese = chineseByKey.get(wordKey) ?? wordKey;
  const fromChinese = await lookupVocabularyWordDbId(lessonId, chinese);
  if (fromChinese != null) {
    return fromChinese;
  }

  const dbMap = await getVocabularyDbIdMapForLesson(lessonId);
  if (dbMap.has(wordKey)) {
    return dbMap.get(wordKey) ?? null;
  }
  if (dbMap.has(chinese)) {
    return dbMap.get(chinese) ?? null;
  }

  return lookupVocabularyWordDbId(lessonId, chinese);
}

async function buildChineseByWordKey(
  lessonId: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    return map;
  }

  for (const word of lesson.vocabulary) {
    const key = vocabularyWordKey(word);
    map.set(key, word.chinese);
    map.set(word.chinese, word.chinese);
    if (word.id) {
      map.set(word.id, word.chinese);
    }
  }

  return map;
}

export async function syncLocalProgressToSupabase(
  userId: string
): Promise<ProgressSyncResult> {
  const synced: ProgressSyncCounts = { lessons: 0, vocabulary: 0, quizzes: 0 };
  const skipped = { vocabulary: 0 };

  if (!hasAnyProgress()) {
    return { ok: true, error: null, synced, skipped };
  }

  const lessons = getAllLessonProgress();
  const remoteLessons = await getUserLessonProgress(userId);
  if (remoteLessons.error) {
    return { ok: false, error: remoteLessons.error, synced, skipped };
  }

  const remoteLessonStatus = new Map<string, LessonStatus>();
  for (const row of remoteLessons.data ?? []) {
    remoteLessonStatus.set(
      row.lesson_id,
      normalizeLessonStatus(row.status)
    );
  }

  for (const [lessonId, local] of Object.entries(lessons)) {
    if (local.status === "not_started") {
      continue;
    }

    const remote = remoteLessonStatus.get(lessonId) ?? "not_started";
    const merged = mergeLessonStatus(local.status, remote);

    if (lessonStatusRank(merged) <= lessonStatusRank(remote)) {
      continue;
    }

    if (merged === "completed") {
      const result = await markSupabaseLessonCompleted(userId, lessonId);
      if (result.error) {
        return { ok: false, error: result.error, synced, skipped };
      }
      synced.lessons += 1;
    } else if (merged === "started") {
      const result = await markSupabaseLessonStarted(userId, lessonId);
      if (result.error) {
        return { ok: false, error: result.error, synced, skipped };
      }
      synced.lessons += 1;
    }
  }

  const remoteVocab = await getUserVocabularyProgress(userId);
  if (remoteVocab.error) {
    return { ok: false, error: remoteVocab.error, synced, skipped };
  }

  const learnedDbIds = new Set(
    (remoteVocab.data ?? [])
      .filter((row) => isLearnedVocabularyStatus(row.status))
      .map((row) => row.vocabulary_word_id)
  );

  const learnedEntries = getAllLearnedWords();
  const chineseCache = new Map<string, Map<string, string>>();

  for (const entry of learnedEntries) {
    let chineseMap = chineseCache.get(entry.lessonId);
    if (!chineseMap) {
      chineseMap = await buildChineseByWordKey(entry.lessonId);
      chineseCache.set(entry.lessonId, chineseMap);
    }

    const dbId = await resolveVocabularyWordDbIdForSync(
      entry.lessonId,
      entry.wordKey,
      chineseMap
    );

    if (dbId == null) {
      skipped.vocabulary += 1;
      continue;
    }

    if (learnedDbIds.has(dbId)) {
      continue;
    }

    const result = await markSupabaseWordLearned(userId, dbId);
    if (result.error) {
      return { ok: false, error: result.error, synced, skipped };
    }

    learnedDbIds.add(dbId);
    synced.vocabulary += 1;
  }

  const localQuizzes = getAllQuizResults();
  const { getUserQuizAttempts } = await import("@/lib/supabase/quiz-attempts");
  const remoteQuizzes = await getUserQuizAttempts(userId);
  if (remoteQuizzes.error) {
    return { ok: false, error: remoteQuizzes.error, synced, skipped };
  }

  const remoteBestByLesson = new Map<string, number>();
  for (const row of remoteQuizzes.data ?? []) {
    const current = remoteBestByLesson.get(row.lesson_id) ?? 0;
    remoteBestByLesson.set(
      row.lesson_id,
      Math.max(current, row.percentage)
    );
  }

  for (const { lessonId, result } of localQuizzes) {
    const hasRemoteForLesson = (remoteQuizzes.data ?? []).some(
      (row) => row.lesson_id === lessonId
    );
    const remoteBest = remoteBestByLesson.get(lessonId) ?? 0;

    if (hasRemoteForLesson && result.bestPercentage <= remoteBest) {
      continue;
    }

    const saveResult = await saveSupabaseQuizAttempt(
      userId,
      lessonId,
      result.score,
      result.total,
      result.percentage,
      { source: "local_sync" }
    );

    if (saveResult.error) {
      return { ok: false, error: saveResult.error, synced, skipped };
    }

    synced.quizzes += 1;
    remoteBestByLesson.set(lessonId, result.bestPercentage);
  }

  return { ok: true, error: null, synced, skipped };
}
