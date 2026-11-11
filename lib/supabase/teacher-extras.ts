/**
 * Багшийн ажлын талбарын нэмэлтүүд (migration 091): мэдэгдэл илгээх,
 * эцэг эхийн холбоос, давтагдах даалгавар. Browser client, RLS.
 * 091 ажиллаагүй бол алдаа шидэхгүй — `missing: true` буцаана.
 */
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { createAssignment } from "@/lib/supabase/classrooms";

const MISSING = /does not exist|schema cache|Could not find|PGRST20[25]|42P01|42883/i;

/* ------------------------------------------------------------------ */
/* Мэдэгдэл (push)                                                     */
/* ------------------------------------------------------------------ */

export type RemindResult = {
  ok: boolean;
  /** Сервер дээр мэдэгдлийн тохиргоо (VAPID) байгаа эсэх. */
  configured: boolean;
  targets: number;
  /** Мэдэгдэл үнэхээр очсон сурагчийн тоо. */
  reached: number;
  error?: string;
};

export async function sendClassPush(input: {
  classroomId: string;
  userIds?: string[];
  title: string;
  body: string;
  url?: string;
}): Promise<RemindResult> {
  try {
    const res = await fetch("/api/teacher/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(input),
    });
    const json = (await res.json().catch(() => ({}))) as Partial<RemindResult>;
    return {
      ok: res.ok && json.ok !== false,
      configured: json.configured !== false,
      targets: json.targets ?? 0,
      reached: json.reached ?? 0,
      error: json.error,
    };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      targets: 0,
      reached: 0,
      error: e instanceof Error ? e.message : "Сүлжээний алдаа",
    };
  }
}

/** Мэдэгдлийн үр дүнг багшид ойлгомжтой нэг өгүүлбэр болгоно. */
export function remindResultText(r: RemindResult): string {
  if (!r.ok) return r.error ?? "Мэдэгдэл илгээж чадсангүй.";
  if (!r.configured) {
    return "Утасны мэдэгдэл одоогоор тохируулагдаагүй. Бичвэрийг хуулж чатаар илгээнэ үү.";
  }
  if (r.targets === 0) return "Мэдэгдэл авах сурагч алга.";
  if (r.reached === 0) {
    return `${r.targets} сурагчийн хэн нь ч утсандаа мэдэгдэл асаагаагүй байна. Бичвэрийг хуулж чатаар илгээнэ үү.`;
  }
  if (r.reached < r.targets) {
    return `${r.reached} сурагчийн утсанд мэдэгдэл очлоо. Үлдсэн ${r.targets - r.reached} нь мэдэгдэл асаагаагүй — тэдэнд бичвэр хуулж илгээнэ үү.`;
  }
  return `Бүх ${r.reached} сурагчийн утсанд мэдэгдэл очлоо ✓`;
}

/* ------------------------------------------------------------------ */
/* Эцэг эхийн холбоос                                                   */
/* ------------------------------------------------------------------ */

export type ReportLinkResult = { token: string | null; missing: boolean; error: string | null };

export async function getOrCreateReportLink(
  classroomId: string,
  studentUserId: string
): Promise<ReportLinkResult> {
  if (!hasSupabaseConfig || !supabase) return { token: null, missing: false, error: "Тохиргоо алга." };
  const existing = await supabase
    .from("student_report_links")
    .select("token")
    .eq("classroom_id", classroomId)
    .eq("student_user_id", studentUserId)
    .maybeSingle();
  if (existing.error && MISSING.test(`${existing.error.code} ${existing.error.message}`)) {
    return { token: null, missing: true, error: null };
  }
  if (existing.data?.token) return { token: String(existing.data.token), missing: false, error: null };
  const created = await supabase
    .from("student_report_links")
    .insert({ classroom_id: classroomId, student_user_id: studentUserId })
    .select("token")
    .single();
  if (created.error) {
    return {
      token: null,
      missing: MISSING.test(`${created.error.code} ${created.error.message}`),
      error: created.error.message,
    };
  }
  return { token: String(created.data.token), missing: false, error: null };
}

/* ------------------------------------------------------------------ */
/* Давтагдах даалгавар                                                  */
/* ------------------------------------------------------------------ */

export type AssignmentSchedule = {
  id: string;
  classroomId: string;
  classroomName: string | null;
  lessonIds: string[];
  lessonTitles: string[];
  assignmentType: string;
  instructions: string | null;
  nextIndex: number;
  nextRunOn: string;
  intervalDays: number;
  dueDays: number;
  active: boolean;
};

