import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";

export type ClassroomAdminSummary = {
  teacherProfiles: number | null;
  classrooms: number | null;
  assignments: number | null;
  unavailable: boolean;
  note: string | null;
};

export async function getClassroomAdminSummary(): Promise<ClassroomAdminSummary> {
  const empty: ClassroomAdminSummary = {
    teacherProfiles: null,
    classrooms: null,
    assignments: null,
    unavailable: true,
    note: "Supabase not configured or classroom tables not migrated.",
  };

  if (!hasSupabaseConfig) return empty;

  const client = await createServerSupabaseClient();
  if (!client) return empty;

  const [teachers, classrooms, assignments] = await Promise.all([
    client.from("teacher_profiles").select("user_id", { count: "exact", head: true }),
    client.from("classrooms").select("id", { count: "exact", head: true }),
    client.from("assignments").select("id", { count: "exact", head: true }),
  ]);

  const anyError = teachers.error ?? classrooms.error ?? assignments.error;
  if (anyError) {
    return {
      ...empty,
      note: anyError.message.includes("does not exist")
        ? "Run migration 011_classroom_roles_assignments.sql"
        : anyError.message,
    };
  }

  return {
    teacherProfiles: teachers.count ?? 0,
    classrooms: classrooms.count ?? 0,
    assignments: assignments.count ?? 0,
    unavailable: false,
    note: null,
  };
}
