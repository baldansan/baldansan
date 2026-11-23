"use client";

/**
 * Хэвлэх дэвтэр (/writing/sheet): үндсэн зурлага эсвэл өөрийн ханзаар
 * 田字格 / 米字格 дэвтрийн хуудас үүсгэж A4-өөр хэвлэнэ (эсвэл PDF болгон хадгална).
 * Бичмэл (楷体) хэлбэр нь hanzi-writer-data-ийн зурлагын SVG зам.
 * Мөр бүр нэг SVG — нүдний хүрээ давхардахгүй, хэвлэхэд вектор хэвээр гарна.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { hanziCdnUrl } from "@/lib/hanzi/character-data-loader";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { BASIC_STROKES } from "@/lib/writing/basic-strokes";
import { getList } from "@/lib/writing/store";
import "@/components/writing/writing-sheet.css";

type GridKind = "tian" | "mi" | "plain";
type TraceMode = "all" | "half" | "none";
type Source = "strokes" | "hanzi";

type Settings = {
  source: Source;
  strokeIds: string[];
  text: string;
  grid: GridKind;
  color: string;
  cell: number;
  trace: TraceMode;
  rowsPer: number;
  showOrder: boolean;
  showHeader: boolean;
  fillPage: boolean;
};

const STORE_KEY = "bs:writingSheet.v1";
const MAX_HANZI = 80;
const HANZI_RE = /[一-鿿]/g;

const COLORS: { id: string; label: string; value: string }[] = [
  { id: "blue", label: "Цэнхэр", value: "#1a9ad6" },
  { id: "red", label: "Улаан", value: "#e0483e" },
  { id: "green", label: "Ногоон", value: "#2e9e5b" },
  { id: "purple", label: "Ягаан", value: "#7c4ddb" },
  { id: "gray", label: "Саарал", value: "#7d838c" },
];

/** A4-ийн хэвлэх өргөн 190 мм-т багтах нүдний хэмжээ. 15 мм = сургуулийн 田字格 дэвтрийн нүд. */
const CELL_SIZES: { mm: number; cols: number; label: string }[] = [
  { mm: 12, cols: 15, label: "12 мм · жижиг" },
  { mm: 15, cols: 12, label: "15 мм · дэвтрийн" },
  { mm: 18, cols: 10, label: "18 мм · том" },
];

const DEFAULTS: Settings = {
  source: "strokes",
  strokeIds: BASIC_STROKES.map((s) => s.id),
  text: "",
  grid: "mi",
  color: COLORS[0]!.value,
  cell: 15,
  trace: "all",
  rowsPer: 1,
  showOrder: true,
  showHeader: true,
  fillPage: true,
};

const INK = "#1f2328";
const TRACE = "#b4b8be";
const STEP_PREV = "#4b5563";
const STEP_NOW = "#dc2626";

/** Нэг нүдний агуулга. */
type Cell =
  | { kind: "empty" }
  | { kind: "full"; ch: string; tone: "ink" | "trace" }
  | { kind: "step"; ch: string; upto: number }
  | { kind: "stroke"; ch: string; idx: number; tone: "ink" | "trace" };

type Row = { key: string; cells: Cell[] };

function uniqueHanzi(text: string): string[] {
  const out: string[] = [];
  for (const ch of text.match(HANZI_RE) ?? []) {
    if (!out.includes(ch)) out.push(ch);
    if (out.length >= MAX_HANZI) break;
  }
  return out;
}

function pathId(ch: string, idx: number): string {
  return `ws-p-${ch.codePointAt(0)!.toString(16)}-${idx}`;
}

/** Зурлагын замын хүрээ (дэлгэцийн координатаар: y = 900 − Y). Хяналтын цэгүүдийг оролцуулсан ойролцоо хүрээ. */
function strokeBox(d: string): { cx: number; cy: number; size: number } {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]!;
    const y = 900 - nums[i + 1]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) return { cx: 512, cy: 512, size: 1024 };
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    size: Math.max(maxX - minX, maxY - minY, 1),
  };
}

function practiceRow(cols: number, trace: TraceMode, model: Cell, traceCell: Cell): Cell[] {
  const traceCount = trace === "all" ? cols - 1 : trace === "half" ? Math.floor((cols - 1) / 2) : 0;
  const cells: Cell[] = [model];
  for (let i = 1; i < cols; i++) cells.push(i <= traceCount ? traceCell : { kind: "empty" });
  return cells;
}

