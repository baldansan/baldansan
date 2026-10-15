"use client";

import { useEffect, useState } from "react";

/**
 * «Хичээл татах (оффлайн үзэх)» — тухайн хичээлийн хуудсууд (detail, watch,
 * quiz, vocabulary, workbook) болон бүх аудио/зургийн файлыг service-worker
 * кэшэнд урьдчилан хийнэ.
 *
 * Файлын жагсаалтыг /api/lessons/{id}/offline-manifest (server дээр бүрэн
 * resolve хийсэн багц) өгнө; аудио нь public/sw.js-ийн buunduu-audio
 * (cache-first, ~150МБ LRU) кэшэнд ордог. HTML-ээс regex-ээр URL түүх хуучин
 * аргыг нөөц (fallback) болгон үлдээв.
 */
const STORAGE_URL_RE =
  /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'\\)<>]+/g;

const SUBPATHS = ["", "/watch", "/quiz", "/vocabulary", "/workbook"];

type Manifest = {
  lessonId: string;
  pages: string[];
  audio: string[];
  media: string[];
};

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

async function fetchManifest(lessonId: string): Promise<Manifest | null> {
  try {
    const res = await fetch(
      `/api/lessons/${encodeURIComponent(lessonId)}/offline-manifest`,
      { credentials: "same-origin" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<Manifest>;
    return {
      lessonId: String(data.lessonId ?? lessonId),
      pages: Array.isArray(data.pages) ? data.pages : [],
      audio: Array.isArray(data.audio) ? data.audio : [],
      media: Array.isArray(data.media) ? data.media : [],
    };
  } catch {
    return null;
  }
}

async function waitForServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);
  } catch {
    // SW байхгүй бол хөтчийн HTTP кэш л ажиллана
  }
}

async function downloadLesson(
  lessonId: string,
  onProgress: (done: number, total: number) => void
): Promise<{ files: number; audio: number }> {
  await waitForServiceWorker();

  const manifest = await fetchManifest(lessonId);
  const mediaUrls = new Set<string>(manifest ? [...manifest.audio, ...manifest.media] : []);
  const pages =
    manifest && manifest.pages.length > 0
      ? manifest.pages
      : SUBPATHS.map((sub) => `/lessons/${encodeURIComponent(lessonId)}${sub}`);

  // 1. Хуудас бүрийг татна → SW HTML-ийг кэшилнэ (оффлайн navigation).
  //    Manifest ирээгүй бол HTML-ээс URL түүнэ (нөөц арга).
  for (const page of pages) {
    try {
      const res = await fetch(page, { credentials: "same-origin" });
      if (res.ok && !manifest) {
        const html = await res.text();
        for (const url of extractStorageUrls(html)) mediaUrls.add(url);
      }
    } catch {
      throw new Error("offline");
    }
  }

  // 2. Аудио + зураг бүрийг cors горимоор татна → SW аудио/медиа кэшэнд хийнэ.
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
        // нэг файл алдвал бүхэл татах ажлыг зогсоохгүй
      }
      done += 1;
      onProgress(done, total);
    }
  });
  await Promise.all(workers);
  return { files: total, audio: manifest?.audio.length ?? 0 };
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
      const { files } = await downloadLesson(lessonId, (done, total) =>
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
        : "Бэлдэж байна…"
      : state.kind === "done"
        ? `✓ Татагдсан — оффлайн үзэж болно${state.files > 0 ? ` (${state.files} файл)` : ""}`
        : state.kind === "error"
          ? "Алдаа гарлаа — интернэтээ шалгаад дахин дарна уу"
          : "⬇ Хичээл татах (оффлайн үзэх)";

  return (
    <button
      type="button"
      onClick={start}
      disabled={state.kind === "downloading"}
      className={`bs-interactive inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold ${
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
