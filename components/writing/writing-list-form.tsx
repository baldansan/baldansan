"use client";

/**
 * Шинэ дэвтэр / дэвтэр засах маягт.
 * Эх сурвалж 3 таб: өөрөө бичих (lookup API), хичээлээс, HSK жагсаалт.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import {
  CURRICULUM_COURSE_IDS,
  curriculumCourseLabel,
  type CurriculumLessonOption,
} from "@/lib/classroom/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { dedupeItems } from "@/lib/writing/local-store";
import { createList, getList, updateList } from "@/lib/writing/store";
import {
  defaultListTitle,
  REPS_MEMORY_DEFAULT,
  REPS_MEMORY_MAX,
  REPS_MEMORY_MIN,
  REPS_TRACE_DEFAULT,
  REPS_TRACE_MAX,
  REPS_TRACE_MIN,
  type WritingItem,
  type WritingListKind,
} from "@/lib/writing/types";
import "@/components/writing/writing.css";

type Source = "own" | "lesson" | "hsk";

const HSK_LEVELS = ["1-2", "3", "4", "5", "6", "7-9"] as const;

type Props = { mode: "new" } | { mode: "edit"; listId: string };

async function lookup(text: string): Promise<WritingItem[]> {
  const res = await fetch("/api/writing/lookup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("lookup");
  const json = (await res.json()) as { items?: WritingItem[] };
  return json.items ?? [];
}

/** Ханз таних + засах хүснэгт (шинэ дэвтэр, засах, багшийн даалгавар бүгд хэрэглэнэ). */
export function WritingItemsTable({
  items,
  onChange,
  compact = false,
}: {
  items: WritingItem[];
  onChange: (next: WritingItem[]) => void;
  compact?: boolean;
}) {
  const locale = useUiLocale();
  if (items.length === 0) return null;
  function patch(idx: number, p: Partial<WritingItem>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...p } : it)));
  }
  return (
    <ul className="divide-y divide-slate-100 rounded-xl bg-white ring-1 ring-slate-200">
      {items.map((item, idx) => (
        <li key={item.ch} className="flex items-center gap-2 px-2 py-1.5">
          <span className="w-6 shrink-0 text-right text-[10px] text-slate-400">{idx + 1}</span>
          <span
            className={`shrink-0 text-center font-semibold text-[var(--app-text)] ${
              compact ? "w-8 text-2xl" : "w-10 text-3xl"
            }`}
            translate="no"
          >
            {item.ch}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <input
              value={item.pinyin ?? ""}
              onChange={(e) => patch(idx, { pinyin: e.target.value })}
              placeholder="pīnyīn"
              translate="no"
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800"
            />
            <input
              value={item.meaning_mn ?? ""}
              onChange={(e) => patch(idx, { meaning_mn: e.target.value })}
              placeholder={tr(locale, "утга")}
              translate="no"
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800"
            />
            {item.word && item.word !== item.ch ? (
              <p className="text-[10px] text-slate-400" translate="no">
                ← {item.word}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={tr(locale, "Хасах")}
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="shrink-0 rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-red-600"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}

export function WritingListForm(props: Props) {
  const locale = useUiLocale();
  const router = useRouter();
  const editing = props.mode === "edit";
  const listId = props.mode === "edit" ? props.listId : null;

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WritingListKind>("own");
  const [items, setItems] = useState<WritingItem[]>([]);
  const [repsTrace, setRepsTrace] = useState(REPS_TRACE_DEFAULT);
  const [repsMemory, setRepsMemory] = useState(REPS_MEMORY_DEFAULT);
  const [source, setSource] = useState<Source>("own");
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // «Өөрөө бичих»
  const [text, setText] = useState("");
  // «Хичээлээс»
  const [courseId, setCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<CurriculumLessonOption[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [checkedLessons, setCheckedLessons] = useState<Set<string>>(new Set());
  // «HSK жагсаалт»
  const [hskData, setHskData] = useState<Record<string, string[]> | null>(null);
  const [hskLevel, setHskLevel] = useState<(typeof HSK_LEVELS)[number]>("1-2");
  const [hskFrom, setHskFrom] = useState(1);
  const [hskTo, setHskTo] = useState(20);

  const placeholderTitle = useMemo(() => defaultListTitle(tr(locale, "Дэвтэр")), [locale]);

  useEffect(() => {
    if (!listId) return;
    let alive = true;
    void getList(listId).then((res) => {
      if (!alive) return;
      setLoading(false);
      if (res.error || !res.data) {
        setError(res.error ?? tr(locale, "Дэвтэр олдсонгүй."));
        return;
      }
      setTitle(res.data.title);
      setKind(res.data.kind);
      setItems(res.data.items);
      setRepsTrace(res.data.repsTrace);
      setRepsMemory(res.data.repsMemory);
    });
    return () => {
      alive = false;
    };
  }, [listId, locale]);

  useEffect(() => {
    if (source !== "hsk" || hskData) return;
    let alive = true;
    fetch("/data/hsk30_handwritten.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((json: Record<string, string[]>) => {
        if (alive) setHskData(json);
      })
      .catch(() => {
        if (alive) setError(tr(locale, "Өгөгдөл ачаалагдсангүй. Сүлжээгээ шалгаад дахин оролдоно уу."));
      });
    return () => {
      alive = false;
    };
  }, [source, hskData, locale]);

  const addItems = useCallback((next: WritingItem[], nextKind: WritingListKind) => {
    setItems((prev) => dedupeItems([...prev, ...next]));
    if (!editing) setKind((k) => (k === "own" && next.length > 0 ? nextKind : k));
  }, [editing]);

  async function recognize() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const found = await lookup(text);
      if (found.length === 0) setError(tr(locale, "Ханз олдсонгүй — хятад ханз оруулна уу."));
      addItems(found, "own");
      setText("");
    } catch {
      setError(tr(locale, "Таньж чадсангүй. Дахин оролдоно уу."));
    } finally {
      setBusy(false);
    }
  }

  async function pickLevel(id: string) {
    setCourseId(id);
    setLessonsLoading(true);
    setCheckedLessons(new Set());
    try {
      const res = await fetch(`/api/curriculum/lessons?courseId=${encodeURIComponent(id)}`);
      const json = (await res.json()) as { lessons?: CurriculumLessonOption[] };
      setLessons(json.lessons ?? []);
    } catch {
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }

  async function addFromLessons() {
    if (checkedLessons.size === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const results = await Promise.all(
        [...checkedLessons].map(async (id) => {
          const res = await fetch(`/api/writing/lesson-words?lessonId=${encodeURIComponent(id)}`);
          if (!res.ok) return [] as WritingItem[];
          const json = (await res.json()) as { items?: WritingItem[] };
          return json.items ?? [];
        })
      );
      const merged = results.flat();
      if (merged.length === 0) setError(tr(locale, "Энэ хичээлд ханз олдсонгүй."));
      addItems(merged, "lesson");
      setCheckedLessons(new Set());
    } catch {
      setError(tr(locale, "Таньж чадсангүй. Дахин оролдоно уу."));
    } finally {
      setBusy(false);
    }
  }

  const hskChars = useMemo(() => hskData?.[hskLevel] ?? [], [hskData, hskLevel]);

  async function addFromHsk() {
    if (hskChars.length === 0 || busy) return;
    const from = Math.max(1, Math.min(hskFrom, hskChars.length));
    const to = Math.max(from, Math.min(hskTo, hskChars.length));
    const slice = hskChars.slice(from - 1, to);
    setBusy(true);
    setError(null);
    try {
      const found = await lookup(slice.join(" "));
      // lookup нь дарааллыг хадгална; олдоогүй ханзыг ч гэсэн нэмнэ.
      const byCh = new Map(found.map((i) => [i.ch, i]));
      addItems(
        slice.map((ch) => byCh.get(ch) ?? { ch, word: null, pinyin: null, meaning_mn: null }),
        "hsk"
      );
    } catch {
      addItems(slice.map((ch) => ({ ch, word: null, pinyin: null, meaning_mn: null })), "hsk");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (items.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    const finalTitle = title.trim() || placeholderTitle;
    const res = listId
      ? await updateList(listId, { title: finalTitle, items, repsTrace, repsMemory })
      : await createList({ title: finalTitle, kind, items, repsTrace, repsMemory });
    setSaving(false);
    if (res.error || !res.data) {
      setError(res.error ?? tr(locale, "Хадгалж чадсангүй."));
      return;
    }
    router.push(`/writing/${res.data.id}`);
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold ${
      active ? "bg-emerald-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
    }`;

  return (
    <MobileAppShell activeTab="study">
      <Link
        href={listId ? `/writing/${listId}` : "/writing"}
        className="mb-3 inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
      >
        {tr(locale, "← Буцах")}
      </Link>
      <MobilePageHeader
        title={editing ? tr(locale, "Дэвтэр засах") : tr(locale, "Шинэ дэвтэр")}
        subtitle={tr(locale, "Ханзаа оруул → пиньинь, утга автоматаар олдоно → бичиж эхэл")}
      />

      {loading ? (
        <MobileCard>
          <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4 pb-24">
          <MobileCard>
            <label className="block text-xs font-bold text-[var(--app-muted)]">
              {tr(locale, "Гарчиг")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={placeholderTitle}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </MobileCard>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={tabClass(source === "own")} onClick={() => setSource("own")}>
              ✏️ {tr(locale, "Өөрөө бичих")}
            </button>
            <button type="button" className={tabClass(source === "lesson")} onClick={() => setSource("lesson")}>
              📖 {tr(locale, "Хичээлээс")}
            </button>
            <button type="button" className={tabClass(source === "hsk")} onClick={() => setSource("hsk")}>
              🈶 {tr(locale, "HSK жагсаалт")}
            </button>
          </div>

          {source === "own" ? (
            <MobileCard>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="学 生 老师 今天…"
                translate="no"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg leading-8"
              />
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {tr(locale, "Ханз, үг, өгүүлбэр — аль нь ч болно. Зай, таслалаар тусгаарлана.")}
              </p>
              <button
                type="button"
                onClick={() => void recognize()}
                disabled={!text.trim() || busy}
                className="app-btn-primary mt-3 w-full disabled:opacity-50"
              >
                {busy ? tr(locale, "Таньж байна…") : `🔍 ${tr(locale, "Таних")}`}
              </button>
            </MobileCard>
          ) : null}

          {source === "lesson" ? (
            <MobileCard>
              <p className="text-xs font-bold text-[var(--app-muted)]">{tr(locale, "Түвшин сонгох")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CURRICULUM_COURSE_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void pickLevel(id)}
                    className={tabClass(courseId === id)}
                  >
                    {curriculumCourseLabel(id)}
                  </button>
                ))}
              </div>
              {courseId ? (
                lessonsLoading ? (
                  <p className="mt-3 text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
                ) : lessons.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--app-muted)]">
                    {tr(locale, "Энэ түвшинд нийтлэгдсэн хичээл алга.")}
                  </p>
                ) : (
                  <>
                    <ul className="mt-3 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
                      {lessons.map((lesson, i) => (
                        <li key={lesson.id}>
                          <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checkedLessons.has(lesson.id)}
                              onChange={() =>
                                setCheckedLessons((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(lesson.id)) next.delete(lesson.id);
                                  else next.add(lesson.id);
                                  return next;
                                })
                              }
                              className="h-4 w-4 accent-emerald-600"
                            />
                            <span className="w-5 shrink-0 text-right text-xs text-slate-400">{i + 1}</span>
                            <span className="min-w-0 flex-1 truncate" translate="no">
                              {lesson.chineseTitle ? `${lesson.chineseTitle} · ` : ""}
                              {lesson.title}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => void addFromLessons()}
                      disabled={checkedLessons.size === 0 || busy}
                      className="app-btn-primary mt-3 w-full disabled:opacity-50"
                    >
                      {busy
                        ? tr(locale, "Таньж байна…")
                        : `🔍 ${tr(locale, "Таних")} (${checkedLessons.size})`}
                    </button>
                  </>
                )
              ) : null}
            </MobileCard>
          ) : null}

          {source === "hsk" ? (
            <MobileCard>
              <p className="text-xs font-bold text-[var(--app-muted)]">
                {tr(locale, "HSK 3.0 стандартын гараар бичиж сурах ёстой ханзнууд")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HSK_LEVELS.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => {
                      setHskLevel(lv);
                      setHskFrom(1);
                      setHskTo(20);
                    }}
                    className={tabClass(hskLevel === lv)}
                  >
                    HSK {lv}
                  </button>
                ))}
              </div>
              {hskData == null ? (
                <p className="mt-3 text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
              ) : (
                <>
                  <p className="mt-3 text-xs text-[var(--app-muted)]">
                    {tr(locale, "Нийт")} {hskChars.length} {tr(locale, "ханз")} ·{" "}
                    {tr(locale, "хэддэхээс хэддэх хүртэл авах вэ?")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={hskChars.length}
                      value={hskFrom}
                      onChange={(e) => setHskFrom(Number(e.target.value) || 1)}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                    <span className="text-sm text-slate-500">–</span>
                    <input
                      type="number"
                      min={1}
                      max={hskChars.length}
                      value={hskTo}
                      onChange={(e) => setHskTo(Number(e.target.value) || 1)}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <p className="mt-2 text-lg leading-8 text-slate-700" translate="no">
                    {hskChars
                      .slice(Math.max(0, hskFrom - 1), Math.max(hskFrom, hskTo))
                      .join(" ")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void addFromHsk()}
                    disabled={busy || hskChars.length === 0}
                    className="app-btn-primary mt-3 w-full disabled:opacity-50"
                  >
                    {busy ? tr(locale, "Таньж байна…") : `+ ${tr(locale, "Дэвтэрт нэмэх")}`}
                  </button>
                </>
              )}
            </MobileCard>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}

          {items.length > 0 ? (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--app-text)]">
                  {items.length} {tr(locale, "ханз")}
                </h2>
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-xs font-semibold text-slate-500"
                >
                  {tr(locale, "Бүгдийг арилгах")}
                </button>
              </div>
              <WritingItemsTable items={items} onChange={setItems} />
            </section>
          ) : null}

          <MobileCard>
            <p className="text-xs font-bold text-[var(--app-muted)]">{tr(locale, "Давталтын тоо")}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-slate-600">✍️ {tr(locale, "Дагаж бичих")}</span>
                <input
                  type="number"
                  min={REPS_TRACE_MIN}
                  max={REPS_TRACE_MAX}
                  value={repsTrace}
                  onChange={(e) =>
                    setRepsTrace(
                      Math.min(REPS_TRACE_MAX, Math.max(REPS_TRACE_MIN, Number(e.target.value) || REPS_TRACE_MIN))
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">🧠 {tr(locale, "Санаж бичих")}</span>
                <input
                  type="number"
                  min={REPS_MEMORY_MIN}
                  max={REPS_MEMORY_MAX}
                  value={repsMemory}
                  onChange={(e) =>
                    setRepsMemory(
                      Math.min(REPS_MEMORY_MAX, Math.max(REPS_MEMORY_MIN, Number(e.target.value) || REPS_MEMORY_MIN))
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          </MobileCard>

          <button
            type="button"
            onClick={() => void save()}
            disabled={items.length === 0 || saving}
            className="app-btn-primary w-full disabled:opacity-50"
          >
            {saving
              ? tr(locale, "Хадгалж байна…")
              : `💾 ${tr(locale, "Хадгалах")} · ${items.length} ${tr(locale, "ханз")}`}
          </button>
        </div>
      )}
    </MobileAppShell>
  );
}
