/**
 * Ирцийн бүртгэл — domain types and pure aggregation.
 *
 * Nothing in this file touches Supabase, so both the teacher's browser module
 * (`lib/supabase/classroom-attendance.ts`) and any server-only director view
 * can share the same row mapping and the same arithmetic.
 *
 * The honesty rule for every number here: a student with no register rows in
 * the window gets `null`, never `0`. «Бүртгээгүй» and «нэг ч удаа ирээгүй» are
 * different facts and the UI must be able to tell them apart.
 */

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** Button/labels shown to the teacher. */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Ирсэн",
  absent: "Тасалсан",
  late: "Хоцорсон",
  excused: "Чөлөөтэй",
};

/** Short forms for tight table cells. */
export const ATTENDANCE_STATUS_SHORT_LABELS: Record<AttendanceStatus, string> = {
  present: "И",
  absent: "Т",
  late: "Х",
  excused: "Ч",
};

/** Tailwind ring/·bg tones, matching the palette used across components/teacher. */
export const ATTENDANCE_STATUS_TONES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  absent: "bg-red-50 text-red-800 ring-red-200",
  late: "bg-amber-50 text-amber-900 ring-amber-200",
  excused: "bg-slate-100 text-slate-700 ring-slate-300",
};

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    typeof value === "string" &&
    (ATTENDANCE_STATUSES as readonly string[]).includes(value)
  );
}

export function attendanceStatusLabel(value: unknown): string {
  return isAttendanceStatus(value) ? ATTENDANCE_STATUS_LABELS[value] : "—";
}

