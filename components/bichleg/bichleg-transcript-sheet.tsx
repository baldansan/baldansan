"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VideoSubtitleRow } from "@/lib/bichleg/types";
import { formatSubtitleClock } from "@/lib/bichleg/player-seek";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  subtitles: VideoSubtitleRow[];
  activeIdx: number | null;
  onPick: (sub: VideoSubtitleRow) => void;
  onClose: () => void;
};

/**
 * «☰ Бүх өгүүлбэр» — доод хуудас. 300+ мөр байж болох тул мөр бүр
 * content-visibility:auto (CSS) — дэлгэцэнд ороогүй мөрийг зурахгүй.
 */
export function BichlegTranscriptSheet({ subtitles, activeIdx, onPick, onClose }: Props) {
  const locale = useUiLocale();
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return subtitles;
    return subtitles.filter(
      (s) =>
        (s.zh ?? "").toLowerCase().includes(q) ||
        (s.mn ?? "").toLowerCase().includes(q) ||
        (s.pinyin ?? "").toLowerCase().includes(q)
    );
  }, [subtitles, q]);

  // Идэвхтэй мөрийг харагдуулах (хайлтгүй үед)
  useEffect(() => {
    if (q || activeIdx == null || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-sub-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "center" });
  }, [activeIdx, q]);

  return (
    <div className="bs-bichleg-sheet-backdrop" onClick={onClose}>
      <div
        className="bs-bichleg-sheet bs-bichleg-sheet--transcript"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={tr(locale, "Бүх өгүүлбэр")}
      >
        <div className="bs-bichleg-transcript-head">
          <p className="bs-bichleg-sheet-title" style={{ margin: 0 }}>
            ☰ {tr(locale, "Бүх өгүүлбэр")} · {subtitles.length}
          </p>
          <button
            type="button"
            className="bs-bichleg-transcript-close"
            aria-label={tr(locale, "Хаах")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <input
          type="search"
          className="bs-bichleg-transcript-search"
          placeholder={tr(locale, "Хятад / монгол үгээр хайх…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
        <ul className="bs-bichleg-transcript-list" ref={listRef}>
          {filtered.length === 0 ? (
            <li className="bs-bichleg-key-empty">{tr(locale, "Олдсонгүй")}</li>
          ) : (
            filtered.map((sub) => {
              const on = sub.idx === activeIdx;
              return (
                <li key={sub.id} data-sub-idx={sub.idx}>
                  <button
                    type="button"
                    className={`bs-bichleg-transcript-row${on ? " bs-bichleg-transcript-row--on" : ""}`}
                    onClick={() => onPick(sub)}
                    translate="no"
                  >
                    <span className="bs-bichleg-transcript-time">
                      {formatSubtitleClock(sub.start_sec)}
                    </span>
                    <span className="bs-bichleg-transcript-text">
                      {sub.speaker ? (
                        <span className="bs-bichleg-transcript-speaker">{sub.speaker}</span>
                      ) : null}
                      <span className="bs-bichleg-transcript-zh hanzi">{sub.zh}</span>
                      {sub.mn ? <span className="bs-bichleg-transcript-mn">{sub.mn}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
