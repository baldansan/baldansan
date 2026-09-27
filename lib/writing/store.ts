"use client";

/**
 * «Бичих дэвтэр» — нэг async API: нэвтэрсэн бол Supabase (migration 067),
 * үгүй бол localStorage. Нэгтгэх/sync хийхгүй.
 */
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import {
  dedupeItems,
  localCreateList,
  localDeleteList,
  localGetList,
  localGetProgress,
  localListLists,
  localSaveProgress,
  localUpdateList,
} from "@/lib/writing/local-store";
import {
  clampReps,
  REPS_MEMORY_DEFAULT,
  REPS_MEMORY_MAX,
  REPS_MEMORY_MIN,
  REPS_TRACE_DEFAULT,
  REPS_TRACE_MAX,
  REPS_TRACE_MIN,
  summarizeProgress,
  type WritingCharProgress,
  type WritingItem,
  type WritingList,
  type WritingListInput,
  type WritingListKind,
  type WritingListPatch,
  type WritingListSummary,
  type WritingProgressMap,
} from "@/lib/writing/types";

export type WritingStoreResult<T> = { data: T | null; error: string | null };

async function resolveUserId(): Promise<string | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  try {
    const { userId } = await getAuthenticatedUserId();
    return userId ?? null;
  } catch {
    return null;
  }
}

/** Хэрэглэгч нэвтэрсэн (→ сервер) эсэх. UI-д «локал» тэмдэглэгээ харуулахад. */
export async function isWritingServerMode(): Promise<boolean> {
  return (await resolveUserId()) != null;
}

// --- Мэп ---

export function mapWritingListRow(
  row: Record<string, unknown>,
  items: WritingItem[] = []
): WritingList {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    kind: (String(row.kind ?? "own") as WritingListKind) ?? "own",
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
    classroomId: row.classroom_id ? String(row.classroom_id) : null,
    assignmentId: row.assignment_id ? String(row.assignment_id) : null,
    repsTrace: clampReps(row.reps_trace, REPS_TRACE_MIN, REPS_TRACE_MAX, REPS_TRACE_DEFAULT),
    repsMemory: clampReps(row.reps_memory, REPS_MEMORY_MIN, REPS_MEMORY_MAX, REPS_MEMORY_DEFAULT),
    dueDate: row.due_date ? String(row.due_date) : null,
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
    items,
  };
}

export function mapWritingItemRow(row: Record<string, unknown>): WritingItem {
  return {
    ch: String(row.ch ?? ""),
    word: row.word ? String(row.word) : null,
    pinyin: row.pinyin ? String(row.pinyin) : null,
    meaning_mn: row.meaning_mn ? String(row.meaning_mn) : null,
  };
}

function mapProgressRow(row: Record<string, unknown>): WritingCharProgress {
  return {
    ch: String(row.ch ?? ""),
    traceDone: Number(row.trace_done ?? 0),
    memoryDone: Number(row.memory_done ?? 0),
    mistakes: Number(row.mistakes ?? 0),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

function itemsToRows(listId: string, items: WritingItem[]) {
  return dedupeItems(items).map((item, position) => ({
    list_id: listId,
    position,
    ch: item.ch,
    word: item.word?.trim() || null,
    pinyin: item.pinyin?.trim() || null,
    meaning_mn: item.meaning_mn?.trim() || null,
  }));
}

/** Хэд хэдэн дэвтрийн ханзнуудыг нэг асуулгаар татна. */
export async function fetchItemsForLists(
  listIds: string[]
): Promise<Map<string, WritingItem[]>> {
  const map = new Map<string, WritingItem[]>();
  if (!supabase || listIds.length === 0) return map;
  const { data } = await supabase
    .from("writing_list_items")
    .select("list_id, position, ch, word, pinyin, meaning_mn")
    .in("list_id", listIds)
    .order("position", { ascending: true });
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const id = String(row.list_id);
    const arr = map.get(id) ?? [];
    arr.push(mapWritingItemRow(row));
    map.set(id, arr);
  }
  return map;
}

/** Хэрэглэгчийн хэд хэдэн дэвтрийн ахицыг нэг асуулгаар татна. */
export async function fetchProgressForLists(
  userId: string,
  listIds: string[]
): Promise<Map<string, WritingProgressMap>> {
  const map = new Map<string, WritingProgressMap>();
  if (!supabase || listIds.length === 0) return map;
  const { data } = await supabase
    .from("writing_progress")
    .select("*")
    .eq("user_id", userId)
    .in("list_id", listIds);
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const id = String(row.list_id);
    const m = map.get(id) ?? {};
    const p = mapProgressRow(row);
    m[p.ch] = p;
    map.set(id, m);
  }
  return map;
}

