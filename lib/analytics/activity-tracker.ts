"use client";

/**
 * Learner time-on-task tracker (Оюу оноо — 1-р үе шат).
 *
 * `useActivityTracker(surface, refId)` counts active seconds while the tab is
 * visible and flushes them to Supabase (`add_activity_seconds` RPC → upsert into
 * `user_activity_sessions` per user/day/surface/ref).
 *
 * - Ticks every 15s; flushes every 60s and on visibilitychange/pagehide
 *   (keepalive fetch — the browser equivalent of sendBeacon with auth headers).
 * - Does not count while `document.hidden`; a stretch of ≥30 min without any
 *   visible tick is treated as idle and dropped.
 * - Guests (or failed flushes) accumulate in localStorage and are synced once
 *   the next time a tracked screen mounts with a logged-in user.
 *
 * Fire-and-forget: never throws, never blocks learner UX.
 */

import { useEffect, useRef } from "react";
import { MONGOLIA_TIME_ZONE } from "@/lib/datetime/mongolia-time";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type ActivitySurface =
  | "lesson"
  | "video"
  | "game"
  | "writing"
  | "review"
  | "mock";

export type PendingActivity = {
  surface: ActivitySurface;
  refId: string | null;
  seconds: number;
  day: string; // YYYY-MM-DD (Ulaanbaatar)
};

const PENDING_KEY = "buunduu-activity-pending-v1";
const TICK_MS = 15_000;
const FLUSH_MS = 60_000;
const IDLE_LIMIT_MS = 30 * 60_000;
const MAX_PENDING = 500;
const RPC_NAME = "add_activity_seconds";

const SURFACES: readonly ActivitySurface[] = [
  "lesson",
  "video",
  "game",
  "writing",
  "review",
  "mock",
];

/** Today's date (YYYY-MM-DD) in Ulaanbaatar time. */
export function mongoliaDay(now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: MONGOLIA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const y = get("year");
    const m = get("month");
    const d = get("day");
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // fall through
  }
  return now.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Pending (guest / offline) queue in localStorage
// ---------------------------------------------------------------------------

function readPending(): PendingActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPendingActivity);
  } catch {
    return [];
  }
}

function isPendingActivity(v: unknown): v is PendingActivity {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.surface === "string" &&
    SURFACES.includes(o.surface as ActivitySurface) &&
    (o.refId == null || typeof o.refId === "string") &&
    typeof o.seconds === "number" &&
    Number.isFinite(o.seconds) &&
    o.seconds > 0 &&
    typeof o.day === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(o.day)
  );
}

function writePending(items: PendingActivity[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(PENDING_KEY);
      return;
    }
    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify(items.slice(-MAX_PENDING))
    );
  } catch {
    // quota — drop silently
  }
}

/** Merge same day+surface+ref entries so the queue stays small. */
function mergePending(items: PendingActivity[]): PendingActivity[] {
  const map = new Map<string, PendingActivity>();
  for (const it of items) {
    const key = `${it.day}|${it.surface}|${it.refId ?? ""}`;
    const cur = map.get(key);
    if (cur) cur.seconds += it.seconds;
    else map.set(key, { ...it });
  }
  return [...map.values()];
}

export function queuePendingActivity(item: PendingActivity): void {
  if (item.seconds <= 0) return;
  writePending(mergePending([...readPending(), item]));
}

export function getPendingActivityCount(): number {
  return readPending().length;
}

// ---------------------------------------------------------------------------
// Supabase transport
// ---------------------------------------------------------------------------

let cachedAccessToken: string | null = null;
let authListenerAttached = false;

function ensureAuthListener(): void {
  if (authListenerAttached || !supabase) return;
  authListenerAttached = true;
  void supabase.auth
    .getSession()
    .then(({ data }) => {
      cachedAccessToken = data.session?.access_token ?? null;
    })
    .catch(() => {
      cachedAccessToken = null;
    });
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token ?? null;
  });
}

async function refreshAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    cachedAccessToken = data.session?.access_token ?? null;
  } catch {
    // keep cached value
  }
  return cachedAccessToken;
}