/** One saved row of `public.classroom_attendance`. */
export type AttendanceRecord = {
  id: string;
  classroomId: string;
  /** `classroom_students.id` — the roster row, not the user id. */
  studentId: string;
  /** YYYY-MM-DD, Ulaanbaatar. */
  sessionDate: string;
  status: AttendanceStatus;
  note: string | null;
  recordedBy: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** What the teacher submits for one student when saving a register. */
export type AttendanceEntryInput = {
  /** `classroom_students.id`. */
  studentId: string;
  status: AttendanceStatus;
  note?: string | null;
};

/** The whole register for one class on one date. */
export type AttendanceRegister = {
  classroomId: string;
  sessionDate: string;
  /** Roster rows, in roster order — the source of truth for who should be listed. */
  roster: AttendanceRosterEntry[];
  /** Rows already saved for this date. Empty means «энэ өдөр ирц бүртгээгүй». */
  records: AttendanceRecord[];
  /** False when the roster itself is empty — a different empty state. */
  hasRoster: boolean;
  /** True when at least one row exists for this date. */
  hasRegister: boolean;
  /** Latest `updated_at` among this date's rows, for «хамгийн сүүлд хадгалсан». */
  lastSavedAt: string | null;
};

/** Minimal roster shape the register needs; kept local so this file stays Supabase-free. */
export type AttendanceRosterEntry = {
  /** `classroom_students.id`. */
  studentId: string;
  displayName: string;
  /** Null for an invitee who never linked an account. */
  studentUserId: string | null;
  status: string;
};

/** Per-student attendance over a window of days. */
export type StudentAttendanceSummary = {
  studentId: string;
  displayName: string;
  /** Every row in the window, all four statuses. 0 means nothing recorded. */
  recordedDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  excusedDays: number;
  /**
   * 0–100. «Чөлөөтэй» is left out of the denominator — the centre approved that
   * absence, so counting it against the student would be a lie. Null when the
   * denominator is 0 (nothing recorded, or every row excused) → show «—».
   */
  attendanceRate: number | null;
  /** YYYY-MM-DD of the most recent row, or null. */
  lastSessionDate: string | null;
  /** Status on that most recent row, or null. */
  lastStatus: AttendanceStatus | null;
};

/** Class-level roll-up over the same window. */
export type ClassroomAttendanceSummary = {
  classroomId: string;
  windowDays: number;
  /** YYYY-MM-DD bounds actually queried. */
  fromDate: string;
  toDate: string;
  /** Distinct dates a register was taken, newest first. */
  sessionDates: string[];
  students: StudentAttendanceSummary[];
  /**
   * Class attendance rate 0–100 over the same denominator rule as the student
   * rate. Null when the class has no countable rows in the window.
   */
  classRate: number | null;
  /** Roster size, including invitees. */
  rosterCount: number;
  /** How many roster rows have at least one row in the window. */
  recordedStudentCount: number;
  /** Total rows in the window — 0 means «ирц бүртгээгүй байна». */
  totalRecords: number;
};

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

/**
 * Map a raw `classroom_attendance` row. Returns null for a row whose status is
 * not one of the four we know — better to drop it than to render a guess.
 */
export function mapAttendanceRow(
  row: Record<string, unknown>
): AttendanceRecord | null {
  const status = row.status;
  if (!isAttendanceStatus(status)) return null;

  return {
    id: String(row.id),
    classroomId: String(row.classroom_id),
    studentId: String(row.student_id),
    sessionDate: String(row.session_date).slice(0, 10),
    status,
    note: row.note ? String(row.note) : null,
    recordedBy: row.recorded_by ? String(row.recorded_by) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Dates (plain YYYY-MM-DD arithmetic — the column is a `date`, not a timestamp)
// ---------------------------------------------------------------------------

/** YYYY-MM-DD that is `days` before `isoDate`. */
export function shiftIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const base = Date.UTC(y, m - 1, d);
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/** «2026-09-16» → «2026.09.16». Used wherever a bare date is shown. */
export function formatIsoDay(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const trimmed = isoDate.slice(0, 10);
  const [y, m, d] = trimmed.split("-");
  if (!y || !m || !d) return trimmed;
  return `${y}.${m}.${d}`;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/**
 * Attendance rate for one bag of statuses, or null when there is nothing
 * countable. Excused rows are excluded from both sides of the fraction.
 */
export function attendanceRateOf(counts: {
  presentDays: number;
  lateDays: number;
  absentDays: number;
}): number | null {
  const denominator = counts.presentDays + counts.lateDays + counts.absentDays;
  if (denominator <= 0) return null;
  return Math.round(((counts.presentDays + counts.lateDays) / denominator) * 100);
}

/**
 * Roll up raw rows against a roster.
 *
 * `rows` must already be filtered to the window; this function does not filter
 * by date so a caller that fetched a narrower range keeps control of it.
 * A roster entry with no rows comes back with `recordedDays: 0` and a null
 * rate, which the UI renders as «—».
 */
export function summarizeClassroomAttendance(params: {
  classroomId: string;
  roster: AttendanceRosterEntry[];
  rows: AttendanceRecord[];
  windowDays: number;
  fromDate: string;
  toDate: string;
}): ClassroomAttendanceSummary {
  const { classroomId, roster, rows, windowDays, fromDate, toDate } = params;

  const byStudent = new Map<string, AttendanceRecord[]>();
  for (const row of rows) {
    const bucket = byStudent.get(row.studentId);
    if (bucket) bucket.push(row);
    else byStudent.set(row.studentId, [row]);
  }

  const students: StudentAttendanceSummary[] = roster.map((entry) => {
    const own = byStudent.get(entry.studentId) ?? [];
    const counts = {
      presentDays: own.filter((r) => r.status === "present").length,
      lateDays: own.filter((r) => r.status === "late").length,
      absentDays: own.filter((r) => r.status === "absent").length,
    };
    const excusedDays = own.filter((r) => r.status === "excused").length;
    const latest = own.reduce<AttendanceRecord | null>(
      (best, r) => (!best || r.sessionDate > best.sessionDate ? r : best),
      null
    );

    return {
      studentId: entry.studentId,
      displayName: entry.displayName,
      recordedDays: own.length,
      presentDays: counts.presentDays,
      lateDays: counts.lateDays,
      absentDays: counts.absentDays,
      excusedDays,
      attendanceRate: attendanceRateOf(counts),
      lastSessionDate: latest?.sessionDate ?? null,
      lastStatus: latest?.status ?? null,
    };
  });

  const classCounts = {
    presentDays: students.reduce((sum, s) => sum + s.presentDays, 0),
    lateDays: students.reduce((sum, s) => sum + s.lateDays, 0),
    absentDays: students.reduce((sum, s) => sum + s.absentDays, 0),
  };

  const sessionDates = Array.from(
    new Set(rows.map((r) => r.sessionDate))
  ).sort((a, b) => b.localeCompare(a));

  return {
    classroomId,
    windowDays,
    fromDate,
    toDate,
    sessionDates,
    students,
    classRate: attendanceRateOf(classCounts),
    rosterCount: roster.length,
    recordedStudentCount: students.filter((s) => s.recordedDays > 0).length,
    totalRecords: rows.length,
  };
}

/**
 * The students a teacher should actually chase: lowest attendance first.
 *
 * Students with nothing recorded are never listed — «мэдэхгүй» is not «муу».
 * `maxRate` keeps the list to people genuinely behind rather than padding it
 * out with a full class at 100%.
 */
export function worstAttendanceStudents(
  summary: ClassroomAttendanceSummary,
  options: { limit?: number; maxRate?: number } = {}
): StudentAttendanceSummary[] {
  const limit = options.limit ?? 5;
  const maxRate = options.maxRate ?? 90;

  return summary.students
    .filter((s) => s.attendanceRate !== null && s.attendanceRate <= maxRate)
    .sort((a, b) => {
      const byRate = (a.attendanceRate ?? 0) - (b.attendanceRate ?? 0);
      if (byRate !== 0) return byRate;
      return b.absentDays - a.absentDays;
    })
    .slice(0, limit);
}

/** «84%» or «—». Keeps the honesty rule in one place. */
export function formatAttendanceRate(rate: number | null): string {
  return rate === null ? "—" : `${rate}%`;
}

// ---------------------------------------------------------------------------
// Director overview (many classes at once)
// ---------------------------------------------------------------------------

/**
 * One line per class for the training-centre overview.
 *
 * Deliberately small: a director scanning twelve classes wants the rate, when
 * the register was last taken, and how many people are behind — not a table of
 * every session.
 */
export type ClassroomAttendanceOverviewRow = {
  classroomId: string;
  /** 0–100, or null when nothing countable was recorded in the window. */
  attendanceRate: number | null;
  /** Rows in the window. 0 means the class never took a register. */
  totalRecords: number;
  /** Distinct dates a register was taken in the window. */
  sessionCount: number;
  /** Most recent session date, or null. */
  lastSessionDate: string | null;
  /** Roster rows whose own rate is at or below `concernRate` (default 75). */
  concernStudentCount: number;
};

/**
 * Roll `rows` up per class. `rosterByClassroom` is needed so a class with a
 * roster but no register still appears, with a null rate rather than 0%.
 *
 * Pure — no Supabase import — so a `server-only` module can call it with rows
 * it fetched through the service/server client.
 */
export function summarizeAttendanceByClassroom(params: {
  rosterByClassroom: Map<string, AttendanceRosterEntry[]>;
  rows: AttendanceRecord[];
  windowDays: number;
  fromDate: string;
  toDate: string;
  /** A student at or below this rate counts as «анхаарах». Default 75. */
  concernRate?: number;
}): Map<string, ClassroomAttendanceOverviewRow> {
  const concernRate = params.concernRate ?? 75;

  const rowsByClassroom = new Map<string, AttendanceRecord[]>();
  for (const row of params.rows) {
    const bucket = rowsByClassroom.get(row.classroomId);
    if (bucket) bucket.push(row);
    else rowsByClassroom.set(row.classroomId, [row]);
  }

  const classroomIds = new Set<string>([
    ...params.rosterByClassroom.keys(),
    ...rowsByClassroom.keys(),
  ]);

  const out = new Map<string, ClassroomAttendanceOverviewRow>();
  for (const classroomId of classroomIds) {
    const summary = summarizeClassroomAttendance({
      classroomId,
      roster: params.rosterByClassroom.get(classroomId) ?? [],
      rows: rowsByClassroom.get(classroomId) ?? [],
      windowDays: params.windowDays,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });

    out.set(classroomId, {
      classroomId,
      attendanceRate: summary.classRate,
      totalRecords: summary.totalRecords,
      sessionCount: summary.sessionDates.length,
      lastSessionDate: summary.sessionDates[0] ?? null,
      concernStudentCount: summary.students.filter(
        (s) => s.attendanceRate !== null && s.attendanceRate <= concernRate
      ).length,
    });
  }

  return out;
}
