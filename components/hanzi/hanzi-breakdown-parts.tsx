"use client";

import { useState } from "react";
import { tr } from "@/lib/i18n/translate";
import type { UiLocale } from "@/lib/i18n/locale-types";
import type { DecompositionComponent } from "@/lib/hanzi/character-decomposition";

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
 * Parts row: glyph + icon + label (mn/zh by locale) + role tag. A part that
 * has a second-level decomposition (`sub`) can be tapped to expand it inline.
 */
export function HanziBreakdownParts({
  parts,
  locale,
}: {
  parts: DecompositionComponent[];
  locale: UiLocale;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (parts.length === 0) return null;

  const openPart = parts.find((p) => p.c === open && p.sub?.length);

  return (
    <div className="bs-hz-parts">
      <div className="bs-hz-parts-row">
        {parts.map((part, index) => {
          const label = pickBreakdownLabel(locale, part.name, part.nameZh);
          const expandable = Boolean(part.sub?.length);
          const isOpen = expandable && open === part.c;
          const body = (
            <>
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
                <span className="bs-hz-part-expand">
                  {isOpen ? `▴ ${tr(locale, "Хураах")}` : `▾ ${tr(locale, "Задлах")}`}
                </span>
              ) : null}
            </>
          );
          return (
            <span key={`${part.c}-${index}`} className="bs-hz-part-wrap">
              {index > 0 ? (
                <span className="bs-hz-plus" aria-hidden>
                  +
                </span>
              ) : null}
              {expandable ? (
                <button
                  type="button"
                  className={`bs-hz-part bs-hz-part--btn${isOpen ? " bs-hz-part--open" : ""}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : part.c)}
                >
                  {body}
                </button>
              ) : (
                <span className="bs-hz-part">{body}</span>
              )}
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
