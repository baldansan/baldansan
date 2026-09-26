"use client";

import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ensureCharBreakdownFullLoaded,
  getFullBreakdownEntry,
  getFullComponentKind,
  getFullComponentMn,
  getFullComponentZh,
  isCharBreakdownFullLoaded,
} from "@/lib/hanzi/char-breakdown-full";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

export type HanziPartPopoverProps = {
  /** The tapped part, e.g. 占. */
  glyph: string;
  /** The character the part belongs to, e.g. 点. */
  parent?: string;
  /**
   * All parts of the parent in order (including `glyph`), e.g. ["占", "灬"] —
   * used for the "占 + 灬 = 点" line. Use "?" for a slot that must stay hidden.
   */
  parts?: string[];
  /** Index of `glyph` in `parts` (for repeated glyphs, e.g. 林 = 木 + 木). */
  partIndex?: number;
  /** Fallback labels when the dataset has nothing for the glyph. */
  fallbackMn?: string;
  fallbackZh?: string;
  /** Fallback pinyin (e.g. the phonetic part's `py`). */
  fallbackPinyin?: string;
  role?: "sem" | "pho";
  onClose: () => void;
};

type SubPart = { ch: string; label: string };

function clean(s: string | null | undefined, glyph?: string): string {
  const v = s?.trim() ?? "";
  if (!v || v === "—" || v === glyph) return "";
  return v;
}

/**
 * Compact sheet for one hanzi part (部件): glyph, pinyin, meaning by UI locale,
 * kind / 偏旁 tag, its own parts (if it decomposes further) and the
 * "占 + 灬 = 点" line. Closes on backdrop tap, ✕ or Escape.
 */
export function HanziPartPopover({
  glyph,
  parent,
  parts,
  partIndex,
  fallbackMn,
  fallbackZh,
  fallbackPinyin,
  role,
  onClose,
}: HanziPartPopoverProps) {
  const locale = useUiLocale();
  const [loaded, setLoaded] = useState(() => isCharBreakdownFullLoaded());

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    void ensureCharBreakdownFullLoaded().then((ok) => {
      if (!cancelled && ok) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const entry = loaded ? getFullBreakdownEntry(glyph) : null;
  const parentEntry = loaded && parent ? getFullBreakdownEntry(parent) : null;
  const compMn = loaded ? clean(getFullComponentMn(glyph), glyph) : "";
  const compZh = loaded ? clean(getFullComponentZh(glyph), glyph) : "";
  const kind = loaded ? getFullComponentKind(glyph) : "";

  const pinyin = clean(entry?.p) || clean(fallbackPinyin);
  const mnMeaning = clean(entry?.m) || compMn || clean(fallbackMn, glyph);
  const zhMeaning = compZh || clean(fallbackZh, glyph) || clean(entry?.ez);
  const meaning =
    locale === "zh" ? zhMeaning || mnMeaning : mnMeaning || zhMeaning;

  const kindLabel =
    kind === "radical"
      ? tr(locale, "Хэсэг (偏旁)")
      : kind === "stroke"
        ? tr(locale, "Зураас")
        : kind === "char"
          ? tr(locale, "Бие даасан ханз")
          : "";
  const radicalName =
    kind === "radical" && compZh && compZh !== meaning ? compZh : "";

  const subLabel = (ch: string, mn?: string, zh?: string) => {
    const m = clean(mn, ch) || (loaded ? clean(getFullComponentMn(ch), ch) : "");
    const z = clean(zh, ch) || (loaded ? clean(getFullComponentZh(ch), ch) : "");
    return locale === "zh" ? z || m : m || z;
  };
  let subParts: SubPart[] = [];
  if (entry?.c && entry.c.length >= 2 && !entry.inc) {
    subParts = entry.c.map((c) => ({ ch: c.ch, label: subLabel(c.ch, c.mn, c.zh) }));
  } else {
    const sub = parentEntry?.sub?.[glyph] ?? entry?.sub?.[glyph];
    if (sub && sub.length >= 2) {
      subParts = sub.map((ch) => ({ ch, label: subLabel(ch) }));
    }
  }

  const formulaParts = parts && parts.length >= 2 ? parts : null;
  const parentPinyin = clean(parentEntry?.p);
  const parentMeaning =
    locale === "zh" ? "" : clean(parentEntry?.m);

  const node = (
    <div
      className="bs-hz-pop-back"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="bs-hz-pop"
        role="dialog"
        aria-modal="true"
        aria-label={glyph}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="bs-hz-pop-close"
          aria-label={tr(locale, "Хаах")}
          onClick={onClose}
        >
          ✕
        </button>
        <div className="bs-hz-pop-head">
          <span className="bs-hz-pop-glyph" translate="no">
            {glyph}
          </span>
          <div className="bs-hz-pop-info">
            {pinyin ? (
              <p className="bs-hz-pop-py" translate="no">
                {pinyin}
              </p>
            ) : null}
            {meaning ? (
              <p className="bs-hz-pop-mn">
                <span className="bs-hz-pop-k">{tr(locale, "Дангаараа")}:</span>{" "}
                <span translate="no">{meaning}</span>
              </p>
            ) : null}
            {kindLabel || role ? (
              <p className="bs-hz-pop-tags">
                {kindLabel ? (
                  <span className="bs-hz-pop-tag">
                    {kindLabel}
                    {radicalName ? (
                      <span translate="no"> · {radicalName}</span>
                    ) : null}
                  </span>
                ) : null}
                {role ? (
                  <span className={`bs-hz-role bs-hz-role--${role}`}>
                    {role === "sem"
                      ? tr(locale, "утга заагч")
                      : tr(locale, "дуудлага заагч")}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        {subParts.length >= 2 ? (
          <div className="bs-hz-pop-sec">
            <p className="bs-hz-pop-sec-title">
              {tr(locale, "Энэ хэсэг өөрөө задарна")}
            </p>
            <p className="bs-hz-pop-row" translate="no">
              <span className="bs-hz-part-glyph">{glyph}</span>
              <span className="bs-hz-plus">=</span>
              {subParts.map((s, i) => (
                <Fragment key={`${s.ch}-${i}`}>
                  {i > 0 ? <span className="bs-hz-plus">+</span> : null}
                  <span className="bs-hz-sub-part">
                    <span className="bs-hz-part-glyph">{s.ch}</span>
                    {s.label ? (
                      <span className="bs-hz-part-name">{s.label}</span>
                    ) : null}
                  </span>
                </Fragment>
              ))}
            </p>
          </div>
        ) : null}

        {parent && formulaParts ? (
          <div className="bs-hz-pop-sec">
            <p className="bs-hz-pop-row" translate="no">
              {formulaParts.map((p, i) => (
                <Fragment key={`${p}-${i}`}>
                  {i > 0 ? <span className="bs-hz-plus">+</span> : null}
                  <span
                    className={`bs-hz-part-glyph${
                      (partIndex != null ? i === partIndex : p === glyph)
                        ? " bs-hz-pop-cur"
                        : ""
                    }`}
                  >
                    {p}
                  </span>
                </Fragment>
              ))}
              <span className="bs-hz-plus">=</span>
              <span className="bs-hz-part-glyph bs-hz-pop-parent">{parent}</span>
              {parentPinyin || parentMeaning ? (
                <span className="bs-hz-part-name">
                  {[parentPinyin, parentMeaning].filter(Boolean).join(" · ")}
                </span>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
