/**
 * LRC (`[mm:ss.xx]中文歌词`) → хадмал мөрүүд.
 * `[mm:ss]` ч болно; нэг мөрөнд хэд хэдэн цаг байвал мөр бүрд хуулна;
 * цаггүй мөр (мета `[ar:…]`, хоосон) алгасна.
 */

export type LrcLine = { startSec: number; zh: string };

export type SongLyricLine = {
  idx: number;
  start_sec: number;
  end_sec: number;
  zh: string;
  pinyin: string;
  mn: string;
};

/** Сүүлийн мөрийн урт (дараагийн мөр байхгүй үед). */
export const LRC_LAST_LINE_SEC = 5;

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

export function parseLrc(text: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const times: number[] = [];
    let rest = line;
    let m: RegExpExecArray | null;
    TIME_TAG.lastIndex = 0;
    while ((m = TIME_TAG.exec(line)) !== null) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const fracRaw = m[3] ?? "";
      const frac = fracRaw
        ? Number(fracRaw) / Math.pow(10, fracRaw.length)
        : 0;
      if (Number.isFinite(min) && Number.isFinite(sec)) {
        times.push(min * 60 + sec + frac);
      }
    }
    if (!times.length) continue;
    rest = line.replace(TIME_TAG, "").trim();
    if (!rest) continue;
    for (const t of times) out.push({ startSec: t, zh: rest });
  }
  out.sort((a, b) => a.startSec - b.startSec);
  return out;
}

/** Мөр бүрийн текст (хоосон мөрийг ч хадгална — дараалал тааруулахын тулд). */
export function splitLines(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim());
}

/**
 * LRC + пиньинь мөрүүд + монгол мөрүүд → хадмал.
 * end_sec = дараагийн мөрийн start; сүүлийн мөр = start + 5с.
 */
export function buildSongLyricLines(
  lrc: LrcLine[],
  pinyinLines: string[] = [],
  mnLines: string[] = []
): SongLyricLine[] {
  const py = pinyinLines;
  const mn = mnLines;
  return lrc.map((line, i) => {
    const next = lrc[i + 1];
    let end = next ? next.startSec : line.startSec + LRC_LAST_LINE_SEC;
    if (end <= line.startSec) end = line.startSec + 0.5;
    return {
      idx: i + 1,
      start_sec: round3(line.startSec),
      end_sec: round3(end),
      zh: line.zh,
      pinyin: (py[i] ?? "").trim(),
      mn: (mn[i] ?? "").trim(),
    };
  });
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function formatLrcClock(sec: number): string {
  const total = Math.max(0, sec);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

/** YouTube URL эсвэл ID → 11 тэмдэгт ID (олдохгүй бол null). */
export function extractYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const v = url.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    if (/^[A-Za-z0-9_-]{11}$/.test(last)) return last;
  } catch {
    /* not a URL */
  }
  const m = s.match(/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