export function toListSummaries(
  lists: WritingList[],
  progressByList: Map<string, WritingProgressMap>
): WritingListSummary[] {
  return lists.map((list) => {
    const { items: _items, ...rest } = list;
    void _items;
    return { ...rest, ...summarizeProgress(list, progressByList.get(list.id) ?? {}) };
  });
}

// --- Нийтийн API ---

/** Миний дэвтрүүд (ангийн даалгаврын дэвтэр орохгүй). */
export async function listLists(): Promise<WritingStoreResult<WritingListSummary[]>> {
  const userId = await resolveUserId();
  if (!userId || !supabase) return { data: localListLists(), error: null };

  const { data, error } = await supabase
    .from("writing_lists")
    .select("*")
    .eq("owner_user_id", userId)
    .neq("kind", "assignment")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: friendlyError(error.message) };

  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = rows.map((r) => String(r.id));
  const [itemsBy, progressBy] = await Promise.all([
    fetchItemsForLists(ids),
    fetchProgressForLists(userId, ids),
  ]);
  const lists = rows.map((r) => mapWritingListRow(r, itemsBy.get(String(r.id)) ?? []));
  return { data: toListSummaries(lists, progressBy), error: null };
}

/** Ангийн даалгаврын дэвтрүүд — зөвхөн нэвтэрсэн сурагчид; зочинд хоосон. */
export async function listAssignmentLists(): Promise<
  WritingStoreResult<WritingListSummary[]>
> {
  const userId = await resolveUserId();
  if (!userId || !supabase) return { data: [], error: null };

  const { data: enrollments, error: enrollError } = await supabase
    .from("classroom_students")
    .select("classroom_id, status")
    .eq("student_user_id", userId);
  if (enrollError) return { data: [], error: null };
  const classroomIds = [
    ...new Set(
      (enrollments ?? [])
        .filter((e) => e.status !== "removed")
        .map((e) => String(e.classroom_id))
    ),
  ];
  if (classroomIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("writing_lists")
    .select("*")
    .eq("kind", "assignment")
    .in("classroom_id", classroomIds)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: friendlyError(error.message) };

  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = rows.map((r) => String(r.id));
  const [itemsBy, progressBy] = await Promise.all([
    fetchItemsForLists(ids),
    fetchProgressForLists(userId, ids),
  ]);
  const lists = rows.map((r) => mapWritingListRow(r, itemsBy.get(String(r.id)) ?? []));
  return { data: toListSummaries(lists, progressBy), error: null };
}

export async function getList(id: string): Promise<WritingStoreResult<WritingList>> {
  const userId = await resolveUserId();
  if (!userId || !supabase) {
    const local = localGetList(id);
    return { data: local, error: local ? null : "Дэвтэр олдсонгүй." };
  }
  const { data, error } = await supabase
    .from("writing_lists")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error: friendlyError(error.message) };
  if (!data) {
    // Нэвтэрсэн ч локал дэвтэр байж болно (нэвтрэхээс өмнө үүсгэсэн).
    const local = localGetList(id);
    return { data: local, error: local ? null : "Дэвтэр олдсонгүй." };
  }
  const itemsBy = await fetchItemsForLists([id]);
  return { data: mapWritingListRow(data as Record<string, unknown>, itemsBy.get(id) ?? []), error: null };
}

