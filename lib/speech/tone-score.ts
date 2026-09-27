/**
 * Аялгын оноо (tone-feedback v2): хэрэглэгчийн f0 цэгүүдийг үе бүрээр хувааж,
 * Chao 1..5 шатлалд нормчилж, 4 аялгын жишиг муруйтай харьцуулна.
 * Цэвэр функцууд — DOM хэрэггүй, node дээр тест хийж болно.
 */
import { parsePinyinSyllables, toneContour, type PinyinSyllable } from "./pinyin-tones";
import { smoothPitch, type PitchSample } from "./pitch-recorder";

export const CONTOUR_POINTS = 10;
/** Дуугүй завсар > 120 мс → шинэ үе */
const GAP_S = 0.12;
/** Бүх дуудлагын хэлбэлзэл < 3 хагас өнгө → тэгш гэж үзнэ */
const FLAT_RANGE_ST = 3;

export type ToneStatus = "ok" | "warn" | "bad" | "skip";

export type SyllableScore = {
  syllable: string;
  /** Хүлээгдэж буй аялга (0 = саармаг). Сандхи хэрэглэсэн бол 3→2 болсон байна. */
  tone: number;
  /** Илрүүлсэн аялга; дуу хангалтгүй эсвэл саармаг бол null */
  detected: 1 | 2 | 3 | 4 | null;
  /** 0..1 — хүлээгдэж буй аялгын оноо */
  confidence: number;
  ok: boolean;
  status: ToneStatus;
  /** Нэг мөр зөвлөгөө (монгол). Зөв бол хоосон. */
  hint: string;
  /** Богино тэмдэглэл chip-д (⚠ хэт буурсан) */
  short: string;
  /** Хэрэглэгчийн муруй, Chao 1..5, CONTOUR_POINTS цэг; дуугүй бол [] */
  contour: number[];
  /** Үеийн хугацааны муж (сек) — зурахад */
  t0: number;
  t1: number;
  /** Бүх 4 аялгын оноо (дебаг/дэлгэрэнгүй) */
  scores: [number, number, number, number];
};

export type ToneScoreResult = {
  syllables: SyllableScore[];
  /** Зөв (ok) үеийн тоо / оноолсон үеийн тоо (саармагийг тооцохгүй) */
  correct: number;
  total: number;
  /** Бүх дуудлага тэгш (хэлбэлзэл < 3 хагас өнгө) */
  flat: boolean;
  /** Дуу хангалтгүй — оноо гаргаж чадсангүй */
  empty: boolean;
};

export const TONE_HINTS_MN: Record<number, string> = {
  1: "Тэгш, өндөр барь (ˉ)",
  2: "Дундаас дээш өгс (ˊ)",
  3: "Доош буугаад дараа нь бага зэрэг өгс (ˇ)",
  4: "Дээрээс доош огцом буур (ˋ)",
  0: "Богино, хөнгөн",
};

/** Илрүүлсэн аялга хүлээгдэж буйгаас өөр үед chip дээрх богино тэмдэглэл */
const SHORT_BY_DETECTED: Record<number, string> = {
  1: "хэт тэгш",
  2: "хэт өгссөн",
  3: "дунд нь буусан",
  4: "хэт буурсан",
};
const SHORT_BY_EXPECTED: Record<number, string> = {
  1: "тэгш бус",
  2: "өгссөнгүй",
  3: "буулт алга",
  4: "буураагүй",
};

/* ---------- туслах ---------- */

function semitone(f0: number): number {
  return 12 * Math.log2(f0 / 100);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Ямар ч урттай муруйг n цэгт шугаман интерполяцоор шилжүүлнэ. */
export function resample(points: number[], n: number = CONTOUR_POINTS): number[] {
  if (points.length === 0) return [];
  if (points.length === 1) return new Array(n).fill(points[0]);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const pos = ((points.length - 1) * i) / (n - 1);
    const k = Math.floor(pos);
    const frac = pos - k;
    const a = points[k];
    const b = points[Math.min(points.length - 1, k + 1)];
    out.push(a + (b - a) * frac);
  }
  return out;
}

