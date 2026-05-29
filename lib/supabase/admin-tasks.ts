import "server-only";

import {
  filterTasksForLesson,
  generateAdminTasks,
  sortAdminTasks,
  summarizeAdminTasks,
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
import { hasSupabaseConfig } from "@/lib/supabase/client";

export type AdminTaskCenterData = {
  tasks: AdminTask[];
  summary: AdminTaskSummary;
  warnings: string[];
  generatedAt: string;
};

export async function getAdminTaskCenterData(): Promise<AdminTaskCenterData> {
  const [
    reports,
    overview,
    questions,
    vocabulary,
    releaseWorkflowResult,
  ] = await Promise.all([
    getHsk5LessonsWithQa(),
    getLessonAnalyticsOverview(),
    getQuestionLevelAnalytics(),
    getVocabularyEngagementAnalytics(),
    getReleaseWorkflowMetrics(),
  ]);

  const warnings = [
    ...overview.warnings,
    ...releaseWorkflowResult.warnings,
  ];

  const difficultQuestions = questions.filter((row) => row.needsReview);

  const tasks = sortAdminTasks(
    generateAdminTasks({
      reports,
      lessonAnalytics: overview.lessons,
      difficultQuestions,
      vocabularyEngagement: vocabulary,
      warnings,
      limitedByRls: overview.limitedByRls,
      supabaseConfigured: hasSupabaseConfig,
    })
  );

  return {
    tasks,
    summary: summarizeAdminTasks(tasks),
    warnings: [...new Set(warnings)],
    generatedAt: new Date().toISOString(),
  };
}

export async function getAdminTasks(): Promise<AdminTask[]> {
  const data = await getAdminTaskCenterData();
  return data.tasks;
}

export async function getAdminTasksForLesson(
  lessonId: string
): Promise<AdminTask[]> {
  const data = await getAdminTaskCenterData();
  return sortAdminTasks(filterTasksForLesson(data.tasks, lessonId));
}

export async function getUrgentAdminTasks(limit = 5): Promise<AdminTask[]> {
  const tasks = await getAdminTasks();
  return tasks
    .filter(
      (task) => task.severity === "critical" || task.severity === "warning"
    )
    .slice(0, limit);
}
