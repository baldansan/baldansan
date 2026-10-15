/**
 * Stale-while-revalidate — localStorage дээрх сүүлийн утга.
 *
 * Давтах / Нүүр / Тоглоом зэрэг хуудсууд Supabase-аас статистик татахад
 * 0.5–1.5с хүлээлгэдэг. Эхний render-д сүүлийн хадгалсан утгыг шууд харуулж,
 * шинэ утгыг ард нь татаад солино — «ачааллаж байна…» харагдахгүй.
 *
 * Зөвхөн харуулах тоо (дүрслэл) хадгална — эрх, нэвтрэлтийн мэдээлэл биш.
 */

import { useSyncExternalStore } from "react";

const PREFIX = "bs:snap:";

type Envelope<T> = { v: 1; at: number; data: T };

export function readLocalSnapshot<T>(key: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (!parsed || parsed.v !== 1 || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeLocalSnapshot<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: Envelope<T> = { v: 1, at: Date.now(), data };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // квот дүүрсэн / private mode — чимээгүй
  }
}

export function clearLocalSnapshot(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

/* ---------- React hook: useLocalSnapshot ---------- */

const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function getSnapshotCached<T>(key: string, maxAgeMs: number): T | null {
  const raw = readRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;
  const value = raw ? readLocalSnapshot<T>(key, maxAgeMs) : null;
  snapshotCache.set(key, { raw, value });
  return value;
}

function subscribeStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot() {
  return null;
}

/**
 * localStorage дээрх сүүлийн утгыг hydration-д аюулгүйгээр уншина
 * (server: null → client: хадгалсан утга; setState/effect хэрэггүй).
 * Эхний render-д сүүлийн утгыг харуулж, шинэ утгыг ард нь татна (SWR).
 */
export function useLocalSnapshot<T>(key: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000): T | null {
  return useSyncExternalStore(
    subscribeStorage,
    () => getSnapshotCached<T>(key, maxAgeMs),
    getServerSnapshot
  );
}
