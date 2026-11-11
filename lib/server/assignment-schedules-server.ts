import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const TYPE_TITLE: Record<string, string> = {
  full_lesson: "хичээлийг бүтнээр хийх",
  vocabulary: "үгсийг цээжлэх",
  quiz: "дасгалыг ажиллах",
  review: "давтах",
  watch: "бичлэгийг үзэх",
};

/** Улаанбаатарын цагаар өнөөдөр (YYYY-MM-DD). */
function ubDate(offsetDays = 0): string {
  const d = new Date(Date.now() + 8 * 3600_000 + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export type ScheduleRunSummary = {
  due: number;
  created: number;
  /** Шинэ даалгавар очсон сурагчид — мэдэгдэл илгээхэд. */
  notify: { classroomId: string; userIds: string[]; title: string }[];
  skipped?: string;
};

/**
 * Өдөр бүрийн cron: хугацаа нь болсон «долоо хоног бүрийн» даалгавруудыг үүсгэнэ
 * (service role). Багшийн хөтөч дээрх runDueAssignmentSchedules()-тэй ижил
 * «эхлээд эзэмш, дараа нь үүсгэ» дүрэмтэй тул хоёулаа ажилласан ч давхардахгүй.
 * 091 migration ажиллаагүй бол чимээгүй алгасна.
 */
export async function runAssignmentSchedulesServer(
  service: SupabaseClient
): Promise<ScheduleRunSummary> {
  const today = ubDate(0);
  const { data, error } = await service
    .from("assignment_schedules")
    .select("*")
    .eq("active", true)
    .lte("next_run_on", today)
    .limit(200);
  if (error) return { due: 0, created: 0, notify: [], skipped: error.message };

  const summary: ScheduleRunSummary = { due: (data ?? []).length, created: 0, notify: [] };

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const lessonIds = ((row.lesson_ids ?? []) as string[]).map(String);
    const titles = ((row.lesson_titles ?? []) as string[]).map(String);
    const index = Number(row.next_index ?? 0);
    const lessonId = lessonIds[index];
    const isLast = index >= lessonIds.length - 1;
    const interval = Number(row.interval_days ?? 7);
    const dueDays = Number(row.due_days ?? 7);
    const classroomId = String(row.classroom_id);
    const type = String(row.assignment_type ?? "full_lesson");

    const { data: claimed } = await service
      .from("assignment_schedules")
      .update({
        next_index: index + 1,
        next_run_on: ubDate(interval),
        active: !isLast && Boolean(lessonId),
      })
      .eq("id", String(row.id))
      .eq("next_index", index)
      .select("id");
    if (!claimed || claimed.length === 0 || !lessonId) continue;

    const { data: classroom } = await service
      .from("classrooms")
      .select("organization_id")
      .eq("id", classroomId)
      .maybeSingle();

    const title = `${titles[index] ?? lessonId} — ${TYPE_TITLE[type] ?? "даалгавар"}`;
    const { data: assignment, error: insertError } = await service
      .from("assignments")
      .insert({
        classroom_id: classroomId,
        lesson_id: lessonId,
        assignment_type: type,
        title,
        instructions: row.instructions ? String(row.instructions) : null,
        due_date: ubDate(dueDays),
        status: "assigned",
        organization_id: classroom?.organization_id ?? null,
        created_by: String(row.created_by),
        target_student_user_id: null,
      })
      .select("id")
      .single();
    if (insertError || !assignment) continue;

    const { data: students } = await service
      .from("classroom_students")
      .select("student_user_id")
      .eq("classroom_id", classroomId)
      .not("student_user_id", "is", null);
    const ids = (students ?? []).map((s) => String(s.student_user_id));
    if (ids.length > 0) {
      await service.from("assignment_results").insert(
        ids.map((sid) => ({
          assignment_id: assignment.id,
          student_user_id: sid,
          status: "not_started",
          metadata: {},
        }))
      );
    }
    summary.created += 1;
    summary.notify.push({ classroomId, userIds: ids, title });
  }

  return summary;
}