/** Жишиг муруй (Chao) — n цэгтэй. */
export function templateContour(tone: number, n: number = CONTOUR_POINTS): number[] {
  return resample(toneContour(tone), n);
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    sab += da * db;
    saa += da * da;
    sbb += db * db;
  }
  if (saa < 1e-9 || sbb < 1e-9) return 0;
  return sab / Math.sqrt(saa * sbb);
}

export type ChaoPoint = { t: number; chao: number };

/**
 * Октав алдааг засна: өмнөх (сүүлийн 3 цэгийн медиан) f0-оос ~2 дахин доош/дээш
 * үсэрсэн цэгийг 2-оор үржүүлж/хувааж буцаана.
 */
export function fixOctaveJumps(samples: PitchSample[]): PitchSample[] {
  const out: PitchSample[] = [];
  const recent: number[] = [];
  for (const s of samples) {
    let f0 = s.f0;
    if (recent.length > 0) {
      const sorted = [...recent].sort((a, b) => a - b);
      const ref = sorted[Math.floor(sorted.length / 2)];
      if (f0 < ref / 1.7 && Math.abs(f0 * 2 - ref) / ref < 0.3) f0 *= 2;
      else if (f0 > ref * 1.7 && Math.abs(f0 / 2 - ref) / ref < 0.3) f0 /= 2;
    }
    out.push({ t: s.t, f0 });
    recent.push(f0);
    if (recent.length > 3) recent.shift();
  }
  return out;
}

/**
 * f0 цэгүүдийг хагас өнгөнд шилжүүлж, яригчийн өөрийн мужид (10–90 перцентиль)
 * Chao 1..5 болгоно. Муж < 3 хагас өнгө бол тэгш → бүгд 3-т (flat=true).
 */
export function normalizeToChao(samples: PitchSample[]): {
  points: ChaoPoint[];
  flat: boolean;
  rangeSt: number;
} {
  const voiced = smoothPitch(fixOctaveJumps(samples.filter((s) => s.f0 > 0)));
  if (voiced.length === 0) return { points: [], flat: true, rangeSt: 0 };
  const st = voiced.map((s) => semitone(s.f0));
  const sorted = [...st].sort((a, b) => a - b);
  const lo = percentile(sorted, 0.1);
  const hi = percentile(sorted, 0.9);
  const range = hi - lo;
  if (range < FLAT_RANGE_ST) {
    return {
      points: voiced.map((s) => ({ t: s.t, chao: 3 })),
      flat: true,
      rangeSt: range,
    };
  }
  return {
    points: voiced.map((s, i) => ({
      t: s.t,
      chao: clamp(1 + (4 * (st[i] - lo)) / range, 1, 5),
    })),
    flat: false,
    rangeSt: range,
  };
}

/** Дуутай цэгүүдийг завсраар (> GAP_S) хэсэглэнэ. */
function segmentByGaps(points: ChaoPoint[]): ChaoPoint[][] {
  const segs: ChaoPoint[][] = [];
  let cur: ChaoPoint[] = [];
  for (const p of points) {
    if (cur.length > 0 && p.t - cur[cur.length - 1].t > GAP_S) {
      segs.push(cur);
      cur = [];
    }
    cur.push(p);
  }
  if (cur.length > 0) segs.push(cur);
  // 2-оос цөөн цэгтэй хэсэг — чимээ
  return segs.filter((s) => s.length >= 2);
}

/** Дуутай хугацааг N тэнцүү хэсэгт хуваана (fallback). */
function segmentEqually(points: ChaoPoint[], n: number): ChaoPoint[][] {
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const span = Math.max(t1 - t0, 1e-6);
  const segs: ChaoPoint[][] = Array.from({ length: n }, () => []);
  for (const p of points) {
    const k = Math.min(n - 1, Math.floor(((p.t - t0) / span) * n));
    segs[k].push(p);
  }
  return segs;
}

/**
 * f0 цэгүүдийг n үед хувааж, үе бүрийг CONTOUR_POINTS цэгтэй Chao муруй болгоно
 * (жишиг аудионоос муруй гаргахад). Дуу хангалтгүй бол null.
 */
