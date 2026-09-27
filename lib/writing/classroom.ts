"use client";

/**
 * Багшийн бичих даалгавар (migration 067 + assignments).
 * writing_lists (kind = 'assignment', classroom_id) + assignments
 * (assignment_type = 'writing', lesson_id = 'writing:<listId>').
 */
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { createAssignment, deleteAssignment } from "@/lib/supabase/classrooms";
import {
  fetchItemsForLists,
  friendlyError,
  mapWritingListRow,
  type WritingStoreResult,
} from "@/lib/writing/store";
import {
  clampReps,
  REPS_MEMORY_DEFAULT,
  REPS_MEMORY_MAX,
  REPS_MEMORY_MIN,
  REPS_TRACE_DEFAULT,
  REPS_TRACE_MAX,
  REPS_TRACE_MIN,
  WRITING_ASSIGNMENT_PREFIX,
  type WritingItem,
  type WritingList,
} from "@/lib/writing/types";
import { dedupeItems } from "@/lib/writing/local-store";

export const WRITING_ASSIGNMENT_TYPE = "writing";

export type WritingHomeworkInput = {
  classroomId: string;
  title: string;
  items: WritingItem[];
  repsTrace: number;
  repsMemory: number;
  dueDate?: string | null;
  /** assignments.instructions — ханзнуудын текст. */
  instructions?: string;
};

export type WritingListProgressRow = {
  studentUserId: string;
  displayName: string;
  charsTotal: number;
  charsDone: number;
  cellsTotal: number;
  cellsDone: number;
  percent: number;
  lastAt: string | null;
};

function notConfigured<T>(): WritingStoreResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

/** Багш: бичих даалгавар үүсгэнэ (дэвтэр + ханз + assignments мөр). */
export async function createWritingHomework(
  input: WritingHomeworkInput
): Promise<WritingStoreResult<WritingList>> {
  if (!supabase) return notConfigured();
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { data: null, error: "Эхлээд нэвтэрнэ үү." };

  const items = dedupeItems(input.items);
  if (items.length === 0) return { data: null, error: "Ханз оруулна уу." };

  const { data, error } = await supabase
    .from("writing_lists")
    .insert({
      owner_user_id: userId,
      title: input.title.trim() || "Бичих даалгавар",
      kind: "assignment",
      classroom_id: input.classroomId,
      reps_trace: clampReps(input.repsTrace, REPS_TRACE_MIN, REPS_TRACE_MAX, REPS_TRACE_DEFAULT),
      reps_memory: clampReps(input.repsMemory, REPS_MEMORY_MIN, REPS_MEMORY_MAX, REPS_MEMORY_DEFAULT),
      due_date: input.dueDate || null,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: friendlyError(error.message) };
  const list = mapWritingListRow(data as Record<string, unknown>, items);

  const { error: itemsError } = await supabase.from("writing_list_items").insert(
    items.map((item, position) => ({
      list_id: list.id,
      position,
      ch: item.ch,
      word: item.word?.trim() || null,
      pinyin: item.pinyin?.trim() || null,
      meaning_mn: item.meaning_mn?.trim() || null,
    }))
  );
  if (itemsError) {
    await supabase.from("writing_lists").delete().eq("id", list.id);
    return { data: null, error: friendlyError(itemsError.message) };
  }

  const instructions =
    input.instructions?.trim() ||
    items.map((i) => i.word ?? i.ch).filter((v, idx, arr) => arr.indexOf(v) === idx).join(" ");

  const assignmentRes = await createAssignment({
    classroomId: input.classroomId,
    lessonId: `${WRITING_ASSIGNMENT_PREFIX}${list.id}`,
    assignmentType: WRITING_ASSIGNMENT_TYPE,
    title: list.title,
    instructions,
    dueDate: input.dueDate || undefined,
    resultMetadata: { source: "writing_list", writing_list_id: list.id },
  });
  if (assignmentRes.error || !assignmentRes.data) {
    await supabase.from("writing_lists").delete().eq("id", list.id);
    return { data: null, error: assignmentRes.error ?? "Даалгавар үүсгэж чадсангүй." };
  }

  const { error: linkError } = await supabase
    .from("writing_lists")
    .update({ assignment_id: assignmentRes.data.id })
    .eq("id", list.id);
  if (linkError) return { data: null, error: friendlyError(linkError.message) };

  list.assignmentId = assignmentRes.data.id;
  return { data: list, error: null };
}

/** Багш: энэ ангийн бичих даалгаврууд (шинэ нь эхэндээ). */
export async function getClassroomWritingLists(
  classroomId: string
): Promise<WritingStoreResult<WritingList[]>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("writing_lists")
    .select("*")
    .eq("classroom_id", classroomId)
    .eq("kind", "assignment")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: friendlyError(error.message) };
  const rows = (data ?? []) as Record<string, unknown>[];
  const itemsBy = await fetchItemsForLists(rows.map((r) => String(r.id)));
  return {
    data: rows.map((r) => mapWritingListRow(r, itemsBy.get(String(r.id)) ?? [])),
    error: null,
  };
}

/** Багш: дэвтрийн ахиц сурагч бүрээр (RPC writing_list_progress). */
export async function getWritingListProgress(
  listId: string
): Promise<WritingStoreResult<WritingListProgressRow[]>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase.rpc("writing_list_progress", { p_list_id: listId });
  if (error) return { data: null, error: friendlyError(error.message) };
  const rows = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
  return {
    data: rows.map((row) => ({
      studentUserId: String(row.student_user_id),
      displayName: row.display_name ? String(row.display_name) : "—",
      charsTotal: Number(row.chars_total ?? 0),
      charsDone: Number(row.chars_done ?? 0),
      cellsTotal: Number(row.cells_total ?? 0),
      cellsDone: Number(row.cells_done ?? 0),
      percent: Number(row.percent ?? 0),
      lastAt: row.last_at ? String(row.last_at) : null,
    })),
    error: null,
  };
}

/** Багш: бичих даалгаврыг (дэвтэр + assignments мөр) устгана. */
export async function deleteWritingHomework(
  list: Pick<WritingList, "id" | "assignmentId">
): Promise<WritingStoreResult<null>> {
  if (!supabase) return notConfigured();
  if (list.assignmentId) {
    const res = await deleteAssignment(list.assignmentId);
    if (res.error) return { data: null, error: res.error };
  }
  const { error } = await supabase.from("writing_lists").delete().eq("id", list.id);
  if (error) return { data: null, error: friendlyError(error.message) };
  return { data: null, error: null };
}
