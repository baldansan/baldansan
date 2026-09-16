/**
 * Ирцийн бүртгэл — Supabase reads and writes for the teacher's register.
 *
 * Browser-side (same client as `lib/supabase/classrooms.ts`), because the
 * register is taken in a client component while the lesson is happening. RLS
 * from migration 057 is what actually enforces «зөвхөн өөрийн анги» — nothing
 * here is a security boundary.
 *
 * A director view that runs `server-only` should NOT import this module. It
 * should fetch rows with its own server client and feed them to the pure
 * helpers in `lib/classroom/attendance-types.ts`
 * (`mapAttendanceRow` + `summarizeAttendanceByClassroom`).
 */

import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { getClassroomStudents } from "@/lib/supabase/classrooms";
import type { ClassroomStudent } from "@/lib/classroom/types";
import {
  mapAttendanceRow,
  shiftIsoDate,
  summarizeClassroomAttendance,
  type AttendanceEntryInput,
  type AttendanceRecord,
  type AttendanceRegister,
  type AttendanceRosterEntry,
  type ClassroomAttendanceSummary,
} from "@/lib/classroom/attendance-types";

export type AttendanceResult<T> = { data: T | null; error: string | null };

const TABLE = "classroom_attendance";
const CONFLICT_TARGET = "classroom_id,student_id,session_date";

/** How far back the class summary looks by default. */
export const ATTENDANCE_WINDOW_DAYS = 30;

function notConfigured<T>(): AttendanceResult<T> {
  return { data: null, error: "Supabase тохируулаагүй байна." };
}

function notSignedIn<T>(): AttendanceResult<T> {
  return { data: null, error: "Нэвтэрч орно уу." };
}

/** A roster row always needs something to call the person. */
export function rosterEntryFromStudent(
  student: ClassroomStudent
): AttendanceRosterEntry {
  const label =
    student.displayName?.trim() ||
    student.email?.trim() ||
    "Нэргүй сурагч";

  return {
    studentId: student.id,
    displayName: label,
    studentUserId: student.studentUserId,
    status: student.status,
  };
}

async function fetchRoster(
  classroomId: string
): Promise<{ roster: AttendanceRosterEntry[]; error: string | null }> {
  const { data, error } = await getClassroomStudents(classroomId);
  if (error) return { roster: [], error };
  return { roster: (data ?? []).map(rosterEntryFromStudent), error: null };
}

function mapRows(rows: unknown): AttendanceRecord[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapAttendanceRow(row as Record<string, unknown>))
    .filter((row): row is AttendanceRecord => row !== null);
}

// ---------------------------------------------------------------------------
// One date: read the register
// ---------------------------------------------------------------------------

/**
 * Roster plus whatever was already saved for `sessionDate`.
 *
 * `hasRoster` and `hasRegister` are separate on purpose: «сурагч нэмээгүй»,
 * «ирц бүртгээгүй» and «бүгд тасалсан» are three different screens.
 */
export async function getAttendanceRegister(
  classroomId: string,
  sessionDate: string
): Promise<AttendanceResult<AttendanceRegister>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return notSignedIn();

  const { roster, error: rosterError } = await fetchRoster(classroomId);
  if (rosterError) return { data: null, error: rosterError };

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("classroom_id", classroomId)
    .eq("session_date", sessionDate);

  if (error) return { data: null, error: error.message };

  const records = mapRows(data);
  const lastSavedAt = records.reduce<string | null>((latest, row) => {
    const stamp = row.updatedAt ?? row.createdAt ?? null;
    if (!stamp) return latest;
    return !latest || stamp > latest ? stamp : latest;
  }, null);

  return {
    data: {
      classroomId,
      sessionDate,
      roster,
      records,
      hasRoster: roster.length > 0,
      hasRegister: records.length > 0,
      lastSavedAt,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// One date: write the register
// ---------------------------------------------------------------------------

export type SaveAttendanceRegisterInput = {
  classroomId: string;
  /** YYYY-MM-DD. */
  sessionDate: string;
  entries: AttendanceEntryInput[];
};

/**
 * Save the whole register in one upsert.
 *
 * The unique index `(classroom_id, student_id, session_date)` means re-taking
 * the register on the same date updates the existing rows instead of stacking
 * duplicates, so the teacher can correct a mistake without deleting anything.
 */
export async function saveAttendanceRegister(
  input: SaveAttendanceRegisterInput
): Promise<AttendanceResult<AttendanceRecord[]>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return notSignedIn();

  if (input.entries.length === 0) {
    return { data: [], error: null };
  }

  const payload = input.entries.map((entry) => ({
    classroom_id: input.classroomId,
    student_id: entry.studentId,
    session_date: input.sessionDate,
    status: entry.status,
    note: entry.note?.trim() ? entry.note.trim() : null,
    recorded_by: userId,
  }));

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: CONFLICT_TARGET })
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: mapRows(data), error: null };
}

