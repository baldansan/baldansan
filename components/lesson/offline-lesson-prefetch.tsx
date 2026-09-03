"use client";

import { useEffect } from "react";

/**
 * Prefetches every public Supabase Storage URL (lesson audio, covers)
 * referenced by the current lesson page, so the service worker caches
 * them and the lesson keeps working fully offline (e.g. on a flight).
 *
 * Runs once per page load, online only, low priority.
 */
const STORAGE_URL_RE =
  /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'\\)<>]+/g;

function collectStorageUrls(): string[] {
  const found = new Set<string>();

  const scan = (text: string) => {
    const normalized = text
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&");
    const matches = normalized.match(STORAGE_URL_RE);
    if (matches) {
      for (const m of matches) found.add(m);
    }
  };

  try {
    // RSC flight payload chunks (server-rendered lesson data incl. audio URLs).
    const flight = (window as unknown as { __next_f?: unknown[] }).__next_f;
    if (Array.isArray(flight)) {
      for (const entry of flight) {
        if (Array.isArray(entry) && typeof entry[1] === "string") {
          scan(entry[1]);
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    scan(document.documentElement.innerHTML);
  } catch {
    // ignore
  }

  return Array.from(found);
}

async function prefetchAll(urls: string[]) {
  const queue = [...urls];
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) return;
      try {
        await fetch(url, { mode: "cors", credentials: "omit" });
      } catch {
        // offline or blocked — stop quietly
        return;
      }
    }
  });
  await Promise.all(workers);
}

export function OfflineLessonPrefetch() {
  useEffect(() => {
    if (typeof navigator === "undefined" || navigator.onLine === false) return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    // Wait for hydration + SW control before warming the cache.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const urls = collectStorageUrls();
      if (urls.length > 0) {
        void prefetchAll(urls);
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
