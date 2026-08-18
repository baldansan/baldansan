"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CharacterWriter } from "@/components/hanzi/CharacterWriter";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import "@/components/lesson/lesson-player.css";

const PROGRESS_KEY = "buunduu-handwriting-progress-v1";
const LEVEL_ORDER = ["1-2", "3", "4", "5", "6", "7-9"] as const;

type LevelKey = (typeof LEVEL_ORDER)[number];
type HandwrittenData = Record<string, string[]>;

function readProgress(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeProgress(done: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify([...done]));
  } catch {
    // Storage full — session-only progress.
  }
}

export function HandwritingCourseClient() {
  const [data, setData] = useState<HandwrittenData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [level, setLevel] = useState<LevelKey>("1-2");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [activeChar, setActiveChar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/hsk30_handwritten.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((json: HandwrittenData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    setDone(readProgress());
    return () => {
      cancelled = true;
    };
  }, []);

  const chars = useMemo(() => data?.[level] ?? [], [data, level]);
  const doneCount = useMemo(
    () => chars.filter((c) => done.has(c)).length,
    [chars, done]
  );

  function markDone(char: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(char);
      writeProgress(next);
      return next;
    });
    // Auto-advance to the next unwritten character.
    const idx = chars.indexOf(char);
    const nextChar =
      chars.slice(idx + 1).find((c) => !done.has(c) && c !== char) ??
      chars.find((c) => !done.has(c) && c !== char) ??
      null;
    setActiveChar(nextChar);
  }

  return (
    <MobileAppShell activeTab="kanji" showBottomNav={activeChar == null}>
      <Link
        href="/kanji"
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        ← Үсэг рүү буцах
      </Link>

      <MobilePageHeader
        title="Бичих сургалт · 写字练习"
        subtitle="HSK 3.0 стандартын гараар бичиж сурах ёстой ханзнууд"
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {LEVEL_ORDER.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setLevel(lv)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              level === lv
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            HSK {lv}
          </button>
        ))}
      </div>

      {loadError ? (
        <MobileCard padding="lg">
          <p className="text-sm text-[var(--app-muted)]">
            Өгөгдөл ачаалагдсангүй. Сүлжээгээ шалгаад дахин оролдоно уу.
          </p>
        </MobileCard>
      ) : data == null ? (
        <MobileCard padding="lg">
          <p className="text-sm text-[var(--app-muted)]">Ачаалж байна…</p>
        </MobileCard>
      ) : (
        <>
          <MobileCard padding="lg" className="mb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[var(--app-text)]">
                {doneCount}/{chars.length} бичсэн
              </p>
              <p className="text-xs text-[var(--app-muted)]">
                {chars.length > 0
                  ? Math.round((doneCount / chars.length) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${chars.length > 0 ? (doneCount / chars.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
              Ханз дээр дарж бичээрэй: эхлээд дагаж, дараа нь санаж бичнэ.
            </p>
          </MobileCard>

          <div className="grid grid-cols-6 gap-1.5 pb-6 sm:grid-cols-8">
            {chars.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveChar(c)}
                className={`flex aspect-square items-center justify-center rounded-xl text-xl font-semibold transition-colors ${
                  done.has(c)
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-[var(--app-text)] ring-1 ring-slate-200 active:bg-emerald-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {activeChar ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--app-text)]">
                {activeChar} · Бичих дасгал
              </p>
              <button
                type="button"
                onClick={() => setActiveChar(null)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Хаах
              </button>
            </div>
            <CharacterWriter
              key={activeChar}
              character={{ hanzi: activeChar, pinyin: [], practice: "write" }}
              mode="write"
              onComplete={() => markDone(activeChar)}
            />
          </div>
        </div>
      ) : null}
    </MobileAppShell>
  );
}
