import {
  LAUNCH_SMOKE_CHECKLIST,
  LAUNCH_STATUS_CARDS,
  LAUNCH_STORAGE_KEY,
  defaultCardState,
  defaultDecision,
  defaultItemState,
  mergeLaunchCards,
  mergeLaunchItems,
  type LaunchCardState,
  type LaunchCheckItem,
  type LaunchDecisionState,
  type LaunchItemState,
} from "@/lib/admin/launch-candidate-data";

export type LaunchCandidateStorage = {
  version: 1;
  cards: Record<string, LaunchCardState>;
  items: Record<string, LaunchItemState>;
  decision: LaunchDecisionState;
  savedAt?: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emptyStorage(): LaunchCandidateStorage {
  return {
    version: 1,
    cards: {},
    items: {},
    decision: defaultDecision(),
  };
}

export function loadLaunchCandidateStorage(): LaunchCandidateStorage {
  if (!isBrowser()) return emptyStorage();

  try {
    const raw = window.localStorage.getItem(LAUNCH_STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as LaunchCandidateStorage;
    if (parsed?.version !== 1) return emptyStorage();
    return {
      version: 1,
      cards: parsed.cards ?? {},
      items: parsed.items ?? {},
      decision: parsed.decision ?? defaultDecision(),
      savedAt: parsed.savedAt,
    };
  } catch {
    return emptyStorage();
  }
}

export function saveLaunchCandidateStorage(
  payload: Omit<LaunchCandidateStorage, "version" | "savedAt">
): LaunchCandidateStorage {
  const stored: LaunchCandidateStorage = {
    version: 1,
    ...payload,
    savedAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    window.localStorage.setItem(LAUNCH_STORAGE_KEY, JSON.stringify(stored));
  }
  return stored;
}

export function resetLaunchCandidateStorage(): void {
  if (isBrowser()) {
    window.localStorage.removeItem(LAUNCH_STORAGE_KEY);
  }
}

export function initLaunchCandidateData(): {
  items: LaunchCheckItem[];
  cards: LaunchCardState[];
  decision: LaunchDecisionState;
  savedAt: string | null;
} {
  const storage = loadLaunchCandidateStorage();
  if (
    Object.keys(storage.items).length === 0 &&
    Object.keys(storage.cards).length === 0
  ) {
    const items: Record<string, LaunchItemState> = {};
    for (const def of LAUNCH_SMOKE_CHECKLIST) {
      items[def.id] = defaultItemState(def.id);
    }
    const cards: Record<string, LaunchCardState> = {};
    for (const def of LAUNCH_STATUS_CARDS) {
      cards[def.id] = defaultCardState(def.id);
    }
    const saved = saveLaunchCandidateStorage({
      items,
      cards,
      decision: defaultDecision(),
    });
    return {
      items: mergeLaunchItems(items),
      cards: mergeLaunchCards(cards),
      decision: saved.decision,
      savedAt: saved.savedAt ?? null,
    };
  }

  return {
    items: mergeLaunchItems(storage.items),
    cards: mergeLaunchCards(storage.cards),
    decision: storage.decision ?? defaultDecision(),
    savedAt: storage.savedAt ?? null,
  };
}

export function persistLaunchCandidateData(
  items: LaunchCheckItem[],
  cards: LaunchCardState[],
  decision: LaunchDecisionState
): LaunchCandidateStorage {
  const itemMap: Record<string, LaunchItemState> = {};
  for (const item of items) {
    itemMap[item.id] = {
      id: item.id,
      status: item.status,
      notes: item.notes,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
  }
  const cardMap: Record<string, LaunchCardState> = {};
  for (const card of cards) {
    cardMap[card.id] = {
      id: card.id,
      status: card.status,
      updatedAt: card.updatedAt || new Date().toISOString(),
    };
  }
  return saveLaunchCandidateStorage({
    items: itemMap,
    cards: cardMap,
    decision,
  });
}
