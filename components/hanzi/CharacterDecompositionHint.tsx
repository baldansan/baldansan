"use client";

import { useEffect, useState } from "react";
import {
  loadFullCharBreakdownView,
  type CharBreakdownView,
} from "@/lib/hanzi/char-breakdown-data";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  HanziBreakdownParts,
  HanziRadicalLine,
  HanziTypeBadge,
} from "@/components/hanzi/hanzi-breakdown-parts";

type Props = {
  char: string;
  /** Show hanzi prefix when multiple rows appear under one vocab card. */
  showCharLabel?: boolean;
};

/**
 * Compact breakdown hint from the verified dataset (char_breakdown_full.json):
 * type badge, parts with role tags (tap to expand second level), 部首 line,
 * explanation by UI locale.
 */
export function CharacterDecompositionHint({
  char,
  showCharLabel = false,
}: Props) {
  const locale = useUiLocale();
  const [loaded, setLoaded] = useState<{
    char: string;
    view: CharBreakdownView | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadFullCharBreakdownView(char)
      .then((v) => {
        if (!cancelled) setLoaded({ char, view: v });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ char, view: null });
      });
    return () => {
      cancelled = true;
    };
  }, [char]);

  const view = loaded?.char === char ? loaded.view : null;
  if (!view) return null;

  const parts = view.incomplete || view.parts.length < 2 ? [] : view.parts;
  const explanation =
    locale === "zh"
      ? view.explanationZh || view.etymology_mn
      : view.etymology_mn || view.explanationZh;
  if (parts.length === 0 && !explanation) return null;

  return (
    <div className="bs-decomp-hint">
      <p className="bs-decomp-hint-label">
        {showCharLabel ? (
          <>
            <span className="bs-decomp-hint-char">{char}</span> ·{" "}
            {tr(locale, "Бүрдэл")}
          </>
        ) : (
          tr(locale, "Бүрдэл")
        )}{" "}
        <HanziTypeBadge type={view.type} locale={locale} />
      </p>
      {parts.length > 0 ? (
        <HanziBreakdownParts parts={parts} locale={locale} parent={char} />
      ) : null}
      {view.radicalLine ? (
        <HanziRadicalLine
          glyph={view.radicalLine.glyph}
          labelMn={view.radicalLine.labelMn}
          labelZh={view.radicalLine.labelZh}
          locale={locale}
        />
      ) : null}
      {explanation ? (
        <p className="bs-decomp-etym" translate="no">
          {explanation}
        </p>
      ) : null}
      {locale === "mn" && view.mnemonic_mn ? (
        <p className="bs-decomp-etym" translate="no">
          💡 {view.mnemonic_mn}
        </p>
      ) : null}
    </div>
  );
}