export function splitContours(samples: PitchSample[], n: number): number[][] | null {
  const norm = normalizeToChao(samples);
  if (n <= 0 || norm.points.length < 3 || norm.flat) return null;
  let segs = segmentByGaps(norm.points);
  if (segs.length !== n) segs = segmentEqually(norm.points, n);
  const out = segs.map((seg) => (seg.length >= 2 ? resample(seg.map((p) => p.chao)) : []));
  if (out.some((c) => c.length === 0)) return null;
  return out;
}

/* ---------- үеийн оноо ---------- */

type Features = {
  delta: number; // төгсгөл − эхлэл
  minPos: number; // 0..1
  maxPos: number;
  depth: number; // min(эхлэл, төгсгөл) − хамгийн нам
  range: number;
  mean: number;
  riseAfterMin: number; // төгсгөл − хамгийн нам
};

function features(c: number[]): Features {
  const n = c.length;
  let min = Infinity;
  let max = -Infinity;
  let minI = 0;
  let maxI = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += c[i];
    if (c[i] < min) {
      min = c[i];
      minI = i;
    }
    if (c[i] > max) {
      max = c[i];
      maxI = i;
    }
  }
  const start = (c[0] + c[1]) / 2;
  const end = (c[n - 1] + c[n - 2]) / 2;
  return {
    delta: end - start,
    minPos: minI / (n - 1),
    maxPos: maxI / (n - 1),
    depth: Math.min(start, end) - min,
    range: max - min,
    mean: sum / n,
    riseAfterMin: end - min,
  };
}

/**
 * 4 аялгын оноо (0..1). Хэлбэрийн корреляци + налуугийн шинж тэмдгүүд.
 * `final` — үгийн сүүлийн үе (3-р аялга бүтэн 214 байх ёстой; дунд үед хагас 21 зөвшөөрнө).
 */
export function scoreContour(
  contour: number[],
  opts: { final?: boolean } = {}
): [number, number, number, number] {
  const c = contour.length === CONTOUR_POINTS ? contour : resample(contour, CONTOUR_POINTS);
  const f = features(c);
  const corr = (tone: number) => Math.max(0, pearson(c, templateContour(tone)));

  // T1 — тэгш, өндөр
  const flatness = 1 - clamp(f.range / 2.5, 0, 1);
  const high = clamp((f.mean - 2.5) / 2, 0, 1);
  const s1 = 0.65 * flatness + 0.35 * high * flatness + 0.1 * (f.range < 1 ? 1 : 0);

  // T2 — өгсөх
  const rise = clamp(f.delta / 2.2, 0, 1);
  const dipPenalty = f.depth > 0.8 && f.minPos > 0.25 && f.minPos < 0.75 ? 0.5 : 1;
  const s2 = (0.45 * corr(2) + 0.55 * rise) * dipPenalty;

  // T3 — буугаад өгсөх (нам хотгор)
  const midMin = f.minPos >= 0.2 && f.minPos <= 0.8 ? 1 : f.minPos > 0.8 ? 0.35 : 0.2;
  const dip = clamp(f.depth / 1.2, 0, 1) * clamp(f.riseAfterMin / 0.8, 0, 1);
  let s3 = 0.4 * corr(3) + 0.6 * dip * midMin;
  if (!opts.final) {
    // хагас 3-р аялга (21): нам, бага зэрэг буурах — өгсөлтгүй
    const low = clamp((2.6 - f.mean) / 1.4, 0, 1);
    const lowFall = f.delta <= 0.3 ? low * 0.75 : 0;
    s3 = Math.max(s3, lowFall);
  }

  // T4 — буурах
  const fall = clamp(-f.delta / 2.2, 0, 1);
  const startHigh = clamp((c[0] - 3) / 1.5, 0, 1);
  const s4 = 0.4 * corr(4) + 0.45 * fall + 0.15 * fall * startHigh;

  return [clamp(s1, 0, 1), clamp(s2, 0, 1), clamp(s3, 0, 1), clamp(s4, 0, 1)];
}

