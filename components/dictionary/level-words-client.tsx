"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { removeWordFromStudy, saveWordFromLesson } from "@/lib/supabase/saved-words";
import {
  getUserWordStudyStates,
  markWordMastered,
  type WordStudyState,
} from "@/lib/supabase/user-word-srs";

type LevelWord = {
  id: number;
  simplified: string;
  pinyin: string | null;
  meaning_mn: string | null;
};

type ViewFilter = "all" | "todo" | "learning" | "mastered";

const LEVELS = ["1", "2", "3", "4", "5", "6"] as const;
const PAGE = 80;
const cache = new Map<string, LevelWord[]>();

async function fetchLevelWords(level: string): Promise<LevelWord[]> {
  const hit = cache.get(level);
  if (hit) return hit;
  if (!supabase || !hasSupabaseConfig) return [];
  const out: LevelWord[] = [];
  for (let from = 0; from < 6000; from += 1000) {
    const { data, error } = await supabase
      .from("hsk_words")
      .select("id, simplified, pinyin, meaning_mn")
      .eq("hsk_level", level)
      .eq("is_function_word", false)
      .order("frequency", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error || !data?.length) break;
    out.push(...(data as LevelWord[]));
    if (data.length < 1000) break;
  }
  if (out.length) cache.set(level, out);
  return out;
}

