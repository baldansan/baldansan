import type { CharDataLoaderFn } from "hanzi-writer";

/**
 * Ханзны зурлагын өгөгдөл (hanzi-writer-data v2.0.1, 9,580 ханз).
 * Эхлээд jsdelivr CDN (хурдан, кэштэй, манай сервер ачаалахгүй), бүтэхгүй бол /api/hanzi.
 * Урьд нь node_modules/hanzi-writer-data (47MB) Vercel function-д багцлагдаж cold start-ыг удаашруулдаг байв.
 */
export const HANZI_DATA_CDN = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1";

export function hanziCdnUrl(char: string): string {
  return `${HANZI_DATA_CDN}/${encodeURIComponent(char)}.json`;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

export const localHanziCharDataLoader: CharDataLoaderFn = (char, onLoad, onError) => {
  fetchJson(hanziCdnUrl(char))
    .catch(() => fetchJson(`/api/hanzi/${encodeURIComponent(char)}`))
    .then((data) => onLoad(data as Parameters<typeof onLoad>[0]))
    .catch((err: unknown) => {
      onError(err instanceof Error ? err : new Error(`Missing stroke data for ${char}`));
    });
};

export type HanziCharData = { strokes: string[]; medians: number[][][] };

const dataCache = new Map<string, Promise<HanziCharData>>();

/** Ханзны түүхий зурлагын өгөгдөл (CDN → /api/hanzi). Нэг ханзыг нэг л удаа татна. */
export function loadHanziCharData(char: string): Promise<HanziCharData> {
  const hit = dataCache.get(char);
  if (hit) return hit;
  const p = fetchJson(hanziCdnUrl(char))
    .catch(() => fetchJson(`/api/hanzi/${encodeURIComponent(char)}`))
    .then((data) => data as HanziCharData);
  dataCache.set(char, p);
  p.catch(() => dataCache.delete(char));
  return p;
}
