/**
 * Зурлагыг төв шугамаас нь (hanzi-writer-ийн `medians`) 8 үндсэн төрлөөр таних.
 * Сурагчид хятад нэр томьёо харуулахгүй — зөвхөн монгол нэр ба чиглэлийн сум.
 *
 * Координат: hanzi-writer-ийн өгөгдөл (0..1024, Y дээшээ өснө).
 * 32 үндсэн зурлага (lib/writing/basic-strokes.ts) дээр шалгасан (2026-11-28).
 */

export type StrokeKindId =
  | "dot"
  | "heng"
  | "shu"
  | "pie"
  | "na"
  | "ti"
  | "fold"
  | "hook";

export type StrokeKind = {
  id: StrokeKindId;
  /** Монгол нэр (жижиг үсгээр). */
  mn: string;
  /** Чиглэлийн сумнууд, жнь "→ ↓". */
  arrows: string;
};

export const STROKE_KIND_NAMES: Record<StrokeKindId, string> = {
  dot: "цэг",
  heng: "хэвтээ",
  shu: "босоо",
  pie: "зүүн налуу",
  na: "баруун налуу",
  ti: "өргөлт",
  fold: "нугалаас",
  hook: "дэгээ",
};

type Pt = [number, number];

const ARROWS = ["→", "↗", "↑", "↖", "←", "↙", "↓", "↘"];

function arrowFor(dx: number, dy: number): string {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const idx = ((Math.round(deg / 45) % 8) + 8) % 8;
  return ARROWS[idx]!;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Шугамыг нумын уртаар тэнцүү n хэсэгт дахин түүвэрлэнэ. */
function resample(points: Pt[], n: number): Pt[] {
  const total = points.slice(1).reduce((s, p, i) => s + dist(points[i]!, p), 0);
  if (total <= 0) return points;
  const out: Pt[] = [points[0]!];
  const step = total / n;
  let acc = 0;
  let target = step;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const seg = dist(a, b);
    while (seg > 0 && acc + seg >= target - 1e-6 && out.length < n) {
      const t = (target - acc) / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      target += step;
    }
    acc += seg;
  }
  out.push(points[points.length - 1]!);
  return out;
}

function angleDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

type Run = { dx: number; dy: number; len: number };

/** Чиглэл огцом (≥ TURN°) өөрчлөгдөх бүрд шинэ хэсэг эхэлнэ. */
function splitRuns(points: Pt[]): Run[] {
  const TURN = 58;
  const N = 24;
  const pts = resample(points, N);
  const runs: { start: Pt; end: Pt; heading: number; len: number }[] = [];
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const len = dist(a, b);
    if (len < 1e-6) continue;
    const heading = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    const cur = runs[runs.length - 1];
    if (cur) {
      // Хэсгийн ерөнхий чиглэлтэй харьцуулна — аажим муруйлтыг (зүүн налуу г.м.) таслахгүй.
      const runHeading = (Math.atan2(cur.end[1] - cur.start[1], cur.end[0] - cur.start[0]) * 180) / Math.PI;
      if (angleDiff(runHeading, heading) < TURN) {
        cur.end = b;
        cur.len += len;
        continue;
      }
    }
    runs.push({ start: a, end: b, heading, len });
  }
  return runs.map((r) => ({ dx: r.end[0] - r.start[0], dy: r.end[1] - r.start[1], len: r.len }));
}

export function classifyStroke(median: number[][] | null | undefined): StrokeKind | null {
  if (!median || median.length < 2) return null;
  const points = median.map((p) => [Number(p[0]), Number(p[1])] as Pt);
  const total = points.slice(1).reduce((s, p, i) => s + dist(points[i]!, p), 0);
  if (!(total > 0)) return null;

  let runs = splitRuns(points);
  // Эхний/дундын маш богино хэсгийг (үзүүрийн дарц) хөршдөө нийлүүлнэ.
  // Эхний богино хэсэг нь ихэвчлэн үзэгний «дарц» — зурлагын чиглэл биш.
  runs = runs.filter((r, i) => {
    if (i === runs.length - 1) return true;
    return r.len >= total * (i === 0 ? 0.2 : 0.1);
  });
  if (runs.length === 0) return null;

  const first = points[0]!;
  const last = points[points.length - 1]!;

  // Толгойдоо дарцтай зүүн налуу: богино ↘ хэсгийн дараа урт ↙.
  if (
    runs.length === 2 &&
    runs[0]!.len < total * 0.35 &&
    runs[0]!.dy < 0 &&
    runs[0]!.dx >= 0 &&
    runs[1]!.dx < 0 &&
    runs[1]!.dy < 0
  ) {
    runs = [runs[1]!];
  }

  if (runs.length >= 2) {
    const tail = runs[runs.length - 1]!;
    const tailDeg = (Math.atan2(tail.dy, tail.dx) * 180) / Math.PI;
    // Баруун тийш эсвэл доош шулуун төгссөн богино сүүл бол дэгээ биш, нугалаас.
    const plainTail = Math.abs(tailDeg) < 25 || Math.abs(tailDeg + 90) < 25;
    const isHook = tail.len < total * 0.3 && !plainTail;
    if (!isHook || tail.len >= total * 0.07) {
      const arrows = runs.map((r) => arrowFor(r.dx, r.dy));
      const dedup = arrows.filter((a, i) => i === 0 || a !== arrows[i - 1]).join(" ");
      if (isHook) {
        const body = runs.length - 1;
        return {
          id: "hook",
          mn: body >= 2 ? "нугалаастай дэгээ" : "дэгээ",
          arrows: dedup,
        };
      }
      return { id: "fold", mn: STROKE_KIND_NAMES.fold, arrows: dedup };
    }
  }

  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const FIXED: Partial<Record<StrokeKindId, string>> = {
    heng: "→",
    shu: "↓",
    pie: "↙",
    na: "↘",
    ti: "↗",
  };
  const make = (id: StrokeKindId): StrokeKind => ({
    id,
    mn: STROKE_KIND_NAMES[id],
    arrows: FIXED[id] ?? arrowFor(dx, dy),
  });

  // Богино, доош чиглэсэн зурлага = цэг.
  if (total < 190 && dy < 0 && ady > adx * 0.35) return make("dot");
  if (dx > 0 && dy > 0 && ady > adx * 0.28) return make("ti");
  if (adx >= ady * 2.2 && dx > 0) return make("heng");
  if (ady >= adx * 2.4 && dy < 0) return make("shu");
  if (dy < 0 && dx < 0) return make("pie");
  if (dy < 0 && dx > 0) return make("na");
  if (dy > 0) return make("ti");
  return make("heng");
}

export function classifyStrokes(medians: unknown): (StrokeKind | null)[] {
  if (!Array.isArray(medians)) return [];
  return medians.map((m) => classifyStroke(m as number[][]));
}
