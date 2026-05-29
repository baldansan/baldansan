import "server-only";

import {
  filterTasksForLessonActive,
  mergeGeneratedWithPersisted,
  summarizeMergedAdminTasks,
  type PersistedAdminTaskRow,
} from "@/lib/admin/task-merge";
import {
  filterTasksForLesson,
  generateAdminTasks,
  sortAdminTasks,
  type AdminTask,
  type AdminTaskSummary,
} from "@/lib/admin/task-generator";
import { getHsk5LessonsWithQa } from "@/lib/admin/lesson-fetch";
import {
  getLessonAnalyticsOverview,
  getQuestionLevelAnalytics,
  getReleaseWorkflowMetrics,
  getVocabularyEngagementAnalytics,
} from "@/lib/supabase/admin-analytics";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { getB2BCrmTaskInput } from "@/lib/supabase/admin-b2b-metrics";

export type AdminTaskCenterData = {
  tasks: AdminTask[];
  allTasks: AdminTask[];
  summary: AdminTaskSummary;
  warnings: string[];
  generatedAt: string;
  persistenceAvailable: boolean;
};

async function fetchPersistedAdminTasksServer(): Promise<{
  rows: PersistedAdminTaskRow[];
  warnings: string[];
}> {
  if (!hasSupabaseConfig) {
    return { rows: [], warnings: [] };
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return { rows: [], warnings: [] };
  }

  try {
    const { data, error } = await client.from("admin_tasks").select("*");

    if (error) {
      const message = error.message ?? "";
      if (
        message.includes("admin_tasks") ||
        message.includes("does not exist")
      ) {
        return {
          rows: [],
          warnings: [
            "Run supabase/migrations/006_admin_tasks.sql for persistent task management.",
          ],
        };
      }
      return {
        rows: [],
        warnings: [`Could not load persisted admin tasks: ${message}`],
      };
    }

    return { rows: (data ?? []) as PersistedAdminTaskRow[], warnings: [] };
  } catch {
    return {
      rows: [],
      warnings: ["Could not load persisted admin tasks."],
    };
  }
}

async function buildGeneratedTasks(): Promise<{
  generated: AdminTask[];
  warnings: string[];
}> {
  const [
    reports,
    overview,
    questions,
    vocabulary,
    releaseWorkflowResult,
    b2bCrm,
  ] = await Promise.all([
    getHsk5LessonsWithQa(),
    getLessonAnalyticsOverview(),
    getQuestionLevelAnalytics(),
    getVocabularyEngagementAnalytics(),
    getReleaseWorkflowMetrics(),
    getB2BCrmTaskInput(),
  ]);

  const warnings = [
    ...overview.warnings,
    ...releaseWorkflowResult.warnings,
  ];

  const difficultQuestions = questions.filter((row) => row.needsReview);

  const generated = generateAdminTasks({
    reports,
    lessonAnalytics: overview.lessons,
    difficultQuestions,
    vocabularyEngagement: vocabulary,
    warnings,
    limitedByRls: overview.limitedByRls,
    supabaseConfigured: hasSupabaseConfig,
    b2bCrm,
  });

  return { generated, warnings };
}

export async function getAdminTaskCenterData(): Promise<AdminTaskCenterData> {
  const [{ generated, warnings: genWarnings }, persistedResult] =
    await Promise.all([buildGeneratedTasks(), fetchPersistedAdminTasksServer()]);

  const allTasks = sortAdminTasks(
    mergeGeneratedWithPersisted(generated, persistedResult.rows)
  );

  const warnings = [...new Set([...genWarnings, ...persistedResult.warnings])];

  return {
    tasks: allTasks,
    allTasks,
    summary: summarizeMergedAdminTasks(allTasks),
    warnings,
    generatedAt: new Date().toISOString(),
    persistenceAvailable: persistedResult.warnings.length === 0,
  };
}

export async function getAdminTasks(): Promise<AdminTask[]> {
  const data = await getAdminTaskCenterData();
  return data.tasks;
}

export async function getAdminTasksForLesson(
  lessonId: string,
  activeOnly = true
): Promise<AdminTask[]> {
  const data = await getAdminTaskCenterData();
  if (activeOnly) {
    return sortAdminTasks(filterTasksForLessonActive(data.allTasks, lessonId));
  }
  return sortAdminTasks(filterTasksForLesson(data.allTasks, lessonId));
}

export async function getActiveAdminTasks(limit?: number): Promise<AdminTask[]> {
  const data = await getAdminTaskCenterData();
  const active = data.allTasks.filter(
    (task) =>
      task.status !== "resolved" &&
      task.status !== "dismissed" &&
      task.isGenerated !== false
  );
  const sorted = sortAdminTasks(active);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getDashboardAdminTasks(limit = 5): Promise<{
  activeTasks: AdminTask[];
  summary: AdminTaskSummary;
  warnings: string[];
}> {
  const data = await getAdminTaskCenterData();
  const active = data.allTasks.filter(
    (task) =>
      task.status !== "resolved" &&
      task.status !== "dismissed" &&
      task.isGenerated !== false
  );

  const priorityRank = (task: AdminTask) => {
    if (task.priority === "urgent") return 0;
    if (task.status === "in_progress") return 1;
    if (task.severity === "critical") return 2;
    if (task.severity === "warning") return 3;
    return 4;
  };

  const sorted = active.slice().sort((a, b) => {
    const p = priorityRank(a) - priorityRank(b);
    if (p !== 0) return p;
    return a.title.localeCompare(b.title);
  });

  return {
    activeTasks: sorted.slice(0, limit),
    summary: data.summary,
    warnings: data.warnings,
  };
}