/** Normal path: authenticated RPC via supabase-js. */
async function sendViaClient(item: PendingActivity): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc(RPC_NAME, {
      p_surface: item.surface,
      p_ref_id: item.refId,
      p_seconds: Math.round(item.seconds),
      p_day: item.day,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Unload path: keepalive fetch straight to PostgREST so the request survives
 * navigation. `navigator.sendBeacon` cannot carry the Authorization header
 * PostgREST needs, so `fetch({ keepalive: true })` is used instead.
 */
function sendViaBeacon(item: PendingActivity): boolean {
  if (typeof window === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = cachedAccessToken;
  if (!url || !anonKey || !token) return false;
  try {
    void fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${RPC_NAME}`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        p_surface: item.surface,
        p_ref_id: item.refId,
        p_seconds: Math.round(item.seconds),
        p_day: item.day,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Push queued guest/offline activity to the server. Runs at most one sync at a
 * time; leftovers stay queued on failure.
 */
let syncInFlight = false;
export async function syncPendingActivity(): Promise<void> {
  if (syncInFlight || !hasSupabaseConfig || !supabase) return;
  const items = mergePending(readPending());
  if (items.length === 0) return;
  syncInFlight = true;
  try {
    const token = await refreshAccessToken();
    if (!token) return; // still a guest — keep queued
    const remaining: PendingActivity[] = [];
    for (const it of items) {
      const ok = await sendViaClient(it);
      if (!ok) remaining.push(it);
    }
    writePending(remaining);
  } finally {
    syncInFlight = false;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Track time spent on a learning surface. Mount it once per screen.
 *
 * @param surface  'lesson' | 'video' | 'game' | 'writing' | 'review' | 'mock'
 * @param refId    lessonId / videoId / gameType / level … (null = whole surface)
 * @param enabled  set false to pause (e.g. while a screen is loading)
 */
export function useActivityTracker(
  surface: ActivitySurface,
  refId: string | null | undefined,
  enabled = true
): void {
  const ref = refId == null || refId === "" ? null : String(refId);
  const pendingSecondsRef = useRef(0);
  const lastTickRef = useRef<number>(0);
  const dayRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    ensureAuthListener();
    // First tracked screen after login → drain the guest queue.
    void syncPendingActivity();

    pendingSecondsRef.current = 0;
    lastTickRef.current = Date.now();
    dayRef.current = mongoliaDay();

    const takeChunk = (): PendingActivity | null => {
      const secs = Math.round(pendingSecondsRef.current);
      pendingSecondsRef.current = 0;
      if (secs <= 0) return null;
      return { surface, refId: ref, seconds: secs, day: dayRef.current };
    };

    const flush = (viaBeacon: boolean) => {
      const chunk = takeChunk();
      if (!chunk) return;
      if (!hasSupabaseConfig || !supabase) {
        queuePendingActivity(chunk);
        return;
      }
      if (viaBeacon) {
        if (!sendViaBeacon(chunk)) queuePendingActivity(chunk);
        return;
      }
      void (async () => {
        const token = await refreshAccessToken();
        if (!token) {
          queuePendingActivity(chunk); // guest
          return;
        }
        const ok = await sendViaClient(chunk);
        if (!ok) queuePendingActivity(chunk);
      })();
    };

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      if (document.hidden) return; // not counted while tab is hidden
      if (elapsed <= 0 || elapsed > IDLE_LIMIT_MS) return; // idle gap dropped
      // Cap one tick at its nominal interval (+ small drift) so throttled
      // background timers can't inflate the count.
      const credited = Math.min(elapsed, TICK_MS * 1.5);
      const today = mongoliaDay();
      if (today !== dayRef.current) {
        // Day rolled over: flush what belongs to the previous day first.
        flush(false);
        dayRef.current = today;
      }
      pendingSecondsRef.current += credited / 1000;
    };

    const onVisibility = () => {
      if (document.hidden) {
        tick();
        flush(true);
      } else {
        // Coming back: restart the clock so hidden time is not credited.
        lastTickRef.current = Date.now();
      }
    };
    const onPageHide = () => {
      tick();
      flush(true);
    };

    const tickTimer = window.setInterval(tick, TICK_MS);
    const flushTimer = window.setInterval(() => flush(false), FLUSH_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(tickTimer);
      window.clearInterval(flushTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      tick();
      flush(true);
    };
  }, [surface, ref, enabled]);
}
