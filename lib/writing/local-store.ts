"use client";

/**
 * «Бичих дэвтэр» — зочин / офлайн хадгалалт (localStorage["buunduu-writing-lists-v1"]).
 * Supabase хувилбартай ижил хэлбэр; нэгтгэх/sync хийхгүй — нэвтэрсэн бол сервер,
 * үгүй бол энд.
 */
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
  type WritingList,
  type WritingListInput,
  type WritingListPatch,
  type WritingListSummary,
  type WritingProgressMap,
} from "@/lib/writing/types";

export const WRITING_LOCAL_KEY = "buunduu-writing-lists-v1";

type LocalStore = {
  lists: Record<string, WritingList>;
  /** listId → ch → ахиц */
  progress: Record<string, WritingProgressMap>;
};

function emptyStore(): LocalStore {
  return { lists: {}, progress: {} };
}

function readStore(): LocalStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(WRITING_LOCAL_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      lists: parsed?.lists && typeof parsed.lists === "object" ? parsed.lists : {},
      progress:
        parsed?.progress && typeof parsed.progress === "object" ? parsed.progress : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: LocalStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WRITING_LOCAL_KEY, JSON.stringify(store));
  } catch {
    // Storage дүүрсэн — чимээгүй үргэлжилнэ.
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toSummary(list: WritingList, progress: WritingProgressMap): WritingListSummary {
  const { items: _items, ...rest } = list;
  void _items;
  return { ...rest, ...summarizeProgress(list, progress) };
}

export function localListLists(): WritingListSummary[] {
  const store = readStore();
  return Object.values(store.lists)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((list) => toSummary(list, store.progress[list.id] ?? {}));
}

export function localGetList(id: string): WritingList | null {
  const store = readStore();
  return store.lists[id] ?? null;
}

export function localCreateList(input: WritingListInput): WritingList {
  const store = readStore();
  const now = new Date().toISOString();
  const list: WritingList = {
    id: newId(),
    title: input.title.trim() || "Дэвтэр",
    kind: input.kind,
    ownerUserId: null,
    classroomId: input.classroomId ?? null,
    assignmentId: input.assignmentId ?? null,
    repsTrace: clampReps(input.repsTrace, REPS_TRACE_MIN, REPS_TRACE_MAX, REPS_TRACE_DEFAULT),
    repsMemory: clampReps(input.repsMemory, REPS_MEMORY_MIN, REPS_MEMORY_MAX, REPS_MEMORY_DEFAULT),
    dueDate: input.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
    items: dedupeItems(input.items),
  };
  store.lists[list.id] = list;
  writeStore(store);
  return list;
}

export function localUpdateList(id: string, patch: WritingListPatch): WritingList | null {
  const store = readStore();
  const prev = store.lists[id];
  if (!prev) return null;
  const next: WritingList = {
    ...prev,
    title: patch.title !== undefined ? patch.title.trim() || prev.title : prev.title,
    repsTrace:
      patch.repsTrace !== undefined
        ? clampReps(patch.repsTrace, REPS_TRACE_MIN, REPS_TRACE_MAX, prev.repsTrace)
        : prev.repsTrace,
    repsMemory:
      patch.repsMemory !== undefined
        ? clampReps(patch.repsMemory, REPS_MEMORY_MIN, REPS_MEMORY_MAX, prev.repsMemory)
        : prev.repsMemory,
    dueDate: patch.dueDate !== undefined ? patch.dueDate : prev.dueDate,
    assignmentId: patch.assignmentId !== undefined ? patch.assignmentId : prev.assignmentId,
    items: patch.items !== undefined ? dedupeItems(patch.items) : prev.items,
    updatedAt: new Date().toISOString(),
  };
  store.lists[id] = next;
  // Хасагдсан ханзны ахицыг цэвэрлэнэ.
  if (patch.items !== undefined && store.progress[id]) {
    const keep = new Set(next.items.map((i) => i.ch));
    for (const ch of Object.keys(store.progress[id]!)) {
      if (!keep.has(ch)) delete store.progress[id]![ch];
    }
  }
  writeStore(store);
  return next;
}

export function localDeleteList(id: string): void {
  const store = readStore();
  delete store.lists[id];
  delete store.progress[id];
  writeStore(store);
}

export function localGetProgress(listId: string): WritingProgressMap {
  return readStore().progress[listId] ?? {};
}

export function localSaveProgress(listId: string, rows: WritingCharProgress[]): void {
  if (rows.length === 0) return;
  const store = readStore();
  const map = store.progress[listId] ?? {};
  for (const row of rows) map[row.ch] = row;
  store.progress[listId] = map;
  writeStore(store);
}

/** Ханз давхардвал эхнийхийг үлдээнэ; ханз биш тэмдэгтийг хаяна. */
export function dedupeItems<T extends { ch: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const ch = (item.ch ?? "").trim();
    if (!ch || seen.has(ch)) continue;
    seen.add(ch);
    out.push({ ...item, ch });
  }
  return out;
}
