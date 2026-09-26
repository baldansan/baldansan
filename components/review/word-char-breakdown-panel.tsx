"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  resolveWordBreakdownViewsAsync,
  type CharBreakdownView,
} from "@/lib/hanzi/char-breakdown-data";
import { ConfusableChars } from "@/components/hanzi/confusable-chars";
import {
  HanziBreakdownParts,
  HanziRadicalLine,
  HanziTypeBadge,
  pickBreakdownLabel,
} from "@/components/hanzi/hanzi-breakdown-parts";

type Props = {
  text: string;
  /** Catalog radical for last-resort fallback when no breakdown entry exists. */
  wordRadical?: string | null;
};

function BreakdownBlock({
  view,
  showCharLabel,
}: {
  view: CharBreakdownView;
  showCharLabel: boolean;
}) {
  const locale = useUiLocale();
  const radical = view.radicalLine ?? view.radicalFallback;
  const structure = pickBreakdownLabel(locale, view.structure, view.structureZh);
  const explanation =
    locale === "zh"
      ? view.explanationZh || view.etymology_mn
      : view.etymology_mn || view.explanationZh;

  return (
    <div className="bs-srs-decomp-block">
      {showCharLabel || view.type ? (
        <p className="bs-srs-decomp-char">
          {showCharLabel ? <span translate="no">{view.char}</span> : null}
          <HanziTypeBadge type={view.type} locale={locale} />
        </p>
      ) : null}
      {view.parts.length > 0 ? (
        <HanziBreakdownParts parts={view.parts} locale={locale} />
      ) : null}
      {structure ? (
        <p className="bs-srs-decomp-line">
          <span className="bs-srs-decomp-k">{tr(locale, "Бүтэц:")}</span>{" "}
          <span translate="no">{structure}</span>
        </p>
      ) : null}
      {radical ? (
        <HanziRadicalLine
          glyph={radical.glyph}
          labelMn={radical.labelMn}
          labelZh={view.radicalLine?.labelZh ?? null}
          locale={locale}
        />
      ) : null}
      {explanation ? (
        <p
          className={
            view.etymologyRich ? "bs-srs-decomp-etym" : "bs-srs-decomp-desc"
          }
          translate="no"
        >
          {view.etymologyRich ? `💡 ${explanation}` : explanation}
        </p>
      ) : null}
      {locale === "mn" && view.mnemonic_mn ? (
        <p className="bs-srs-decomp-etym" translate="no">
          💡 {view.mnemonic_mn}
        </p>
      ) : null}
    </div>
  );
}

export function WordCharBreakdownPanel({ text, wordRadical }: Props) {
  const locale = useUiLocale();
  const requestKey = `${text}\u0000${wordRadical ?? ""}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    views: CharBreakdownView[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const key = `${text}\u0000${wordRadical ?? ""}`;

    void resolveWordBreakdownViewsAsync(text, wordRadical)
      .then((resolved) => {
        if (!cancelled) setLoaded({ key, views: resolved });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, views: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [text, wordRadical]);

  const views = loaded?.key === requestKey ? loaded.views : null;
  if (!views || views.length === 0) return null;

  const showCharLabels = views.length > 1;

  return (
    <div className="bs-srs-decomp">
      <p className="bs-srs-decomp-title">{tr(locale, "🧩 Ханзны задаргаа")}</p>
      {views.map((view) => (
        <BreakdownBlock
          key={view.char}
          view={view}
          showCharLabel={showCharLabels}
        />
      ))}
      <ConfusableChars text={text} />
      <Link href="/games/radical" className="bs-srs-decomp-link">
        {tr(locale, "Задлах тоглоом руу →")}
      </Link>
    </div>
  );
}
