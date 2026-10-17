/**
 * Server талын Supabase клиентүүдэд өгөх `fetch` — гацсан query Vercel function-ийн
 * хязгаар (хэдэн арван секунд) хүртэл хүлээхийн оронд 8с-д алдаа буцаана.
 * Дуудагчид (fetchSupabaseOnly, unstable_cache wrapper-ууд) throw-ыг барьж warn хийдэг.
 *
 * Browser клиентэд ашиглахгүй (lib/supabase/client.ts зөвхөн server дээр өгдөг).
 */
export const SUPABASE_SERVER_FETCH_TIMEOUT_MS = 8000;

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

/** `fetch`-тэй ижил гарын үсэг; runtime-д AbortSignal.timeout байхгүй бол ердийн fetch. */
export const fetchWithTimeout: FetchLike = (input, init) => {
  const timeout = timeoutSignal(SUPABASE_SERVER_FETCH_TIMEOUT_MS);
  if (!timeout) return fetch(input, init);
  return fetch(input, {
    ...init,
    signal: combineSignals(init?.signal, timeout),
  });
};
