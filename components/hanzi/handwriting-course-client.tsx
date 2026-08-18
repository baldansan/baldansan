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
type StoryEntry = { m: string; story: string };
type StoriesData = Record<string, StoryEntry>;
type HandwritingGroup = { title: string; radical: string; chars: string[] };
type GroupsData = Record<string, HandwritingGroup[]>;

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
  const [groups, setGroups] = useState<GroupsData | null>(null);
  const [stories, setStories] = useState<StoriesData>({});
  const [loadError, setLoadError] = useState(false);
  const [level, setLevel] = useState<LevelKey>("1-2");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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
    fetch("/data/hsk30_handwriting_groups.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((json: GroupsData) => {
        if (!cancelled) setGroups(json);
      })
      .catch(() => {
        // Groups are an enhancement — the flat grid still works without them.
      });
    fetch("/data/hsk30_stories.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: StoriesData) => {
        if (!cancelled) setStories(json ?? {});
      })
      .catch(() => {
        // Stories are an enhancement — writing works without them.
      });
    setDone(readProgress());
    return () => {
      cancelled = true;
    };
  }, []);

  const levelGroups = useMemo(() => groups?.[level] ?? null, [groups, level]);
  // Group order (simple → complex) when groups are available, flat list otherwise.
  const chars = useMemo(
    () =>
      levelGroups
        ? levelGroups.flatMap((g) => g.chars)
        : (data?.[level] ?? []),
    [levelGroups, data, level]
  );
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
    // Auto-advance to the next unwritten character in group order.
    const idx = chars.indexOf(char);
    const nextChar =
      chars.slice(idx + 1).find((c) => !done.has(c) && c !== char) ??
      chars.find((c) => !done.has(c) && c !== char) ??
      null;
    setActiveChar(nextChar);
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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

          {levelGroups ? (
            <div className="space-y-3 pb-6">
              {levelGroups.map((group, gi) => {
                const key = `${level}:${gi}`;
                const isOpen = !collapsed.has(key);
                const groupDone = group.chars.filter((c) =>
                  done.has(c)
                ).length;
                const complete = groupDone === group.chars.length;
                return (
                  <section
                    key={key}
                    className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(key)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[var(--app-text)]">
                          {group.title}
                        </span>
                        <span
                          className={`block text-xs font-semibold ${
                            complete
                              ? "text-emerald-600"
                              : "text-[var(--app-muted)]"
                          }`}
                        >
                          {groupDone}/{group.chars.length} бичсэн
                          {complete ? " ✓" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-[var(--app-muted)]">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="grid grid-cols-6 gap-1.5 px-3 pb-3 sm:grid-cols-8">
                        {group.chars.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setActiveChar(c)}
                            className={`flex aspect-square items-center justify-center rounded-xl text-xl font-semibold transition-colors ${
                              done.has(c)
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-50 text-[var(--app-text)] ring-1 ring-slate-200 active:bg-emerald-50"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          ) : (
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
          )}
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
            {stories[activeChar] ? (
              <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  🧠 Толгойдоо ургуулж бод
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  {stories[activeChar].story}
                </p>
                {stories[activeChar].m ? (
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    Утга: {stories[activeChar].m}
                  </p>
                ) : null}
              </div>
            ) : null}
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