/** Remove one student's row for one date — a register taken by mistake. */
export async function clearAttendanceEntry(
  classroomId: string,
  studentId: string,
  sessionDate: string
): Promise<AttendanceResult<true>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return notSignedIn();

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("classroom_id", classroomId)
    .eq("student_id", studentId)
    .eq("session_date", sessionDate);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}

// ---------------------------------------------------------------------------
// A window of dates: the class summary
// ---------------------------------------------------------------------------

/**
 * Attendance over the last `windowDays` days ending on `today` (a YYYY-MM-DD
 * the caller computed in Ulaanbaatar time — see `mongoliaDay()`).
 *
 * Every number comes from real rows. A student with no rows gets a null rate,
 * which `formatAttendanceRate` renders as «—».
 */
export async function getClassroomAttendanceSummary(
  classroomId: string,
  today: string,
  windowDays: number = ATTENDANCE_WINDOW_DAYS
): Promise<AttendanceResult<ClassroomAttendanceSummary>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return notSignedIn();

  const fromDate = shiftIsoDate(today, -(windowDays - 1));

  const { roster, error: rosterError } = await fetchRoster(classroomId);
  if (rosterError) return { data: null, error: rosterError };

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("classroom_id", classroomId)
    .gte("session_date", fromDate)
    .lte("session_date", today);

  if (error) return { data: null, error: error.message };

  return {
    data: summarizeClassroomAttendance({
      classroomId,
      roster,
      rows: mapRows(data),
      windowDays,
      fromDate,
      toDate: today,
    }),
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Class header
// ---------------------------------------------------------------------------

/**
 * Just enough about the class to head the register page.
 *
 * `lib/classroom/types.ts#Classroom` does not carry `delivery_mode`, and that
 * file belongs to someone else, so the three columns are read here directly.
 * The delivery mode is shown as context only — an online class takes a register
 * exactly like a classroom one, and nothing below is gated on it.
 */
export type AttendanceClassroomContext = {
  classroomId: string;
  name: string;
  level: string | null;
  deliveryMode: "in_person" | "online" | "hybrid" | null;
  scheduleNote: string | null;
};

export const DELIVERY_MODE_LABELS: Record<string, string> = {
  in_person: "Танхимаар",
  online: "Онлайнаар",
  hybrid: "Танхим + онлайн",
};

export async function getAttendanceClassroomContext(
  classroomId: string
): Promise<AttendanceResult<AttendanceClassroomContext | null>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return notSignedIn();

  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name, level, delivery_mode, schedule_note")
    .eq("id", classroomId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const row = data as Record<string, unknown>;
  const mode = row.delivery_mode ? String(row.delivery_mode) : null;

  return {
    data: {
      classroomId: String(row.id),
      name: String(row.name),
      level: row.level ? String(row.level) : null,
      deliveryMode:
        mode === "in_person" || mode === "online" || mode === "hybrid"
          ? mode
          : null,
      scheduleNote: row.schedule_note ? String(row.schedule_note) : null,
    },
    error: null,
  };
}

/** Distinct dates a register exists for, newest first — for the «өмнөх өдрүүд» list. */
export async function getAttendanceSessionDates(
  classroomId: string,
  today: string,
  windowDays: number = ATTENDANCE_WINDOW_DAYS
): Promise<AttendanceResult<string[]>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return notSignedIn();

  const fromDate = shiftIsoDate(today, -(windowDays - 1));

  const { data, error } = await supabase
    .from(TABLE)
    .select("session_date")
    .eq("classroom_id", classroomId)
    .gte("session_date", fromDate)
    .lte("session_date", today)
    .order("session_date", { ascending: false });

  if (error) return { data: null, error: error.message };

  const dates = Array.from(
    new Set(
      (data ?? []).map((row) =>
        String((row as { session_date: unknown }).session_date).slice(0, 10)
      )
    )
  );

  return { data: dates, error: null };
}
