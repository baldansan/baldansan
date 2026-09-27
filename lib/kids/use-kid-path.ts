"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getKidModeChildId, getKidModeProfile } from "@/lib/kids/client";
import {
  KID_PATH_EVENT,
  buildKidPathAutoCtx,
  emptyKidPathState,
  getKidPathState,
  kidPathSummary,
  type KidPathAutoCtx,
  type KidPathState,
  type KidPathSummary,
} from "@/lib/kids/path";
import { localGetList, localGetProgress } from "@/lib/writing/local-store";
import type { WritingList, WritingProgressMap } from "@/lib/writing/types";

/* ---- Гадаад store: localStorage өөрчлөгдөх бүрд хувилбар нэмэгдэнэ ---- */

let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
  version += 1;
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1) {
    window.addEventListener("storage", bump);
    window.addEventListener(KID_PATH_EVENT, bump);
    window.addEventListener("focus", bump);
    window.addEventListener("pageshow", bump);
    document.addEventListener("visibilitychange", bump);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      window.removeEventListener("storage", bump);
      window.removeEventListener(KID_PATH_EVENT, bump);
      window.removeEventListener("focus", bump);
      window.removeEventListener("pageshow", bump);
      document.removeEventListener("visibilitychange", bump);
    }
  };
}

/** Сервер дээр -1 (hydration-оос өмнө), клиент дээр 0, 1, 2… */
export function useKidPathVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => -1
  );
}

/** Гараар дахин уншуулах (бусад хуудаснаас буцаж ирэхэд г.м.) */
export function refreshKidPath(): void {
  bump();
}

export type KidPathView = {
  /** Хүүхдийн id эсвэл "guest" (client дээр л мэдэгдэнэ; hydration-оос өмнө null) */
  kidId: string | null;
  kidName: string;
  kidAvatar: string;
  kidMode: boolean;
  state: KidPathState;
  ctx: KidPathAutoCtx;
  summary: KidPathSummary;
  writing: { list: WritingList | null; progress: WritingProgressMap };
  refresh: () => void;
};

/** Одоогийн хүүхдийн (эсвэл өгсөн id-тай хүүхдийн) 7 хоногийн ахиц — localStorage-оос. */
export function useKidPath(forKidId?: string): KidPathView {
  const v = useKidPathVersion();
  const refresh = useCallback(() => bump(), []);

  return useMemo(() => {
    // v < 0 — сервер/hydration: localStorage хараахан уншихгүй
    const mounted = v >= 0;
    const modeId = mounted ? getKidModeChildId() : null;
    const profile = modeId ? getKidModeProfile() : null;
    const kidId = mounted ? (forKidId ?? modeId ?? "guest") : null;
    const state = kidId ? getKidPathState(kidId) : emptyKidPathState();
    const list = kidId && state.writingListId ? localGetList(state.writingListId) : null;
    const progress = list ? localGetProgress(list.id) : {};
    const writing = { list, progress };
    const ctx = buildKidPathAutoCtx(state, writing);
    return {
      kidId,
      kidName: profile?.displayName ?? "",
      kidAvatar: profile?.avatar ?? "🧒",
      kidMode: Boolean(modeId),
      state,
      ctx,
      writing,
      summary: kidPathSummary(ctx),
      refresh,
    };
  }, [forKidId, v, refresh]);
}