/** 3-р аялгын сандхи: 3+3 → 2+3 (эхний үеийг 2-оор шалгана). */
export function applyToneSandhi(syllables: PinyinSyllable[]): PinyinSyllable[] {
  return syllables.map((s, i) => {
    const next = syllables[i + 1];
    if (s.tone === 3 && next && next.tone === 3) return { ...s, tone: 2 };
    return s;
  });
}

function emptyScore(s: PinyinSyllable, t0 = 0, t1 = 0): SyllableScore {
  const neutral = s.tone === 0;
  return {
    syllable: s.syllable,
    tone: s.tone,
    detected: null,
    confidence: 0,
    ok: neutral,
    status: neutral ? "skip" : "bad",
    hint: neutral ? TONE_HINTS_MN[0] : TONE_HINTS_MN[s.tone] ?? "",
    short: neutral ? "" : "дуу алга",
    contour: [],
    t0,
    t1,
    scores: [0, 0, 0, 0],
  };
}

/**
 * Үндсэн функц: хэрэглэгчийн f0 цэгүүд + пиньинь → үе бүрийн дүгнэлт.
 */
export function scoreTones(
  samples: PitchSample[],
  pinyin: string | PinyinSyllable[],
  opts: { sandhi?: boolean } = {}
): ToneScoreResult {
  const parsed = typeof pinyin === "string" ? parsePinyinSyllables(pinyin) : pinyin;
  const syllables = opts.sandhi === false ? parsed : applyToneSandhi(parsed);
  const n = syllables.length;
  const norm = normalizeToChao(samples);

  if (n === 0 || norm.points.length < 3) {
    return {
      syllables: syllables.map((s) => emptyScore(s)),
      correct: 0,
      total: syllables.filter((s) => s.tone > 0).length,
      flat: norm.flat,
      empty: true,
    };
  }

  let segs = segmentByGaps(norm.points);
  if (segs.length !== n) segs = segmentEqually(norm.points, n);

  const out: SyllableScore[] = syllables.map((s, i) => {
    const seg = segs[i] ?? [];
    if (seg.length < 2) return emptyScore(s);
    const t0 = seg[0].t;
    const t1 = seg[seg.length - 1].t;
    const contour = resample(
      seg.map((p) => p.chao),
      CONTOUR_POINTS
    );
    if (s.tone === 0) {
      return {
        ...emptyScore(s, t0, t1),
        contour,
        status: "skip",
        ok: true,
        short: "",
        confidence: 1,
      };
    }
    const scores = norm.flat
      ? ([0.6, 0.05, 0.05, 0.05] as [number, number, number, number])
      : scoreContour(contour, { final: i === n - 1 });
    let best = 0;
    for (let k = 1; k < 4; k++) if (scores[k] > scores[best]) best = k;
    const detected = (best + 1) as 1 | 2 | 3 | 4;
    const expected = clamp(s.tone, 1, 4);
    const confidence = scores[expected - 1];
    const bestScore = scores[best];
    let status: ToneStatus;
    if (detected === expected && confidence >= 0.45) status = "ok";
    else if (bestScore - confidence > 0.25 && bestScore >= 0.4) status = "bad";
    else if (confidence >= 0.3) status = "warn";
    else status = "bad";
    const ok = status === "ok";
    const short = ok
      ? ""
      : detected !== expected
        ? SHORT_BY_DETECTED[detected]
        : SHORT_BY_EXPECTED[expected];
    return {
      syllable: s.syllable,
      tone: s.tone,
      detected,
      confidence: Number(confidence.toFixed(3)),
      ok,
      status,
      hint: ok ? "" : TONE_HINTS_MN[expected],
      short,
      contour,
      t0,
      t1,
      scores: scores.map((v) => Number(v.toFixed(3))) as [number, number, number, number],
    };
  });

  const scored = out.filter((s) => s.tone > 0);
  return {
    syllables: out,
    correct: scored.filter((s) => s.ok).length,
    total: scored.length,
    flat: norm.flat,
    empty: false,
  };
}
