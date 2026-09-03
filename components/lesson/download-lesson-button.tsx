"use client";

import { useEffect, useState } from "react";

/**
 * «Хичээл татах» — caches the lesson's pages (detail, watch, quiz,
 * vocabulary, workbook) and every referenced Supabase Storage file
 * (audio, covers) into the service-worker caches, so the whole lesson
 * works offline (e.g. on a flight).
 */
const STORAGE_URL_RE =
  /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'\\)<>]+/g;

const SUBPATHS = ["", "/watch", "/quiz", "/vocabulary", "/workbook"];

function markerKey(lessonId: string) {
  return `bs:offline-lesson:${lessonId}`;
}

function extractStorageUrls(text: string): string[] {
  const normalized = text
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
  return normalized.match(STORAGE_URL_RE) ?? [];
}

async function downloadLesson(
  lessonId: string,
  onProgress: (done: number, total: number) => void
): Promise<number> {
  const mediaUrls = new Set<string>();

  // 1. Fetch each lesson page → SW caches the HTML for offline navigation.
  for (const sub of SUBPATHS) {
    try {
      const res = await fetch(`/lessons/${lessonId}${sub}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const html = await res.text();
        for (const url of extractStorageUrls(html)) mediaUrls.add(url);
      }
    } catch {
      throw new Error("offline");
    }
  }

  // 2. Fetch every referenced media file → SW media cache.
  const urls = Array.from(mediaUrls);
  const total = urls.length;
  let done = 0;
  onProgress(0, total);

  const queue = [...urls];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) return;
      try {
        await fetch(url, { mode: "cors", credentials: "omit" });
      } catch {
        // keep going — a single failed file shouldn't abort the download
      }
      done += 1;
      onProgress(done, total);
    }
  });
  await Promise.all(workers);
  return total;
}

type State =
  | { kind: "idle" }
  | { kind: "downloading"; done: number; total: number }
  | { kind: "done"; files: number }
  | { kind: "error" };

export function DownloadLessonButton({ lessonId }: { lessonId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    setSupported(true);
    try {
      const saved = window.localStorage.getItem(markerKey(lessonId));
      if (saved) {
        setState({ kind: "done", files: Number(saved) || 0 });
      }
    } catch {
      // ignore
    }
  }, [lessonId]);

  if (!supported) return null;

  const start = async () => {
    if (state.kind === "downloading") return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setState({ kind: "error" });
      return;
    }
    setState({ kind: "downloading", done: 0, total: 0 });
    try {
      const files = await downloadLesson(lessonId, (done, total) =>
        setState({ kind: "downloading", done, total })
      );
      try {
        window.localStorage.setItem(markerKey(lessonId), String(files));
      } catch {
        // ignore
      }
      setState({ kind: "done", files });
    } catch {
      setState({ kind: "error" });
    }
  };

  const label =
    state.kind === "downloading"
      ? state.total > 0
        ? `Татаж байна… ${state.done}/${state.total}`
        : "Татаж байна…"
      : state.kind === "done"
        ? "✓ Татагдсан — оффлайн үзэж болно"
        : state.kind === "error"
          ? "Алдаа гарлаа — интернэтээ шалгаад дахин дарна уу"
          : "⬇ Хичээл татах (оффлайн үзэх)";

  return (
    <button
      type="button"
      onClick={start}
      disabled={state.kind === "downloading"}
      className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
        state.kind === "done"
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : state.kind === "error"
            ? "bg-red-50 text-red-700 ring-1 ring-red-200"
            : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-emerald-700"
      }`}
    >
      {label}
    </button>
  );
}
