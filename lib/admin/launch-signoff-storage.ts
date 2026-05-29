import {
  SIGNOFF_CHECKLIST,
  SIGNOFF_SUMMARY_CARDS,
  SIGNOFF_STORAGE_KEY,
  defaultSignoffCardState,
  defaultSignoffDecision,
  defaultSignoffItemState,
  defaultSignoffMeta,
  mergeSignoffCards,
  mergeSignoffItems,
  type SignoffCardState,
  type SignoffCheckItem,
  type SignoffDecisionState,
  type SignoffItemState,
  type SignoffMetaState,
} from "@/lib/admin/launch-signoff-data";

export type LaunchSignoffStorage = {
  version: 1;
  cards: Record<string, SignoffCardState>;
  items: Record<string, SignoffItemState>;
  decision: SignoffDecisionState;
  meta: SignoffMetaState;
  savedAt?: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emptyStorage(): LaunchSignoffStorage {
  return {
    version: 1,
    cards: {},
    items: {},
    decision: defaultSignoffDecision(),
    meta: defaultSignoffMeta(),
  };
}

export function loadLaunchSignoffStorage(): LaunchSignoffStorage {
  if (!isBrowser()) return emptyStorage();

  try {
    const raw = window.localStorage.getItem(SIGNOFF_STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as LaunchSignoffStorage;
    if (parsed?.version !== 1) return emptyStorage();
    return {
      version: 1,
      cards: parsed.cards ?? {},
      items: parsed.items ?? {},
      decision: parsed.decision ?? defaultSignoffDecision(),
      meta: { ...defaultSignoffMeta(), ...parsed.meta },
      savedAt: parsed.savedAt,
    };
  } catch {
    return emptyStorage();
  }
}

export function saveLaunchSignoffStorage(
  payload: Omit<LaunchSignoffStorage, "version" | "savedAt">
): LaunchSignoffStorage {
  const stored: LaunchSignoffStorage = {
    version: 1,
    ...payload,
    savedAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    window.localStorage.setItem(SIGNOFF_STORAGE_KEY, JSON.stringify(stored));
  }
  return stored;
}

export function resetLaunchSignoffStorage(): void {
  if (isBrowser()) {
    window.localStorage.removeItem(SIGNOFF_STORAGE_KEY);
  }
}

export function initLaunchSignoffData(): {
  items: SignoffCheckItem[];
  cards: SignoffCardState[];
  decision: SignoffDecisionState;
  meta: SignoffMetaState;
  savedAt: string | null;
} {
  const storage = loadLaunchSignoffStorage();
  if (
    Object.keys(storage.items).length === 0 &&
    Object.keys(storage.cards).length === 0
  ) {
    const items: Record<string, SignoffItemState> = {};
    for (const def of SIGNOFF_CHECKLIST) {
      items[def.id] = defaultSignoffItemState(def.id);
    }
    const cards: Record<string, SignoffCardState> = {};
    for (const def of SIGNOFF_SUMMARY_CARDS) {
      cards[def.id] = defaultSignoffCardState(def.id);
    }
    const saved = saveLaunchSignoffStorage({
      items,
      cards,
      decision: defaultSignoffDecision(),
      meta: defaultSignoffMeta(),
    });
    return {
      items: mergeSignoffItems(items),
      cards: mergeSignoffCards(cards),
      decision: saved.decision,
      meta: saved.meta,
      savedAt: saved.savedAt ?? null,
    };
  }

  return {
    items: mergeSignoffItems(storage.items),
    cards: mergeSignoffCards(storage.cards),
    decision: storage.decision ?? defaultSignoffDecision(),
    meta: { ...defaultSignoffMeta(), ...storage.meta },
    savedAt: storage.savedAt ?? null,
  };
}

export function persistLaunchSignoffData(
  items: SignoffCheckItem[],
  cards: SignoffCardState[],
  decision: SignoffDecisionState,
  meta: SignoffMetaState
): LaunchSignoffStorage {
  const itemMap: Record<string, SignoffItemState> = {};
  for (const item of items) {
    itemMap[item.id] = {
      id: item.id,
      status: item.status,
      notes: item.notes,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
  }
  const cardMap: Record<string, SignoffCardState> = {};
  for (const card of cards) {
    cardMap[card.id] = {
      id: card.id,
      status: card.status,
      updatedAt: card.updatedAt || new Date().toISOString(),
    };
  }
  return saveLaunchSignoffStorage({
    items: itemMap,
    cards: cardMap,
    decision,
    meta,
  });
}
