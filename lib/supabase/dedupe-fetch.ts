/**
 * Browser талын Supabase REST уншилтыг хөнгөлөх fetch.
 *
 * Нэг хуудас ачаалахад олон компонент ИЖИЛ хүсэлтийг зэрэг явуулдаг байсан
 * (ж: нүүр хуудсанд user_lesson_progress ×4, assignments ×3). Энэ давхарга:
 *   1) яг ижил GET/HEAD хүсэлт зэрэг явж байвал нэг л сүлжээний дуудлага хийнэ;
 *   2) хариуг маш богино хугацаанд (2с) санаж, дараалсан давхардлыг ч барина;
 *   3) ямар нэг бичилт (POST/PATCH/DELETE/RPC) гармагц санасан бүгдийг хаяна —
 *      өөрийн бичсэнээ хуучнаар нь уншихгүй.
 * Чат (бодит цагийн) болон signal-тай хүсэлтэд огт хүрэхгүй.
 */

const TTL_MS = 2000;
const MAX_ENTRIES = 150;

type Entry = { at: number; master: Promise<Response> };

function headerSig(headers: HeadersInit | undefined): string {
  if (!headers) return "";
  const h = new Headers(headers);
  return ["authorization", "accept", "prefer", "range", "accept-profile"]
    .map((k) => h.get(k) ?? "")
    .join("|");
}

export function createDedupeFetch(): typeof fetch {
  const cache = new Map<string, Entry>();

  return async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (
      init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET")
    ).toUpperCase();

    if (!url.includes("/rest/v1/")) return fetch(input, init);

    if (method !== "GET" && method !== "HEAD") {
      cache.clear();
      return fetch(input, init);
    }

    if (init?.signal || url.includes("/rest/v1/chat_") || typeof input !== "string") {
      return fetch(input, init);
    }

    const key = `${method} ${url} ${headerSig(init?.headers)}`;
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && now - hit.at < TTL_MS) {
      return (await hit.master).clone();
    }

    const master = fetch(input, init);
    cache.set(key, { at: now, master });
    if (cache.size > MAX_ENTRIES) {
      for (const [k, v] of cache) {
        if (now - v.at >= TTL_MS) cache.delete(k);
      }
    }
    try {
      const res = await master;
      if (!res.ok) cache.delete(key);
      return res.clone();
    } catch (e) {
      cache.delete(key);
      throw e;
    }
  };
}
