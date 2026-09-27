"use client";

/**
 * Хэвлэх хуудас (A4): ханз бүрд зураасны дараалал (мини SVG) + 10 田字格 нүд.
 * Дэлгэц дээр ч уншигдана; «Хэвлэх» → window.print().
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getList } from "@/lib/writing/store";
import type { WritingList } from "@/lib/writing/types";
import "@/components/writing/writing.css";

type StrokeData = { strokes: string[] };

const PRINT_CELLS = 10;

function StrokeSequence({ strokes }: { strokes: string[] }) {
  return (
    <div className="wn-print-strokes" aria-hidden>
      {strokes.map((_, k) => (
        <svg key={k} className="wn-print-stroke" viewBox="0 0 1024 1024">
          <g transform="scale(1,-1) translate(0,-900)">
            {strokes.slice(0, k + 1).map((d, j) => (
              <path key={j} d={d} fill={j === k ? "#111827" : "#c4c4c4"} />
            ))}
          </g>
        </svg>
      ))}
    </div>
  );
}

function CellRow({ ch }: { ch: string }) {
  return (
    <div className="wn-print-grid" translate="no">
      {Array.from({ length: PRINT_CELLS }, (_, i) => (
        <span
          key={i}
          className={`wn-print-cell ${i === 0 ? "is-trace" : i === 1 ? "is-faint" : "is-empty"}`}
        >
          {i < 2 ? ch : ""}
        </span>
      ))}
    </div>
  );
}

export function WritingPrintClient({ listId }: { listId: string }) {
  const locale = useUiLocale();
  const [list, setList] = useState<WritingList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let alive = true;
    void getList(listId).then(async (res) => {
      if (!alive) return;
      if (res.error || !res.data) {
        setError(res.error ?? "Дэвтэр олдсонгүй.");
        return;
      }
      setList(res.data);
      const entries = await Promise.all(
        res.data.items.map(async (item) => {
          try {
            const r = await fetch(`/api/hanzi/${encodeURIComponent(item.ch)}`);
            if (!r.ok) return [item.ch, []] as const;
            const json = (await r.json()) as StrokeData;
            return [item.ch, Array.isArray(json.strokes) ? json.strokes : []] as const;
          } catch {
            return [item.ch, []] as const;
          }
        })
      );
      if (!alive) return;
      setStrokes(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
  }, [listId]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="wn-print-page min-h-screen">
      <div className="wn-no-print mx-auto flex max-w-[190mm] flex-wrap items-center gap-3 px-4 pt-4 pr-28">
        <Link href={`/writing/${listId}`} className="text-sm font-medium text-slate-600 hover:text-emerald-600">
          {tr(locale, "← Дэвтэр рүү")}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
        >
          🖨 {tr(locale, "Хэвлэх")}
        </button>
      </div>

      <div className="wn-print-sheet">
        {error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : !list ? (
          <p className="text-sm text-slate-500">{tr(locale, "Ачааллаж байна…")}</p>
        ) : (
          <>
            <header className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-2 border-slate-800 pb-2">
              <div>
                <h1 className="text-lg font-bold" translate="no">
                  ✍️ {list.title}
                </h1>
                <p className="text-xs text-slate-600">
                  {tr(locale, "Бичих дэвтэр")} · {list.items.length} {tr(locale, "ханз")} · {today}
                </p>
              </div>
              <p className="text-xs text-slate-700">
                {tr(locale, "Нэр")}: ________________________
              </p>
            </header>

            {list.items.map((item) => (
              <section key={item.ch} className="wn-print-row">
                <div className="wn-print-meta" translate="no">
                  <b>{item.ch}</b>
                  <span>{item.pinyin ?? ""}</span>
                  <span>{item.meaning_mn ? `· ${item.meaning_mn}` : ""}</span>
                  {item.word && item.word !== item.ch ? <span>· {item.word}</span> : null}
                  {strokes[item.ch]?.length ? (
                    <span className="text-slate-400">
                      · {strokes[item.ch]!.length} {tr(locale, "зураас")}
                    </span>
                  ) : null}
                </div>
                {strokes[item.ch]?.length ? <StrokeSequence strokes={strokes[item.ch]!} /> : null}
                <CellRow ch={item.ch} />
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
