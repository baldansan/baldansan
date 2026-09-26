"use client";

import { useState } from "react";
import { tr } from "@/lib/i18n/translate";
import type { UiLocale } from "@/lib/i18n/locale-types";
import type { DecompositionComponent } from "@/lib/hanzi/character-decomposition";
import { HanziPartPopover } from "@/components/hanzi/hanzi-part-popover";

type CharType = "形声" | "会意" | "象形";

/** Content label by UI locale — mn in mn UI, zh in zh UI (fallback to the other). */
export function pickBreakdownLabel(
  locale: UiLocale,
  mn: string | null | undefined,
  zh: string | null | undefined
): string {
  const m = mn && mn !== "—" ? mn.trim() : "";
  const z = zh?.trim() ?? "";
  return locale === "zh" ? z || m : m || z;
}

export function HanziTypeBadge({
  type,
  locale,
  className = "bs-hz-type",
}: {
  type: CharType | null | undefined;
  locale: UiLocale;
  className?: string;
}) {
  if (!type) return null;
  const label =
    type === "形声"
      ? tr(locale, "Утга-дуудлагын ханз")
      : type === "会意"
        ? tr(locale, "Утга нийлсэн ханз")
        : tr(locale, "Зураг ханз");
  return (
    <span className={className}>
      {locale === "zh" ? label : `${label} · ${type}字`}
    </span>
  );
}

export function HanziRoleTag({
  role,
  locale,
  className = "bs-hz-role",
}: {
  role: "sem" | "pho" | undefined;
  locale: UiLocale;
  className?: string;
}) {
  if (!role) return null;
  return (
    <span className={`${className} ${className}--${role}`}>
      {role === "sem" ? tr(locale, "утга заагч") : tr(locale, "дуудлага заагч")}
    </span>
  );
}

/**
 * Parts row: glyph + icon + label (mn/zh by locale) + role tag. Tapping a part
 * opens its own card (HanziPartPopover: pinyin, meaning, 偏旁, its own parts,
 * "占 + 灬 = 点"). A part with a second-level decomposition (`sub`) also keeps
 * the small inline "▾ Задлах" toggle.
 */
export function HanziBreakdownParts({
  parts,
  locale,
  parent,
}: {
  parts: DecompositionComponent[];
  locale: UiLocale;
  /** The character these parts build (for the "占 + 灬 = 点" line). */
  parent?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [popIndex, setPopIndex] = useState<number | null>(null);
  if (parts.length === 0) return null;

  const openPart = parts.find((p) => p.c === open && p.sub?.length);
  const popPart = popIndex != null ? parts[popIndex] : undefined;
  const glyphs = parts.map((p) => p.c);

  return (
    <div className="bs-hz-parts">
      <div className="bs-hz-parts-row">
        {parts.map((part, index) => {
          const label = pickBreakdownLabel(locale, part.name, part.nameZh);
          const expandable = Boolean(part.sub?.length);
          const isOpen = expandable && open === part.c;
          return (
            <span key={`${part.c}-${index}`} className="bs-hz-part-wrap">
              {index > 0 ? (
                <span className="bs-hz-plus" aria-hidden>
                  +
                </span>
              ) : null}
              <button
                type="button"
                className={`bs-hz-part bs-hz-part--tap${isOpen ? " bs-hz-part--open" : ""}`}
                aria-haspopup="dialog"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopIndex(index);
                }}
              >
                <span className="bs-hz-part-top">
                  <span className="bs-hz-part-icon" aria-hidden>
                    {part.icon}
                  </span>
                  <span className="bs-hz-part-glyph" translate="no">
                    {part.c}
                  </span>
                  {part.role === "pho" && part.py ? (
                    <span className="bs-hz-part-py" translate="no">
                      {part.py}
                    </span>
                  ) : null}
                </span>
                {label ? (
                  <span className="bs-hz-part-name" translate="no">
                    {label}
                  </span>
                ) : null}
                <HanziRoleTag role={part.role} locale={locale} />
                {expandable ? (
                  <span
                    role="button"
                    tabIndex={0}
                    className="bs-hz-part-expand"
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(isOpen ? null : part.c);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(isOpen ? null : part.c);
                      }
                    }}
                  >
                    {isOpen ? `▴ ${tr(locale, "Хураах")}` : `▾ ${tr(locale, "Задлах")}`}
                  </span>
                ) : null}
              </button>
            </span>
          );
        })}
      </div>
      {openPart?.sub ? (
        <div className="bs-hz-sub">
          <span className="bs-hz-sub-head" translate="no">
            {openPart.c} =
          </span>
          {openPart.sub.map((s, i) => {
            const label = pickBreakdownLabel(locale, s.name, s.nameZh);
            return (
              <span key={`${s.c}-${i}`} className="bs-hz-sub-part">
                {i > 0 ? <span className="bs-hz-plus">+</span> : null}
                <span className="bs-hz-part-glyph" translate="no">
                  {s.c}
                </span>
                {label ? (
                  <span className="bs-hz-part-name" translate="no">
                    {label}
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
      {popPart ? (
        <HanziPartPopover
          glyph={popPart.c}
          parent={parent}
          parts={parent ? glyphs : undefined}
          partIndex={popIndex ?? undefined}
          fallbackMn={popPart.name}
          fallbackZh={popPart.nameZh}
          fallbackPinyin={popPart.py}
          role={popPart.role}
          onClose={() => setPopIndex(null)}
        />
      ) : null}
    </div>
  );
}

/** "部首 讠 (үг)" line — the 部首 tag is a small pill. */
export function HanziRadicalLine({
  glyph,
  labelMn,
  labelZh,
  locale,
}: {
  glyph: string;
  labelMn?: string | null;
  labelZh?: string | null;
  locale: UiLocale;
}) {
  const label = pickBreakdownLabel(locale, labelMn, labelZh);
  return (
    <p className="bs-hz-radical">
      <span className="bs-hz-radical-tag">{tr(locale, "Язгуур (部首)")}</span>{" "}
      <span className="bs-hz-part-glyph" translate="no">
        {glyph}
      </span>
      {label ? (
        <span className="bs-hz-part-name" translate="no">
          {" "}
          {label}
        </span>
      ) : null}
    </p>
  );
}