function mapSchedule(r: Record<string, unknown>): AssignmentSchedule {
  return {
    id: String(r.id),
    classroomId: String(r.classroom_id),
    classroomName: (r.classrooms as { name?: string } | null)?.name ?? null,
    lessonIds: ((r.lesson_ids ?? []) as string[]).map(String),
    lessonTitles: ((r.lesson_titles ?? []) as string[]).map(String),
    assignmentType: String(r.assignment_type ?? "full_lesson"),
    instructions: r.instructions ? String(r.instructions) : null,
    nextIndex: Number(r.next_index ?? 0),
    nextRunOn: String(r.next_run_on ?? ""),
    intervalDays: Number(r.interval_days ?? 7),
    dueDays: Number(r.due_days ?? 7),
    active: Boolean(r.active),
  };
}

function localDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function createAssignmentSchedule(input: {
  classroomId: string;
  lessonIds: string[];
  lessonTitles: string[];
  assignmentType: string;
  instructions?: string;
  /** Эхний автомат даалгавар хэд хоногийн дараа гарах (ихэвчлэн 7). */
  firstInDays: number;
  intervalDays: number;
  dueDays: number;
}): Promise<{ ok: boolean; missing: boolean; error: string | null }> {
  if (!hasSupabaseConfig || !supabase) return { ok: false, missing: false, error: "Тохиргоо алга." };
  const { error } = await supabase.from("assignment_schedules").insert({
    classroom_id: input.classroomId,
    lesson_ids: input.lessonIds,
    lesson_titles: input.lessonTitles,
    assignment_type: input.assignmentType,
    instructions: input.instructions?.trim() || null,
    next_index: 0,
    next_run_on: localDate(input.firstInDays),
    interval_days: input.intervalDays,
    due_days: input.dueDays,
  });
  if (error) {
    return {
      ok: false,
      missing: MISSING.test(`${error.code} ${error.message}`),
      error: error.message,
    };
  }
  return { ok: true, missing: false, error: null };
}

export async function listAssignmentSchedules(): Promise<AssignmentSchedule[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  const { data, error } = await supabase
    .from("assignment_schedules")
    .select("*, classrooms(name)")
    .eq("active", true)
    .order("next_run_on", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapSchedule);
}

export async function stopAssignmentSchedule(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("assignment_schedules")
    .update({ active: false })
    .eq("id", id);
  return !error;
}

const TYPE_TITLE: Record<string, string> = {
  full_lesson: "хичээлийг бүтнээр хийх",
  vocabulary: "үгсийг цээжлэх",
  quiz: "дасгалыг ажиллах",
  review: "давтах",
  watch: "бичлэгийг үзэх",
};

/**
 * Хугацаа нь болсон давтагдах даалгавруудыг үүсгэнэ. Багш ажлын талбараа нээх
 * бүрт дуудагдана. Давхар үүсгэхээс сэргийлж ЭХЛЭЭД дараагийн дугаар руу
 * шилжүүлээд (next_index таарч байвал л), амжилттай бол даалгаврыг үүсгэнэ.
 * Буцаах утга: шинээр үүссэн даалгаврын тоо.
 */
export async function runDueAssignmentSchedules(): Promise<number> {
  if (!hasSupabaseConfig || !supabase) return 0;
  const today = localDate(0);
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return 0;
  const { data, error } = await supabase
    .from("assignment_schedules")
    .select("*")
    .eq("active", true)
    .eq("created_by", uid)
    .lte("next_run_on", today)
    .limit(20);
  if (error || !data) return 0;

  let created = 0;
  for (const row of data as Record<string, unknown>[]) {
    const s = mapSchedule(row);
    const lessonId = s.lessonIds[s.nextIndex];
    const isLast = s.nextIndex >= s.lessonIds.length - 1;
    // Олон долоо хоног нээгээгүй байсан ч нэг удаад нэг л хичээл өгнө —
    // сурагчид хэд хэдэн даалгавар нэг дор овоорохгүй.
    const { data: claimed } = await supabase
      .from("assignment_schedules")
      .update({
        next_index: s.nextIndex + 1,
        next_run_on: addDays(today, s.intervalDays),
        active: !isLast && Boolean(lessonId),
      })
      .eq("id", s.id)
      .eq("next_index", s.nextIndex)
      .select("id");
    if (!claimed || claimed.length === 0 || !lessonId) continue;
    const title = `${s.lessonTitles[s.nextIndex] ?? lessonId} — ${TYPE_TITLE[s.assignmentType] ?? "даалгавар"}`;
    const res = await createAssignment({
      classroomId: s.classroomId,
      lessonId,
      assignmentType: s.assignmentType,
      title,
      instructions: s.instructions ?? undefined,
      dueDate: addDays(today, s.dueDays),
    });
    if (res.data) created += 1;
  }
  return created;
}
