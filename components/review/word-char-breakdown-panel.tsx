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

type Props = {
  text: string;
  /** Catalog radical for last-resort fallback when no breakdown entry exists. */
  wordRadical?: string | null;
};

function formatComponentPart(part: CharBreakdownView["parts"][number]): string {
  if (part.name) return `${part.c} (${part.name})`;
  return part.c;
}

function BreakdownBlock({
  view,
  showCharLabel,
}: {
  view: CharBreakdownView;
  showCharLabel: boolean;
}) {
  const locale = useUiLocale();
  const radical = view.radicalLine ?? view.radicalFallback;

  return (
    <div className="bs-srs-decomp-block">
      {showCharLabel ? (
        <p className="bs-srs-decomp-char">{view.char}</p>
      ) : null}
      {view.parts.length > 0 ? (
        <p className="bs-srs-decomp-line">
          <span className="bs-srs-decomp-k">{tr(locale, "Бүрэлдэхүүн:")}</span>{" "}
          {view.parts.map(formatComponentPart).join(" + ")}
        </p>
      ) : null}
      {view.structure ? (
        <p className="bs-srs-decomp-line">
          <span className="bs-srs-decomp-k">{tr(locale, "Бүтэц:")}</span> {view.structure}
        </p>
      ) : null}
      {radical ? (
        <p className="bs-srs-decomp-line">
          <span className="bs-srs-decomp-k">{tr(locale, "Язгуур:")}</span> {radical.glyph}
          {radical.labelMn ? ` (${radical.labelMn})` : null}
        </p>
      ) : null}
      {view.etymology_mn ? (
        <p
          className={
            view.etymologyRich
              ? "bs-srs-decomp-etym"
              : "bs-srs-decomp-desc"
          }
        >
          {view.etymologyRich ? `💡 ${view.etymology_mn}` : view.etymology_mn}
        </p>
      ) : null}
    </div>
  );
}

export function WordCharBreakdownPanel({ text, wordRadical }: Props) {
  const locale = useUiLocale();
  const [views, setViews] = useState<CharBreakdownView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setViews(null);

    void resolveWordBreakdownViewsAsync(text, wordRadical)
      .then((resolved) => {
        if (!cancelled) setViews(resolved);
      })
      .catch(() => {
        if (!cancelled) setViews([]);
      });

    return () => {
      cancelled = true;
    };
  }, [text, wordRadical]);

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
