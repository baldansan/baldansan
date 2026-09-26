/**
 * Ангийн заавал хөтөлбөр (migration 066).
 *
 * Шинэ хүснэгт биш — `assignments` (is_curriculum = true) + `assignment_results`.
 * Сурагч хичээлээ дуусгахад `lib/classroom/assignment-completion.ts` тохирох
 * даалгаврыг автоматаар 'completed' болгодог тул ахиц өөрөө тоологдоно.
 */
import { supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import {
  mapAssignmentFromRow,
  type ClassroomResult,
} from "@/lib/supabase/classrooms";
import type {
  Assignment,
  CurriculumLessonInput,
  CurriculumProgressRow,
  MyCurriculum,
  MyCurriculumClass,
  MyCurriculumLesson,
} from "@/lib/classroom/types";

function notConfigured<T>(): ClassroomResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

function toError(error: { message: string } | null): string | null {
  if (!error) return null;
  if (/is_curriculum|curriculum_progress|set_classroom_curriculum/.test(error.message)) {
    return "Заавал хөтөлбөр идэвхжээгүй — Supabase дээр 066 migration-ийг ажиллуулна уу.";
  }
  return error.message;
}

function percentOf(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Багш: ангийн заавал хөтөлбөрийн хичээлүүд (дарааллаар). */
export async function getClassroomCurriculum(
  classroomId: string
): Promise<ClassroomResult<Assignment[]>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("assignments")
    .select("*, classrooms(name)")
    .eq("classroom_id", classroomId)
    .eq("is_curriculum", true)
    .order("order_index", { ascending: true, nullsFirst: false });

  if (error) return { data: null, error: toError(error) };
  return {
    data: (data ?? []).map((row) =>
      mapAssignmentFromRow(row as Record<string, unknown>)
    ),
    error: null,
  };
}

/**
 * Багш: хөтөлбөрийг бүхэлд нь солино. Жагсаалтаас хасагдсан хичээлийн даалгавар
 * (ба сурагчдын үр дүн) устна. Хадгалсан хичээлийн тоог буцаана.
 */
export async function setClassroomCurriculum(
  classroomId: string,
  courseId: string | null,
  lessons: CurriculumLessonInput[]
): Promise<ClassroomResult<number>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase.rpc("set_classroom_curriculum", {
    p_classroom_id: classroomId,
    p_course_id: courseId,
    p_lessons: lessons.map((l) => ({
      lesson_id: l.lessonId,
      title: l.title,
      order_index: l.orderIndex,
    })),
  });
  if (error) {
    const msg = error.message.includes("not allowed")
      ? "Энэ ангийн хөтөлбөрийг өөрчлөх эрх алга."
      : toError(error);
    return { data: null, error: msg };
  }
  return { data: Number(data ?? 0), error: null };
}

/**
 * Хөтөлбөрийн ахиц сурагч бүрээр. Багш бүх сурагчийг, сурагч өөрийгөө,
 * эцэг эх өөрийн хүүхдийг л харна (RPC дотор шүүгдэнэ).
 */
export async function getClassroomCurriculumProgress(
  classroomId: string
): Promise<ClassroomResult<CurriculumProgressRow[]>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase.rpc("classroom_curriculum_progress", {
    p_classroom_id: classroomId,
  });
  if (error) return { data: null, error: toError(error) };
  const rows = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
  return {
    data: rows.map((row) => ({
      studentUserId: String(row.student_user_id),
      displayName: row.display_name ? String(row.display_name) : "—",
      total: Number(row.total ?? 0),
      completed: Number(row.completed ?? 0),
      percent: Number(row.percent ?? 0),
      lastCompletedAt: row.last_completed_at
        ? String(row.last_completed_at)
        : null,
    })),
    error: null,
  };
}

/**
 * Нэвтэрсэн сурагч (хүүхдийн бүртгэл ч мөн): ангиудынх нь заавал хөтөлбөр,
 * өөрийн үр дүнтэй нь, дарааллаар. Анги/хөтөлбөр алга бол `classes` хоосон.
 */
