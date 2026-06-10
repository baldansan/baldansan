import Link from "next/link";
import { resolveBreakdownCharsForText } from "@/lib/hanzi/char-breakdown-data";

type Props = {
  text: string;
};

export function WordCharBreakdownPanel({ text }: Props) {
  const views = resolveBreakdownCharsForText(text);
  if (views.length === 0) return null;

  return (
    <div className="bs-srs-decomp">
      <p className="bs-srs-decomp-title">🧩 Ханзны задаргаа</p>
      {views.map((view) => (
        <div key={view.char} className="bs-srs-decomp-block">
          {views.length > 1 ? (
            <p className="bs-srs-decomp-char">{view.char}</p>
          ) : null}
          {view.structure ? (
            <p className="bs-srs-decomp-structure">{view.structure}</p>
          ) : null}
          {view.parts.length > 0 ? (
            <div className="bs-srs-decomp-row">
              {view.parts.map((part, index) => (
                <span
                  key={`${part.c}-${index}`}
                  className="bs-srs-decomp-chip"
                >
                  <span className="bs-srs-decomp-chip-icon" aria-hidden>
                    {part.icon}
                  </span>
                  <span className="bs-srs-decomp-chip-glyph">{part.c}</span>
                  <span className="bs-srs-decomp-chip-name">{part.name}</span>
                </span>
              ))}
            </div>
          ) : null}
          {view.etymology_mn ? (
            <p className="bs-srs-decomp-etym">💡 {view.etymology_mn}</p>
          ) : null}
        </div>
      ))}
      <Link href="/games/radical" className="bs-srs-decomp-link">
        Задлах тоглоом руу →
      </Link>
    </div>
  );
}