export async function createList(
  input: WritingListInput
): Promise<WritingStoreResult<WritingList>> {
  const userId = await resolveUserId();
  if (!userId || !supabase) return { data: localCreateList(input), error: null };

  const { data, error } = await supabase
    .from("writing_lists")
    .insert({
      owner_user_id: userId,
      title: input.title.trim() || "Дэвтэр",
      kind: input.kind,
      classroom_id: input.classroomId ?? null,
      assignment_id: input.assignmentId ?? null,
      reps_trace: clampReps(input.repsTrace, REPS_TRACE_MIN, REPS_TRACE_MAX, REPS_TRACE_DEFAULT),
      reps_memory: clampReps(input.repsMemory, REPS_MEMORY_MIN, REPS_MEMORY_MAX, REPS_MEMORY_DEFAULT),
      due_date: input.dueDate ?? null,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: friendlyError(error.message) };

  const list = mapWritingListRow(data as Record<string, unknown>);
  const rows = itemsToRows(list.id, input.items);
  if (rows.length > 0) {
    const { error: itemsError } = await supabase.from("writing_list_items").insert(rows);
    if (itemsError) {
      await supabase.from("writing_lists").delete().eq("id", list.id);
      return { data: null, error: friendlyError(itemsError.message) };
    }
  }
  list.items = rows.map((r) => ({
    ch: r.ch,
    word: r.word,
    pinyin: r.pinyin,
    meaning_mn: r.meaning_mn,
  }));
  return { data: list, error: null };
}

export async function updateList(
  id: string,
  patch: WritingListPatch
): Promise<WritingStoreResult<WritingList>> {
  const userId = await resolveUserId();
  if (!userId || !supabase || localGetList(id)) {
    const local = localUpdateList(id, patch);
    return { data: local, error: local ? null : "Дэвтэр олдсонгүй." };
  }

  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title.trim() || "Дэвтэр";
  if (patch.repsTrace !== undefined)
    row.reps_trace = clampReps(patch.repsTrace, REPS_TRACE_MIN, REPS_TRACE_MAX, REPS_TRACE_DEFAULT);
  if (patch.repsMemory !== undefined)
    row.reps_memory = clampReps(patch.repsMemory, REPS_MEMORY_MIN, REPS_MEMORY_MAX, REPS_MEMORY_DEFAULT);
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.assignmentId !== undefined) row.assignment_id = patch.assignmentId;

  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("writing_lists").update(row).eq("id", id);
    if (error) return { data: null, error: friendlyError(error.message) };
  }

  if (patch.items !== undefined) {
    // Энгийн арга: бүх ханзыг дахин бичнэ (ахиц нь ханзаар хадгалагддаг тул хэвээр).
    const { error: delError } = await supabase.from("writing_list_items").delete().eq("list_id", id);
    if (delError) return { data: null, error: friendlyError(delError.message) };
    const rows = itemsToRows(id, patch.items);
    if (rows.length > 0) {
      const { error: insError } = await supabase.from("writing_list_items").insert(rows);
      if (insError) return { data: null, error: friendlyError(insError.message) };
    }
    const keep = rows.map((r) => r.ch);
    if (keep.length > 0) {
      await supabase
        .from("writing_progress")
        .delete()
        .eq("list_id", id)
        .eq("user_id", userId)
        .not("ch", "in", `(${keep.map((c) => `"${c}"`).join(",")})`);
    }
  }

  return getList(id);
}

export async function deleteList(id: string): Promise<WritingStoreResult<null>> {
  const userId = await resolveUserId();
  if (!userId || !supabase || localGetList(id)) {
    localDeleteList(id);
    return { data: null, error: null };
  }
  const { error } = await supabase.from("writing_lists").delete().eq("id", id);
  if (error) return { data: null, error: friendlyError(error.message) };
  return { data: null, error: null };
}

export async function getProgress(listId: string): Promise<WritingProgressMap> {
  const userId = await resolveUserId();
  if (!userId || !supabase || localGetList(listId)) return localGetProgress(listId);
  const by = await fetchProgressForLists(userId, [listId]);
  return by.get(listId) ?? {};
}

export async function saveProgress(
  listId: string,
  rows: WritingCharProgress[]
): Promise<WritingStoreResult<null>> {
  if (rows.length === 0) return { data: null, error: null };
  const userId = await resolveUserId();
  if (!userId || !supabase || localGetList(listId)) {
    localSaveProgress(listId, rows);
    return { data: null, error: null };
  }
  const { error } = await supabase.from("writing_progress").upsert(
    rows.map((r) => ({
      user_id: userId,
      list_id: listId,
      ch: r.ch,
      trace_done: r.traceDone,
      memory_done: r.memoryDone,
      mistakes: r.mistakes,
      completed_at: r.completedAt,
    })),
    { onConflict: "user_id,list_id,ch" }
  );
  if (error) {
    // Сервер алдвал локалд хадгалж алдахгүй.
    localSaveProgress(listId, rows);
    return { data: null, error: friendlyError(error.message) };
  }
  return { data: null, error: null };
}

export function friendlyError(message: string): string {
  if (/writing_lists|writing_list_items|writing_progress|writing_list_progress/.test(message)) {
    return "Бичих дэвтэр серверт хараахан идэвхжээгүй — Supabase дээр 067 migration-ийг ажиллуулна уу.";
  }
  return message;
}
