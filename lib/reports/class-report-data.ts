/**
 * The handful of class facts the report header needs that the teacher
 * analytics layer does not return.
 *
 * `Classroom` in `lib/classroom/types` predates migration 054, so it carries
 * no `delivery_mode`, `schedule_note` or `course_id` even though the row does.
 * Rather than widening a type owned elsewhere, the report reads those three
 * columns itself and degrades to «—» when the migration has not run.
 */

import { supabase } from "@/lib/supabase/client";
import type { ClassReportMeta } from "@/lib/reports/class-report";
import type {
  ClassroomProgressAnalytics,
  StudentProgressRow,
} from "@/lib/teacher/analytics-types";
import {
  getClassroomProgressAnalytics,
  getClassroomStudentProgress,
} from "@/lib/supabase/teacher-analytics";

function text(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

export async function getClassReportMeta(
  classroomId: string,
  teacherUserId: string | null
): Promise<ClassReportMeta> {
  const notes: string[] = [];
  const empty: ClassReportMeta = {
    deliveryMode: null,
    scheduleNote: null,
    courseId: null,
    teacherLabel: null,
    notes,
  };

  if (!supabase) {
    notes.push("Supabase тохиргоо алга — толгой хэсгийн зарим талбар «—» байна.");
    return empty;
  }

  let deliveryMode: string | null = null;
  let scheduleNote: string | null = null;
  let courseId: string | null = null;

  const { data, error } = await supabase
    .from("classrooms")
    .select("delivery_mode, schedule_note, course_id")
    .eq("id", classroomId)
    .maybeSingle();

  if (error) {
    notes.push(
      isMissingColumnError(error.message)
        ? "Хичээллэх хэлбэр, хуваарь, курс хадгалагдаагүй байна — 054_classroom_delivery_mode.sql миграцыг ажиллуулна уу. Эдгээр талбар «—» харагдана."
        : `Ангийн нэмэлт мэдээлэл уншиж чадсангүй: ${error.message}`
    );
  } else if (data) {
    deliveryMode = text(data.delivery_mode);
    scheduleNote = text(data.schedule_note);
    courseId = text(data.course_id);
  }

  let teacherLabel: string | null = null;
  if (teacherUserId) {
    const profile = await supabase
      .from("teacher_profiles")
      .select("display_name")
      .eq("user_id", teacherUserId)
      .maybeSingle();

    if (profile.error) {
      notes.push(
        "Багшийн нэр уншигдсангүй — тайланд «—» гэж үлдэв."
      );
    } else {
      teacherLabel = text(profile.data?.display_name);
      if (!teacherLabel) {
        notes.push("Багшийн профайлд нэр бичигдээгүй байна.");
      }
    }
  } else {
    notes.push("Энэ ангид багш оноогоогүй байна.");
  }

  return { deliveryMode, scheduleNote, courseId, teacherLabel, notes };
}

export type ClassReportSource = {
  analytics: ClassroomProgressAnalytics;
  students: StudentProgressRow[];
  meta: ClassReportMeta;
  warnings: string[];
  /** Non-fatal problem worth showing above the document. */
  error: string | null;
};

/**
 * Everything the class report page needs, in one call.
 *
 * Kept out of the view so the component's effect has nothing to do but await a
 * promise and store the result.
 */
export async function loadClassReportSource(
  classroomId: string
): Promise<{ source: ClassReportSource | null; error: string | null }> {
  const [analyticsRes, studentsRes] = await Promise.all([
    getClassroomProgressAnalytics(classroomId),
    getClassroomStudentProgress(classroomId),
  ]);

  if (analyticsRes.error || !analyticsRes.data) {
    return { source: null, error: analyticsRes.error ?? "Анги олдсонгүй." };
  }

  const meta = await getClassReportMeta(
    classroomId,
    analyticsRes.data.classroom.teacherUserId ?? null
  );

  return {
    source: {
      analytics: analyticsRes.data,
      students: studentsRes.data ?? [],
      meta,
      warnings: [...analyticsRes.warnings, ...studentsRes.warnings],
      error: studentsRes.error ?? null,
    },
    error: null,
  };
}
