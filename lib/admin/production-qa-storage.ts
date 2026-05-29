import {
  QA_CHECKLIST,
  QA_STORAGE_KEY,
  defaultItemState,
  mergeChecklistWithState,
  type QaCheckItem,
  type QaCheckItemState,
  type QaCheckStatus,
} from "@/lib/admin/production-qa-data";

export type ProductionQaStorage = {
  version: 1;
  items: Record<string, QaCheckItemState>;
  savedAt?: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadProductionQaStorage(): ProductionQaStorage {
  if (!isBrowser()) {
    return { version: 1, items: {} };
  }

  try {
    const raw = window.localStorage.getItem(QA_STORAGE_KEY);
    if (!raw) {
      return { version: 1, items: {} };
    }
    const parsed = JSON.parse(raw) as ProductionQaStorage;
    if (parsed?.version !== 1 || typeof parsed.items !== "object") {
      return { version: 1, items: {} };
    }
    return parsed;
  } catch {
    return { version: 1, items: {} };
  }
}

export function saveProductionQaStorage(
  items: Record<string, QaCheckItemState>
): ProductionQaStorage {
  const payload: ProductionQaStorage = {
    version: 1,
    items,
    savedAt: new Date().toISOString(),
  };

  if (isBrowser()) {
    window.localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(payload));
  }

  return payload;
}

export function resetProductionQaStorage(): void {
  if (isBrowser()) {
    window.localStorage.removeItem(QA_STORAGE_KEY);
  }
}

export function loadProductionQaItems(): QaCheckItem[] {
  const storage = loadProductionQaStorage();
  return mergeChecklistWithState(storage.items);
}

export function updateProductionQaItem(
  id: string,
  patch: Partial<Pick<QaCheckItemState, "status" | "notes">>
): QaCheckItem[] {
  const storage = loadProductionQaStorage();
  const current = storage.items[id] ?? defaultItemState(id);
  const next: QaCheckItemState = {
    ...current,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  const items = { ...storage.items, [id]: next };
  saveProductionQaStorage(items);
  return mergeChecklistWithState(items);
}

export function saveAllProductionQaItems(
  itemStates: QaCheckItem[]
): ProductionQaStorage {
  const items: Record<string, QaCheckItemState> = {};
  for (const item of itemStates) {
    items[item.id] = {
      id: item.id,
      status: item.status,
      notes: item.notes,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
  }
  return saveProductionQaStorage(items);
}

export function initProductionQaItems(): QaCheckItem[] {
  const storage = loadProductionQaStorage();
  if (Object.keys(storage.items).length === 0) {
    const items: Record<string, QaCheckItemState> = {};
    for (const def of QA_CHECKLIST) {
      items[def.id] = defaultItemState(def.id);
    }
    saveProductionQaStorage(items);
    return mergeChecklistWithState(items);
  }
  return mergeChecklistWithState(storage.items);
}

export function isValidQaStatus(value: string): value is QaCheckStatus {
  return (
    value === "not_checked" ||
    value === "pass" ||
    value === "warning" ||
    value === "fail"
  );
}