export async function getMyCurriculum(): Promise<ClassroomResult<MyCurriculum>> {
  const empty: MyCurriculum = {
    classes: [],
    completedCount: 0,
    totalCount: 0,
    nextLessonId: null,
    nextLessonTitle: null,
  };
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: empty, error: null };

  const { data: enrollments, error: enrollError } = await supabase
    .from("classroom_students")
    .select("classroom_id, status")
    .eq("student_user_id", userId);
  if (enrollError) return { data: null, error: toError(enrollError) };

  const classroomIds = [
    ...new Set(
      (enrollments ?? [])
        .filter((e) => e.status !== "removed")
        .map((e) => String(e.classroom_id))
    ),
  ];
  if (classroomIds.length === 0) return { data: empty, error: null };

  const { data: rows, error: assignError } = await supabase
    .from("assignments")
    .select("id, classroom_id, lesson_id, title, order_index, course_id, classrooms(name)")
    .in("classroom_id", classroomIds)
    .eq("is_curriculum", true)
    .order("order_index", { ascending: true, nullsFirst: false });
  if (assignError) return { data: null, error: toError(assignError) };

  const list = (rows ?? []) as Record<string, unknown>[];
  if (list.length === 0) return { data: empty, error: null };

  const done = new Map<string, string | null>();
  const { data: results, error: resultsError } = await supabase
    .from("assignment_results")
    .select("assignment_id, status, completed_at")
    .eq("student_user_id", userId)
    .in(
      "assignment_id",
      list.map((r) => String(r.id))
    );
  if (resultsError) return { data: null, error: toError(resultsError) };
  for (const r of results ?? []) {
    if (r.status === "completed") {
      done.set(String(r.assignment_id), r.completed_at ? String(r.completed_at) : null);
    }
  }

  const byClass = new Map<string, MyCurriculumClass>();
  for (const row of list) {
    const classroomId = String(row.classroom_id);
    let entry = byClass.get(classroomId);
    if (!entry) {
      const joined = row.classrooms as { name?: string } | { name?: string }[] | null;
      const joinedName = Array.isArray(joined) ? joined[0]?.name : joined?.name;
      entry = {
        classroomId,
        classroomName: joinedName ? String(joinedName) : "",
        courseId: row.course_id ? String(row.course_id) : null,
        lessons: [],
        completedCount: 0,
        totalCount: 0,
        percent: 0,
        nextLessonId: null,
        nextLessonTitle: null,
      };
      byClass.set(classroomId, entry);
    }
    const assignmentId = String(row.id);
    const lesson: MyCurriculumLesson = {
      assignmentId,
      lessonId: String(row.lesson_id ?? ""),
      title: String(row.title ?? row.lesson_id ?? ""),
      orderIndex: row.order_index != null ? Number(row.order_index) : entry.lessons.length,
      completed: done.has(assignmentId),
      completedAt: done.get(assignmentId) ?? null,
    };
    if (lesson.lessonId) entry.lessons.push(lesson);
  }

  // Анги бүрийг элссэн дарааллаар (classroomIds) байрлуулна.
  const classes: MyCurriculumClass[] = [];
  for (const id of classroomIds) {
    const entry = byClass.get(id);
    if (!entry || entry.lessons.length === 0) continue;
    entry.lessons.sort((a, b) => a.orderIndex - b.orderIndex);
    entry.totalCount = entry.lessons.length;
    entry.completedCount = entry.lessons.filter((l) => l.completed).length;
    entry.percent = percentOf(entry.completedCount, entry.totalCount);
    const next = entry.lessons.find((l) => !l.completed) ?? null;
    entry.nextLessonId = next?.lessonId ?? null;
    entry.nextLessonTitle = next?.title ?? null;
    classes.push(entry);
  }

  const firstOpen = classes.find((c) => c.nextLessonId);
  return {
    data: {
      classes,
      completedCount: classes.reduce((n, c) => n + c.completedCount, 0),
      totalCount: classes.reduce((n, c) => n + c.totalCount, 0),
      nextLessonId: firstOpen?.nextLessonId ?? null,
      nextLessonTitle: firstOpen?.nextLessonTitle ?? null,
    },
    error: null,
  };
}