function buildRows(s: Settings, cols: number, data: Record<string, string[]>): Row[] {
  const rows: Row[] = [];
  if (s.source === "strokes") {
    for (const st of BASIC_STROKES) {
      if (!s.strokeIds.includes(st.id)) continue;
      if (!data[st.ch]?.[st.idx]) continue;
      for (let r = 0; r < s.rowsPer; r++) {
        rows.push({
          key: `${st.id}-${r}`,
          cells: practiceRow(
            cols,
            s.trace,
            { kind: "stroke", ch: st.ch, idx: st.idx, tone: "ink" },
            { kind: "stroke", ch: st.ch, idx: st.idx, tone: "trace" }
          ),
        });
      }
    }
    return rows;
  }
  for (const ch of uniqueHanzi(s.text)) {
    const strokes = data[ch];
    if (!strokes?.length) continue;
    if (s.showOrder && strokes.length > 1) {
      // Эхний зурлагаас эхлэн нэг нэгээр нэмэгдэх нүднүүд; мөрийн үлдсэн хэсэгт дуурайх ханз.
      for (let start = 0; start < strokes.length; start += cols) {
        const cells: Cell[] = [];
        for (let k = start; k < Math.min(start + cols, strokes.length); k++) {
          cells.push({ kind: "step", ch, upto: k });
        }
        while (cells.length < cols) {
          cells.push(s.trace === "none" ? { kind: "empty" } : { kind: "full", ch, tone: "trace" });
        }
        rows.push({ key: `${ch}-o${start}`, cells });
      }
    }
    for (let r = 0; r < s.rowsPer; r++) {
      rows.push({
        key: `${ch}-${r}`,
        cells: practiceRow(cols, s.trace, { kind: "full", ch, tone: "ink" }, { kind: "full", ch, tone: "trace" }),
      });
    }
  }
  return rows;
}

const U = 100; // нэг нүд = 100 нэгж
const PAD = 9;
const GLYPH_SCALE = (U - PAD * 2) / 1024;

function CellGlyph({ cell, data }: { cell: Cell; data: Record<string, string[]> }) {
  if (cell.kind === "empty") return null;
  const strokes = data[cell.ch];
  if (!strokes) return null;
  if (cell.kind === "stroke") {
    const d = strokes[cell.idx];
    if (!d) return null;
    const box = strokeBox(d);
    const scale = Math.min(2.2, 760 / box.size);
    return (
      <g transform={`translate(512 512) scale(${scale}) translate(${-box.cx} ${-box.cy})`}>
        <g transform="translate(0 900) scale(1 -1)">
          <use href={`#${pathId(cell.ch, cell.idx)}`} fill={cell.tone === "ink" ? INK : TRACE} />
        </g>
      </g>
    );
  }
  if (cell.kind === "step") {
    return (
      <g transform="translate(0 900) scale(1 -1)">
        {strokes.slice(0, cell.upto + 1).map((_, j) => (
          <use key={j} href={`#${pathId(cell.ch, j)}`} fill={j === cell.upto ? STEP_NOW : STEP_PREV} />
        ))}
      </g>
    );
  }
  return (
    <g transform="translate(0 900) scale(1 -1)" fill={cell.tone === "ink" ? INK : TRACE}>
      {strokes.map((_, j) => (
        <use key={j} href={`#${pathId(cell.ch, j)}`} />
      ))}
    </g>
  );
}

function SheetRow({
  row,
  cols,
  grid,
  color,
  data,
}: {
  row: Row;
  cols: number;
  grid: GridKind;
  color: string;
  data: Record<string, string[]>;
}) {
  const w = cols * U;
  const idx = Array.from({ length: cols }, (_, i) => i);
  return (
    <svg className="ws-row" viewBox={`-1.5 -1.5 ${w + 3} ${U + 3}`} xmlns="http://www.w3.org/2000/svg">
      {grid !== "plain" ? (
        <g stroke={color} strokeWidth={0.8} strokeDasharray="3 2.6" fill="none" opacity={0.85}>
          <line x1={0} y1={U / 2} x2={w} y2={U / 2} />
          {idx.map((i) => (
            <line key={`v${i}`} x1={i * U + U / 2} y1={0} x2={i * U + U / 2} y2={U} />
          ))}
          {grid === "mi"
            ? idx.map((i) => (
                <g key={`d${i}`}>
                  <line x1={i * U} y1={0} x2={(i + 1) * U} y2={U} />
                  <line x1={(i + 1) * U} y1={0} x2={i * U} y2={U} />
                </g>
              ))
            : null}
        </g>
      ) : null}
      <g stroke={color} strokeWidth={2.2} fill="none">
        <rect x={0} y={0} width={w} height={U} />
        {idx.slice(1).map((i) => (
          <line key={i} x1={i * U} y1={0} x2={i * U} y2={U} />
        ))}
      </g>
      {row.cells.map((cell, i) =>
        cell.kind === "empty" ? null : (
          <g key={i} transform={`translate(${i * U + PAD} ${PAD}) scale(${GLYPH_SCALE})`}>
            <CellGlyph cell={cell} data={data} />
          </g>
        )
      )}
    </svg>
  );
}