export function LevelWordsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("level") ?? "";
  const level = (LEVELS as readonly string[]).includes(raw) ? raw : "1";

  const [loaded, setLoaded] = useState<{ level: string; rows: LevelWord[] } | null>(null);
  const words = loaded && loaded.level === level ? loaded.rows : null;
  const [states, setStates] = useState<Map<number, WordStudyState>>(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<ViewFilter>("all");
  const [shown, setShown] = useState(PAGE);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { userId: uid } = await getAuthenticatedUserId();
      if (!alive) return;
      setUserId(uid ?? null);
      setAuthChecked(true);
      if (uid) {
        const map = await getUserWordStudyStates(uid);
        if (alive) setStates(map);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchLevelWords(level).then((rows) => {
      if (alive) setLoaded({ level, rows });
    });
    return () => {
      alive = false;
    };
  }, [level]);

  const counts = useMemo(() => {
    let learning = 0;
    let mastered = 0;
    for (const w of words ?? []) {
      const s = states.get(w.id);
      if (s === "learning") learning++;
      else if (s === "mastered") mastered++;
    }
    return { total: words?.length ?? 0, learning, mastered };
  }, [words, states]);

  const visible = useMemo(() => {
    const list = words ?? [];
    if (view === "all") return list;
    if (view === "todo") return list.filter((w) => !states.has(w.id));
    return list.filter((w) => states.get(w.id) === view);
  }, [words, states, view]);

  const setBusyFor = useCallback((id: number, on: boolean) => {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const patchState = useCallback((id: number, value: WordStudyState | null) => {
    setStates((prev) => {
      const next = new Map(prev);
      if (value) next.set(id, value);
      else next.delete(id);
      return next;
    });
  }, []);

  async function toggleHeart(word: LevelWord) {
    if (!userId) {
      setNote("Үг хадгалахын тулд эхлээд нэвтэрнэ үү.");
      return;
    }
    if (busy.has(word.id)) return;
    const before = states.get(word.id) ?? null;
    setBusyFor(word.id, true);
    setNote(null);
    if (before) {
      patchState(word.id, null);
      const res = await removeWordFromStudy(word.simplified);
      if (!res.ok) {
        patchState(word.id, before);
        setNote(res.error ?? "Хасаж чадсангүй.");
      }
    } else {
      patchState(word.id, "learning");
      const res = await saveWordFromLesson({
        zh: word.simplified,
        pinyin: word.pinyin ?? undefined,
        mn: word.meaning_mn ?? undefined,
      });
      if (!res.ok) {
        patchState(word.id, null);
        setNote(res.error ?? "Хадгалж чадсангүй.");
      }
    }
    setBusyFor(word.id, false);
  }

  async function markKnown(word: LevelWord) {
    if (!userId) {
      setNote("Тэмдэглэхийн тулд эхлээд нэвтэрнэ үү.");
      return;
    }
    if (busy.has(word.id)) return;
    const before = states.get(word.id) ?? null;
    setBusyFor(word.id, true);
    patchState(word.id, "mastered");
    const res = await markWordMastered(userId, word.id);
    if (res.error) {
      patchState(word.id, before);
      setNote(res.error);
    }
    setBusyFor(word.id, false);
  }

  const FILTERS: { id: ViewFilter; label: string; n: number }[] = [
    { id: "all", label: "Бүгд", n: counts.total },
    { id: "todo", label: "Тэмдэглээгүй", n: counts.total - counts.learning - counts.mastered },
    { id: "learning", label: "♥ Цээжилж буй", n: counts.learning },
    { id: "mastered", label: "✓ Цээжилсэн", n: counts.mastered },
  ];

  return (
    <MobileAppShell activeTab="kanji" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title="HSK түвшний үгс"
        subtitle="Мэдэхгүй үгээ ♥ дарж цээжлэх жагсаалтдаа нэм. Мэддэг үгээ ✓ дарж алгас."
      />

      <div className="bs-lvw-tabs" role="tablist" aria-label="HSK түвшин">
        {LEVELS.map((lv) => (
          <button
            key={lv}
            type="button"
            role="tab"
            aria-selected={lv === level}
            className={`bs-lvw-tab ${lv === level ? "bs-lvw-tab--on" : ""}`}
            onClick={() => {
              setShown(PAGE);
              router.replace(`/dictionary/levels?level=${lv}`, { scroll: false });
            }}
          >
            HSK {lv}
          </button>
        ))}
      </div>

      <div className="bs-lvw-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`bs-srs-words-filter ${view === f.id ? "bs-srs-words-filter--on" : ""}`}
            onClick={() => {
              setView(f.id);
              setShown(PAGE);
            }}
          >
            {f.label} {words ? f.n : ""}
          </button>
        ))}
      </div>

      {authChecked && !userId ? (
        <p className="bs-lvw-note">
          Үг хадгалахын тулд{" "}
          <Link href="/login" className="underline">
            нэвтэрнэ үү
          </Link>
          .
        </p>
      ) : null}
      {note ? (
        <p className="bs-lvw-note bs-lvw-note--warn" role="status">
          {note}
        </p>
      ) : null}
      {words == null ? (
        <p className="py-10 text-center text-sm text-[var(--app-muted)]">Ачааллаж байна…</p>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--app-muted)]">Энэ шүүлтүүрт үг алга.</p>
      ) : (
        <>
          <ul className="bs-lvw-list">
            {visible.slice(0, shown).map((w) => {
              const s = states.get(w.id);
              return (
                <li key={w.id} className={`bs-lvw-row ${s === "mastered" ? "bs-lvw-row--done" : ""}`}>
                  <Link href={`/dictionary?q=${encodeURIComponent(w.simplified)}`} className="bs-lvw-word">
                    <span className="bs-lvw-hanzi hanzi" translate="no">
                      {w.simplified}
                    </span>
                    <span className="bs-lvw-text">
                      <span className="bs-lvw-pinyin">{w.pinyin}</span>
                      <span className="bs-lvw-mn" translate="no">
                        {w.meaning_mn}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className={`bs-lvw-btn bs-lvw-btn--known ${s === "mastered" ? "bs-lvw-btn--known-on" : ""}`}
                    aria-label={s === "mastered" ? "Цээжилсэн" : "Мэднэ гэж тэмдэглэх"}
                    aria-pressed={s === "mastered"}
                    disabled={busy.has(w.id) || s === "mastered"}
                    onClick={() => void markKnown(w)}
                  >
                    <span aria-hidden>✓</span>
                    <small>Мэднэ</small>
                  </button>
                  <button
                    type="button"
                    className={`bs-lvw-btn bs-lvw-btn--heart ${s === "learning" ? "bs-lvw-btn--heart-on" : ""}`}
                    aria-label={s ? "Жагсаалтаас хасах" : "Цээжлэх жагсаалтад нэмэх"}
                    aria-pressed={s === "learning"}
                    disabled={busy.has(w.id)}
                    onClick={() => void toggleHeart(w)}
                  >
                    <span aria-hidden>{s === "learning" ? "♥" : "♡"}</span>
                    <small>Цээжлэх</small>
                  </button>
                </li>
              );
            })}
          </ul>
          {visible.length > shown ? (
            <button type="button" className="bs-lvw-more" onClick={() => setShown((n) => n + PAGE * 2)}>
              Цааш үзэх ({visible.length - shown} үг үлдсэн)
            </button>
          ) : null}
          {/* Доор хөвөх «Тоглож цээжлэх» мөр сүүлийн үг, товчийг халхлахгүй байх зай. */}
          {counts.learning > 0 ? <div className="bs-lvw-spacer" aria-hidden /> : null}
        </>
      )}
      {counts.learning > 0 ? (
        <div className="bs-lvw-play">
          <span className="bs-lvw-play-count">
            ♥ {counts.learning} үг
          </span>
          {counts.learning >= 2 ? (
            <>
              <Link
                href={`/games/learn?mylevel=${level}&preset=tone`}
                className="bs-lvw-play-btn bs-lvw-play-btn--tone"
              >
                🎵 Хөг
              </Link>
              <Link href={`/games/learn?mylevel=${level}`} className="bs-lvw-play-btn">
                ▶ Тоглох
              </Link>
            </>
          ) : (
            <span className="bs-lvw-play-hint">Тоглохын тулд 2+ үг сонго</span>
          )}
        </div>
      ) : null}
    </MobileAppShell>
  );
}
