import "server-only";

/**
 * Админ «холбоос наах» хэрэгсэл: YouTube-ийн ID таних, гарчиг авах (албан ёсны oEmbed),
 * админы хуулж наасан хадмалыг (транскрипт / SRT) мөр болгох.
 * Хадмалыг YouTube-ээс автоматаар татдаггүй — YouTube серверээс ирсэн хүсэлтийг хориглодог.
 */

export type CaptionLine = { start: number; end: number; zh: string };

const CJK = /[一-鿿]/;

export function extractYoutubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m =
    s.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/) ?? null;
  return m ? m[1] : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ");
}

/** Мөрийг цэвэрлэнэ: таг, хөгжмийн тэмдэг, хаалтан доторх тайлбар. */
function cleanText(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]+>/g, ""))
    .replace(/[\r\n]+/g, " ")
    .replace(/[♪♫🎵🎶]/g, "")
    .replace(/[\[【(（][^\]】)）]{0,20}[\]】)）]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Зарим суваг хадмалдаа пиньинь + ханзыг хамт бичдэг («wǒ men 我们»).
 * Латин үсэг ханзнаасаа олон байвал жижиг үсгээр бичсэн латин үгсийг (пиньинь) хасна.
 */
function stripInlinePinyin(text: string): string {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[a-zA-Z\u00c0-\u024f\u01cd-\u01dc]/g) ?? []).length;
  if (!cjk || latin <= cjk) return text;
  return text
    .replace(/(?<![A-Za-z0-9])[a-z\u00e0-\u024f\u01ce-\u01dc]+(?![A-Za-z0-9])/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Давхцлыг арилгаж, хятад үсэггүй мөрийг хасна. */
export function tidyLines(input: CaptionLine[]): CaptionLine[] {
  const rows = input
    .map((l) => ({ start: l.start, end: l.end, zh: stripInlinePinyin(cleanText(l.zh)) }))
    .filter((l) => l.zh && CJK.test(l.zh) && Number.isFinite(l.start))
    .sort((a, b) => a.start - b.start);

  const out: CaptionLine[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const cur = rows[i];
    const prev = out[out.length - 1];
    // Автомат хадмалын давтагдсан мөр
    if (prev && prev.zh === cur.zh && cur.start - prev.end < 0.5) {
      prev.end = Math.max(prev.end, cur.end);
      continue;
    }
    const next = rows[i + 1];
    let end = Number.isFinite(cur.end) && cur.end > cur.start ? cur.end : cur.start + 3;
    if (next && next.start > cur.start && end > next.start) end = next.start;
    if (end - cur.start < 0.2) end = cur.start + 0.2;
    const start = prev && cur.start < prev.end ? prev.end : cur.start;
    if (end <= start) continue;
    out.push({
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      zh: cur.zh,
    });
  }
  return out;
}

function parseClock(s: string): number {
  const parts = s.replace(",", ".").split(":").map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/**
 * YouTube-ийн транскрипт хэд хэдэн өгүүлбэрийг нэг мөрөнд нийлүүлдэг (асуулт, хариулт хамт).
 * Суралцагчид мөр богино байх хэрэгтэй тул өгүүлбэрээр хувааж, цагийг тэмдэгтийн тоогоор хуваарилна.
 */
function splitSentences(line: CaptionLine): CaptionLine[] {
  const parts = (line.zh.match(/[^。！？!?]+[。！？!?…]*/g) ?? [line.zh])
    .map((p) => p.trim())
    .filter(Boolean);
  // Хэт богино хэсгийг («对。», «哦。») дараагийнхтайгаа нийлүүлнэ.
  const merged: string[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (last !== undefined && [...last.replace(/[^\u4e00-\u9fff]/g, "")].length < 3) {
      merged[merged.length - 1] = `${last} ${part}`;
    } else {
      merged.push(part);
    }
  }
  if (merged.length < 2 || !Number.isFinite(line.end)) return [line];
  const weights = merged.map((p) => Math.max(2, [...p].length));
  const total = weights.reduce((a, b) => a + b, 0);
  const span = line.end - line.start;
  const out: CaptionLine[] = [];
  let at = line.start;
  merged.forEach((zh, i) => {
    const dur = (span * weights[i]) / total;
    out.push({ start: at, end: at + dur, zh });
    at += dur;
  });
  return out;
}

/**
 * Гараар наасан хадмал: SRT / VTT, эсвэл YouTube-ийн «Транскрипт» цонхноос
 * хуулсан («0:05» мөр, дараа нь текст) хэлбэр.
 */
export function parsePastedSubtitles(text: string): CaptionLine[] {
  const src = text.replace(/\r/g, "");
  const lines: CaptionLine[] = [];

  const srt = /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|\n\d+\n\d{1,2}:\d{2}|$)/g;
  for (const m of src.matchAll(srt)) {
    lines.push({ start: parseClock(m[1]), end: parseClock(m[2]), zh: m[3] });
  }
  if (lines.length) return tidyLines(lines);

  // «0:05\nтекст» эсвэл «0:05 текст»
  let pending: { start: number; text: string[] } | null = null;
  const flush = () => {
    if (pending && pending.text.length) {
      lines.push({ start: pending.start, end: NaN, zh: pending.text.join(" ") });
    }
  };
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*(.*)$/.exec(line);
    if (m) {
      flush();
      pending = { start: parseClock(m[1]), text: m[2] ? [m[2]] : [] };
    } else if (pending) {
      pending.text.push(line);
    }
  }
  flush();
  const timed: CaptionLine[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const next = lines[i + 1];
    // Транскриптэд төгсгөлийн цаг байхгүй: дараагийн мөр хүртэл, гэхдээ 10 секундээс хэтрүүлэхгүй.
    const cap = lines[i].start + 10;
    lines[i].end = next ? Math.min(next.start, cap) : lines[i].start + 4;
    timed.push(...splitSentences(lines[i]));
  }
  return tidyLines(timed);
}

export async function fetchYoutubeTitle(youtubeId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${youtubeId}`
      )}&format=json`,
      { cache: "no-store" }
    );
    if (!res.ok) return "";
    const data = (await res.json()) as { title?: string };
    return data.title ?? "";
  } catch {
    return "";
  }
}
