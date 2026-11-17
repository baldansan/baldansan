/**
 * Browser талын Supabase REST уншилтыг хөнгөлөх fetch.
 *
 * Нэг хуудас ачаалахад олон компонент ИЖИЛ хүсэлтийг зэрэг явуулдаг байсан
 * (ж: нүүр хуудсанд user_lesson_progress ×4, assignments ×3). Энэ давхарга:
 *   1) яг ижил GET/HEAD хүсэлт зэрэг явж байвал нэг л сүлжээний дуудлага хийнэ;
 *   2) хариуг богино хугацаанд (суралцагчийн хуудсанд 30с, админ/багшийн хуудсанд 2с)
 *      санаж, хуудас хооронд шилжихэд дахин уншихгүй;
 *   3) ямар нэг бичилт (POST/PATCH/DELETE, бичдэг RPC) гармагц санасан бүгдийг хаяна —
 *      өөрийн бичсэнээ хуучнаар нь уншихгүй. Зөвхөн уншдаг RPC (my_*, get_*, rank_* …)
 *      болон идэвхийн секунд тоолуур (add_activity_seconds) санасныг хөндөхгүй.
 * Чат, ангийн шууд сорил (бодит цагийн) болон signal-тай хүсэлтэд огт хүрэхгүй.
 */

const TTL_LEARNER_MS = 30_000;
const TTL_STAFF_MS = 2000;
const STAFF_PATH = /^\/(admin|teacher|teacher-dashboard|organization|dashboard|teachers)(\/|$)/;
const READ_ONLY_RPC =
  /\/rest\/v1\/rpc\/(my_|get_|rank_|is_|can_|peek_|lookup_|class_points|class_quiz_class_avg|classroom_curriculum_progress|compute_|guardian_|writing_list_|admin_learner_names|admin_teacher_list|add_activity_seconds)/;

function ttlMs(): number {
  try {
    return STAFF_PATH.test(window.location.pathname) ? TTL_STAFF_MS : TTL_LEARNER_MS;
  } catch {
    return TTL_STAFF_MS;
  }
}
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
      if (!READ_ONLY_RPC.test(url)) cache.clear();
      return fetch(input, init);
    }

    if (
      init?.signal ||
      url.includes("/rest/v1/chat_") ||
      url.includes("class_quiz") ||
      typeof input !== "string"
    ) {
      return fetch(input, init);
    }

    const key = `${method} ${url} ${headerSig(init?.headers)}`;
    const now = Date.now();
    const TTL_MS = ttlMs();
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
