/**
 * Server талын Supabase клиентүүдэд өгөх `fetch` — гацсан query Vercel function-ийн
 * хязгаар (хэдэн арван секунд) хүртэл хүлээхийн оронд богино хугацаанд алдаа буцаана.
 *
 * Production хэмжилт: Supabase руу явсан дуудлага хааяа (үхсэн keep-alive socket)
 * огт хариу өгөлгүй гацдаг — ийм үед нэг л удаа ДАХИН оролдоход шинэ холболтоор
 * шууд амжилттай болдог. Тиймээс: унших (GET/HEAD) хүсэлтийг 4с-д таслаад нэг удаа
 * дахин оролдоно (нийт дээд тал нь ~8с); бичих хүсэлтийг давтахгүй, 8с-д таслана.
 * Дуудагчид (fetchSupabaseOnly, unstable_cache wrapper-ууд) throw-ыг барьж warn хийдэг.
 *
 * Browser клиентэд ашиглахгүй (lib/supabase/client.ts зөвхөн server дээр өгдөг).
 */
export const SUPABASE_SERVER_FETCH_TIMEOUT_MS = 8000;
const READ_ATTEMPT_TIMEOUT_MS = 4000;

type FetchLike = typeof fetch;

function timeoutSignal(ms: number): AbortSignal | null {
  if (
    typeof AbortSignal === "undefined" ||
    typeof AbortSignal.timeout !== "function"
  ) {
    return null;
  }
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return null;
  }
}

function combineSignals(
  own: AbortSignal | null | undefined,
  timeout: AbortSignal
): AbortSignal {
  if (!own) return timeout;
  const anyFn = (
    AbortSignal as unknown as {
      any?: (signals: AbortSignal[]) => AbortSignal;
    }
  ).any;
  if (typeof anyFn === "function") {
    try {
      return anyFn([own, timeout]);
    } catch {
      /* fallthrough */
    }
  }
  // AbortSignal.any байхгүй runtime — дуудагчийн signal-ийг хэвээр үлдээнэ (timeout-гүй).
  return own;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  const m = init?.method ?? (input instanceof Request ? input.method : "GET");
  return m.toUpperCase();
}

/** Дахин оролдож болох алдаа: timeout/abort эсвэл сүлжээний түвшний алдаа (хариу ирээгүй). */
function isRetryableNetworkError(error: unknown, ownSignal?: AbortSignal | null): boolean {
  if (ownSignal?.aborted) return false; // дуудагч өөрөө цуцалсан
  if (!(error instanceof Error)) return false;
  if (error.name === "TimeoutError" || error.name === "AbortError") return true;
  // undici: "fetch failed" (cause: ECONNRESET / socket hang up / UND_ERR_SOCKET)
  return error.name === "TypeError" && /fetch failed/i.test(error.message);
}

/** `fetch`-тэй ижил гарын үсэг; runtime-д AbortSignal.timeout байхгүй бол ердийн fetch. */
export const fetchWithTimeout: FetchLike = async (input, init) => {
  const method = requestMethod(input, init);
  const isRead = method === "GET" || method === "HEAD";
  const ownSignal = init?.signal;

  const attempt = (ms: number) => {
    const timeout = timeoutSignal(ms);
    if (!timeout) return fetch(input, init);
    return fetch(input, { ...init, signal: combineSignals(ownSignal, timeout) });
  };

  if (!isRead) {
    return attempt(SUPABASE_SERVER_FETCH_TIMEOUT_MS);
  }

  try {
    return await attempt(READ_ATTEMPT_TIMEOUT_MS);
  } catch (error) {
    if (!isRetryableNetworkError(error, ownSignal)) throw error;
    console.warn("[supabase] унших хүсэлт гацлаа — шинэ холболтоор дахин оролдож байна", {
      url: typeof input === "string" ? input.split("?")[0] : undefined,
    });
    return attempt(READ_ATTEMPT_TIMEOUT_MS);
  }
};
