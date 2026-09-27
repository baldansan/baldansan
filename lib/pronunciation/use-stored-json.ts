"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * localStorage дахь JSON-г hydration-д аюулгүй уншина (сервер дээр fallback).
 * `writeStoredJson` бичихэд бүх уншигч шинэчлэгдэнэ.
 */
const EVENT = "buunduu-stored-json";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useStoredJson<T>(key: string, fallback: T): T {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null
  );
  return useMemo(() => {
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
}

export function writeStoredJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore
  }
}
