/**
 * Lesson path stage progress — localStorage fallback; Supabase when logged in.
 * Key: `bs:lesson-path:{lessonId}`
 */

import type { LessonPathStageId } from "@/lib/lesson/build-lesson-path";
import {
  parseCompletedStagesJson,
  upsertLessonPathStageProgress,
} from "@/lib/supabase/progress";

const STORAGE_PREFIX = "bs:lesson-path:";

export type LessonPathProgress = {
  completedStageIds: LessonPathStageId[];
  lastStageId: LessonPathStageId | null;
  updatedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function storageKey(lessonId: string): string {
  return `${STORAGE_PREFIX}${lessonId}`;
}

function buildProgress(
  completedStageIds: LessonPathStageId[],
  allStageIds: LessonPathStageId[],
  lastStageId: LessonPathStageId | null = null,
  updatedAt = new Date().toISOString()
): LessonPathProgress {
  const completedSet = new Set(
    allStageIds.filter((id) => completedStageIds.includes(id))
  );
  const orderedCompleted = allStageIds.filter((id) => completedSet.has(id));
  const nextIncomplete =
    lastStageId ??
    allStageIds.find((id) => !completedSet.has(id)) ??
    null;

  return {
    completedStageIds: orderedCompleted,
    lastStageId: nextIncomplete,
    updatedAt,
  };
}

export function loadLessonPathProgress(lessonId: string): LessonPathProgress {
  if (!isBrowser()) {
    return { completedStageIds: [], lastStageId: null, updatedAt: "" };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(lessonId));
    if (!raw) {
      return { completedStageIds: [], lastStageId: null, updatedAt: "" };
    }
    const parsed = JSON.parse(raw) as Partial<LessonPathProgress>;
    return {
      completedStageIds: Array.isArray(parsed.completedStageIds)
        ? parsed.completedStageIds
        : [],
      lastStageId: parsed.lastStageId ?? null,
      updatedAt: parsed.updatedAt ?? "",
    };
  } catch {
    return { completedStageIds: [], lastStageId: null, updatedAt: "" };
  }
}

export function saveLessonPathProgress(
  lessonId: string,
  data: Omit<LessonPathProgress, "updatedAt">,
  updatedAt?: string
): LessonPathProgress {
  const next: LessonPathProgress = {
    ...data,
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
  if (!isBrowser()) return next;
  try {
    window.localStorage.setItem(storageKey(lessonId), JSON.stringify(next));
  } catch {
    // quota
  }
  return next;
}

function remoteProgressFromRow(
  completedStages: unknown,
  allStageIds: LessonPathStageId[],
  updatedAt: string
): LessonPathProgress {
  const completedStageIds = parseCompletedStagesJson(completedStages, allStageIds);
  return buildProgress(completedStageIds, allStageIds, null, updatedAt);
}

export async function hydrateLessonPathProgressSmart(
  lessonId: string,
  allStageIds: LessonPathStageId[]
): Promise<LessonPathProgress> {
  const local = loadLessonPathProgress(lessonId);
  const localCompleted = parseCompletedStagesJson(
    local.completedStageIds,
    allStageIds
  );
  const localNormalized = buildProgress(
    localCompleted,
    allStageIds,
    local.lastStageId,
    local.updatedAt || ""
  );

  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const { data: user } = await getCurrentUser();
  if (!user?.id) {
    return localNormalized;
  }

  const { getUserLessonProgressByLesson } = await import(
    "@/lib/supabase/progress"
  );
  const remoteResult = await getUserLessonProgressByLesson(user.id, lessonId);
  if (remoteResult.error || !remoteResult.data) {
    if (localCompleted.length > 0) {
      await pushLessonPathProgressToSupabase(
        lessonId,
        localCompleted,
        allStageIds
      );
    }
    return localNormalized;
  }

  const remote = remoteProgressFromRow(
    remoteResult.data.completed_stages,
    allStageIds,
    remoteResult.data.updated_at
  );

  const remoteTime = new Date(remote.updatedAt || 0).getTime();
  const localTime = new Date(localNormalized.updatedAt || 0).getTime();
  const remoteAhead =
    remoteTime > localTime ||
    remote.completedStageIds.length > localNormalized.completedStageIds.length;

  if (remoteAhead) {
    saveLessonPathProgress(lessonId, {
      completedStageIds: remote.completedStageIds,
      lastStageId: remote.lastStageId,
    }, remote.updatedAt);
    return remote;
  }

  if (localNormalized.completedStageIds.length > remote.completedStageIds.length) {
    await pushLessonPathProgressToSupabase(
      lessonId,
      localNormalized.completedStageIds,
      allStageIds
    );
  }

  return localNormalized;
}

async function pushLessonPathProgressToSupabase(
  lessonId: string,
  completedStageIds: LessonPathStageId[],
  allStageIds: LessonPathStageId[]
): Promise<void> {
  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const { data: user } = await getCurrentUser();
  if (!user?.id) return;

  const { error } = await upsertLessonPathStageProgress(
    user.id,
    lessonId,
    completedStageIds,
    allStageIds.length
  );
  if (error) {
    console.warn(
      "[lesson-path] Supabase stage progress write failed; local saved.",
      error
    );
  }
}

export function markLessonPathStageCompleted(
  lessonId: string,
  stageId: LessonPathStageId,
  allStageIds: LessonPathStageId[]
): LessonPathProgress {
  const current = loadLessonPathProgress(lessonId);
  const completed = new Set(
    parseCompletedStagesJson(current.completedStageIds, allStageIds)
  );
  completed.add(stageId);
  const next = buildProgress([...completed], allStageIds);
  return saveLessonPathProgress(lessonId, next);
}

export async function markLessonPathStageCompletedSmart(
  lessonId: string,
  stageId: LessonPathStageId,
  allStageIds: LessonPathStageId[]
): Promise<LessonPathProgress> {
  const next = markLessonPathStageCompleted(lessonId, stageId, allStageIds);
  await pushLessonPathProgressToSupabase(
    lessonId,
    next.completedStageIds,
    allStageIds
  );
  return next;
}

export function setLessonPathLastStage(
  lessonId: string,
  stageId: LessonPathStageId | null
): void {
  const current = loadLessonPathProgress(lessonId);
  saveLessonPathProgress(lessonId, {
    completedStageIds: current.completedStageIds,
    lastStageId: stageId,
  });
}

export function getLessonPathStageStatus(
  stageId: LessonPathStageId,
  progress: LessonPathProgress,
  allStageIds: LessonPathStageId[]
): "completed" | "current" | "upcoming" {
  if (progress.completedStageIds.includes(stageId)) return "completed";

  const firstOpen =
    progress.lastStageId ??
    allStageIds.find((id) => !progress.completedStageIds.includes(id)) ??
    allStageIds[0];

  if (stageId === firstOpen) return "current";
  return "upcoming";
}

export function allLessonPathStagesCompleted(
  progress: LessonPathProgress,
  allStageIds: LessonPathStageId[]
): boolean {
  if (allStageIds.length === 0) return false;
  return allStageIds.every((id) => progress.completedStageIds.includes(id));
}