function GridIcon({ kind, color }: { kind: GridKind; color: string }) {
  return (
    <svg viewBox="-2 -2 104 104" width={34} height={34} aria-hidden>
      {kind !== "plain" ? (
        <g stroke={color} strokeWidth={3} strokeDasharray="7 6" fill="none">
          <line x1={0} y1={50} x2={100} y2={50} />
          <line x1={50} y1={0} x2={50} y2={100} />
          {kind === "mi" ? (
            <>
              <line x1={0} y1={0} x2={100} y2={100} />
              <line x1={100} y1={0} x2={0} y2={100} />
            </>
          ) : null}
        </g>
      ) : null}
      <rect x={0} y={0} width={100} height={100} fill="none" stroke={color} strokeWidth={6} />
    </svg>
  );
}

export function WritingSheetClient({
  initialChars,
  listId,
}: {
  initialChars: string;
  listId: string | null;
}) {
  const locale = useUiLocale();
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Record<string, string[]>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const requested = useRef<Set<string>>(new Set());

  // Хадгалсан тохиргоо + холбоосоор ирсэн ханз.
  useEffect(() => {
    let next: Settings = DEFAULTS;
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) next = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
    } catch {
      /* хадгалалтгүй орчин */
    }
    if (initialChars && uniqueHanzi(initialChars).length) {
      next = { ...next, source: "hanzi", text: uniqueHanzi(initialChars).join("") };
    }
    setS(next);
    setReady(true);
    if (listId) {
      void getList(listId).then((res) => {
        const chars = res.data?.items.map((it) => it.ch).join("") ?? "";
        if (chars) setS((cur) => ({ ...cur, source: "hanzi", text: uniqueHanzi(chars).join("") }));
      });
    }
  }, [initialChars, listId]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {
      /* хадгалалтгүй орчин */
    }
  }, [s, ready]);

  const hanzi = useMemo(() => uniqueHanzi(s.text), [s.text]);
  const needed = useMemo(
    () =>
      s.source === "strokes"
        ? [...new Set(BASIC_STROKES.filter((b) => s.strokeIds.includes(b.id)).map((b) => b.ch))]
        : hanzi,
    [s.source, s.strokeIds, hanzi]
  );

  // Зурлагын өгөгдөл татах (CDN → /api/hanzi).
  useEffect(() => {
    if (!ready) return;
    for (const ch of needed) {
      if (requested.current.has(ch)) continue;
      requested.current.add(ch);
      const load = async (): Promise<string[] | null> => {
        for (const url of [hanziCdnUrl(ch), `/api/hanzi/${encodeURIComponent(ch)}`]) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const json = (await r.json()) as { strokes?: unknown };
            if (Array.isArray(json.strokes) && json.strokes.length) return json.strokes as string[];
          } catch {
            /* дараагийн эх сурвалж */
          }
        }
        return null;
      };
      void load().then((strokes) => {
        if (strokes) setData((cur) => ({ ...cur, [ch]: strokes }));
        else setMissing((cur) => (cur.includes(ch) ? cur : [...cur, ch]));
      });
    }
  }, [needed, ready]);

  // Дэлгэцэнд багтаах (хэвлэхэд zoom 1).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, el.clientWidth / 794));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const size = CELL_SIZES.find((c) => c.mm === s.cell) ?? CELL_SIZES[1]!;
  const gap = 1.5;
  const rows = useMemo(() => buildRows(s, size.cols, data), [s, size.cols, data]);

  // A4: 277 мм хэвлэх өндөр. Эхний хуудсанд толгой мөр орно.
  const perPage = Math.floor((277 - 3.5 + gap) / (size.mm + gap));
  const firstPage = Math.floor((277 - (s.showHeader ? 8 : 0) - 3.5 + gap) / (size.mm + gap));
  const pages = rows.length <= firstPage ? 1 : 1 + Math.ceil((rows.length - firstPage) / perPage);
  const capacity = firstPage + (pages - 1) * perPage;
  const blankRows = s.fillPage && rows.length > 0 ? Math.max(0, capacity - rows.length) : 0;
  const emptyRow: Cell[] = Array.from({ length: size.cols }, () => ({ kind: "empty" }) as Cell);

  const loading = needed.some((ch) => !data[ch] && !missing.includes(ch));
  const usedMissing = needed.filter((ch) => missing.includes(ch));
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setS((cur) => ({ ...cur, [key]: value }));
  const toggleStroke = (id: string) =>
    setS((cur) => ({
      ...cur,
      strokeIds: cur.strokeIds.includes(id) ? cur.strokeIds.filter((x) => x !== id) : [...cur.strokeIds, id],
    }));

  return (
    <div className="ws-page">
      <div className="ws-controls ws-no-print">
        <div className="ws-top">
          <Link href="/writing" className="ws-back">
            {tr(locale, "← Ханзны дэвтэр")}
          </Link>
          <h1>{tr(locale, "Хэвлэх дэвтэр")}</h1>
          <p>{tr(locale, "Зурлага эсвэл ханзаа сонгоод, нүд, өнгөө тохируулж хэвлэ. Цаасан дээр дуурайж бичнэ.")}</p>
        </div>

        <section className="ws-card">
          <h2>1. {tr(locale, "Юу бичих вэ?")}</h2>
          <div className="ws-seg">
            <button type="button" aria-pressed={s.source === "strokes"} onClick={() => set("source", "strokes")}>
              {tr(locale, "Үндсэн зурлага")}
            </button>
            <button type="button" aria-pressed={s.source === "hanzi"} onClick={() => set("source", "hanzi")}>
              {tr(locale, "Ханз")}
            </button>
          </div>

          {s.source === "strokes" ? (
            <>
              <div className="ws-quick">
                <button type="button" onClick={() => set("strokeIds", BASIC_STROKES.map((b) => b.id))}>
                  {tr(locale, "Бүгд")} (32)
                </button>
                <button type="button" onClick={() => set("strokeIds", BASIC_STROKES.slice(0, 16).map((b) => b.id))}>
                  {tr(locale, "Эхний 16")}
                </button>
                <button type="button" onClick={() => set("strokeIds", BASIC_STROKES.slice(16).map((b) => b.id))}>
                  {tr(locale, "Сүүлийн 16")}
                </button>
                <button type="button" onClick={() => set("strokeIds", [])}>
                  {tr(locale, "Цэвэрлэх")}
                </button>
              </div>
              <div className="ws-strokes" translate="no">
                {BASIC_STROKES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={s.strokeIds.includes(b.id)}
                    onClick={() => toggleStroke(b.id)}
                    title={`${b.pinyin} — ${b.mn}`}
                  >
                    <b>{b.zh}</b>
                    <small>{b.mn}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <textarea
                className="ws-text"
                value={s.text}
                onChange={(e) => set("text", e.target.value)}
                rows={3}
                placeholder={tr(locale, "Ханзаа энд бичих эсвэл хуулж тавь. Жишээ: 你好我是蒙古人")}
                translate="no"
              />
              <p className="ws-hint">
                {hanzi.length} {tr(locale, "ханз")}
                {hanzi.length >= MAX_HANZI ? ` · ${tr(locale, "нэг удаад")} ${MAX_HANZI} ${tr(locale, "хүртэл")}` : ""}
                {usedMissing.length ? ` · ${tr(locale, "зурлагын өгөгдөл олдсонгүй")}: ${usedMissing.join(" ")}` : ""}
              </p>
              <label className="ws-check">
                <input type="checkbox" checked={s.showOrder} onChange={(e) => set("showOrder", e.target.checked)} />
                <span>{tr(locale, "Эхний зурлагаас нь нэг нэгээр нэмж харуулах (зурлагын дараалал)")}</span>
              </label>
            </>
          )}
        </section>

        <section className="ws-card">
          <h2>2. {tr(locale, "Дэвтрийн нүд")}</h2>
          <div className="ws-grid-pick">
            {(
              [
                ["tian", "田字格", "Дөрвөн хуваасан"],
                ["mi", "米字格", "Найман хуваасан"],
                ["plain", "方格", "Хоосон дөрвөлжин"],
              ] as const
            ).map(([kind, zh, mn]) => (
              <button key={kind} type="button" aria-pressed={s.grid === kind} onClick={() => set("grid", kind)}>
                <GridIcon kind={kind} color={s.color} />
                <span translate="no">{zh}</span>
                <small>{tr(locale, mn)}</small>
              </button>
            ))}
          </div>

          <h3>{tr(locale, "Зураасны өнгө")}</h3>
          <div className="ws-colors">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={s.color === c.value}
                aria-label={tr(locale, c.label)}
                title={tr(locale, c.label)}
                onClick={() => set("color", c.value)}
                style={{ background: c.value }}
              />
            ))}
          </div>

          <h3>{tr(locale, "Нүдний хэмжээ")}</h3>
          <div className="ws-seg">
            {CELL_SIZES.map((c) => (
              <button key={c.mm} type="button" aria-pressed={s.cell === c.mm} onClick={() => set("cell", c.mm)}>
                {tr(locale, c.label)}
              </button>
            ))}
          </div>
        </section>

        <section className="ws-card">
          <h2>3. {tr(locale, "Хэрхэн давтах вэ?")}</h2>
          <h3>{tr(locale, "Дуурайх саарал загвар")}</h3>
          <div className="ws-seg">
            {(
              [
                ["all", "Мөр дүүрэн"],
                ["half", "Хагас нь, үлдсэнийг өөрөө"],
                ["none", "Зөвхөн эхний нүд"],
              ] as const
            ).map(([mode, label]) => (
              <button key={mode} type="button" aria-pressed={s.trace === mode} onClick={() => set("trace", mode)}>
                {tr(locale, label)}
              </button>
            ))}
          </div>
          <h3>{tr(locale, "Нэг ханзыг хэдэн мөр бичих вэ?")}</h3>
          <div className="ws-seg">
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" aria-pressed={s.rowsPer === n} onClick={() => set("rowsPer", n)}>
                {n} {tr(locale, "мөр")}
              </button>
            ))}
          </div>
          <label className="ws-check">
            <input type="checkbox" checked={s.showHeader} onChange={(e) => set("showHeader", e.target.checked)} />
            <span>{tr(locale, "Нэр, анги, огноо бичих мөр")}</span>
          </label>
          <label className="ws-check">
            <input type="checkbox" checked={s.fillPage} onChange={(e) => set("fillPage", e.target.checked)} />
            <span>{tr(locale, "Хуудасны үлдсэн хэсгийг хоосон мөрөөр дүүргэх")}</span>
          </label>
        </section>

        <div className="ws-print-bar">
          <button type="button" className="ws-print-btn" onClick={() => window.print()} disabled={!rows.length || loading}>
            🖨 {tr(locale, "Хэвлэх / PDF болгох")}
          </button>
          <p>
            {loading
              ? tr(locale, "Зурлагыг ачааллаж байна…")
              : rows.length
                ? `${rows.length} ${tr(locale, "мөр")} · A4 ${pages} ${tr(locale, "хуудас")}`
                : tr(locale, "Зурлага эсвэл ханзаа сонгоно уу.")}
          </p>
          <p className="ws-hint">
            {tr(locale, "PDF файл авах бол хэвлэх цонхонд «Save as PDF / PDF болгон хадгалах»-ыг сонго. Хэмжээг 100% дээр хэвлэ.")}
          </p>
        </div>
      </div>

      <div className="ws-preview" ref={wrapRef}>
        <div
          className="ws-sheet"
          style={{ zoom, ["--ws-cell" as string]: `${size.mm}mm`, ["--ws-cols" as string]: size.cols, ["--ws-gap" as string]: `${gap}mm` }}
          translate="no"
        >
          {/* Зурлагын замууд нэг удаа тодорхойлогдоно — мөрүүд <use>-ээр хэрэглэнэ. */}
          <svg className="ws-defs" aria-hidden>
            <defs>
              {needed.flatMap((ch) =>
                (data[ch] ?? []).map((d, j) => <path key={pathId(ch, j)} id={pathId(ch, j)} d={d} />)
              )}
            </defs>
          </svg>
          {s.showHeader ? (
            <div className="ws-head">
              <span>{tr(locale, "Нэр")}: ______________</span>
              <span>{tr(locale, "Анги")}: __________</span>
              <span>{tr(locale, "Огноо")}: __________</span>
            </div>
          ) : null}
          {rows.map((row) => (
            <SheetRow key={row.key} row={row} cols={size.cols} grid={s.grid} color={s.color} data={data} />
          ))}
          {Array.from({ length: blankRows }, (_, i) => (
            <SheetRow key={`blank-${i}`} row={{ key: `blank-${i}`, cells: emptyRow }} cols={size.cols} grid={s.grid} color={s.color} data={data} />
          ))}
          {rows.length ? <p className="ws-foot">Бөөндөө Сурцгаая · surtsgaay.buunduu.mn</p> : null}
        </div>
      </div>
    </div>
  );
}
