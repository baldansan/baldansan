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
const RANK_TTL_MS = 5 * 60_000;
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
  const slow = new Map<string, Entry>();

  return async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (
      init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET")
    ).toUpperCase();

    if (!url.includes("/rest/v1/")) return fetch(input, init);

    if (method !== "GET" && method !== "HEAD") {
      if (!READ_ONLY_RPC.test(url)) {
        cache.clear();
        forgetNoClassroom();
        return fetch(input, init);
      }
      // Зөвхөн уншдаг RPC: зэрэглэл (бүх хэрэглэгчийн оноог нэгтгэдэг хүнд тооцоо) 5 минут,
      // бусад нь энгийн уншилттай адил санагдана. Ангийн шууд сорил, идэвхийн тоолуур — үгүй.
      if (
        init?.signal ||
        typeof input !== "string" ||
        typeof init?.body !== "string" ||
        url.includes("class_quiz") ||
        url.includes("add_activity_seconds")
      ) {
        return fetch(input, init);
      }
      const isRank = /\/rpc\/(my_rank_summary|rank_)/.test(url);
      const store = isRank ? slow : cache;
      const ttl = isRank ? RANK_TTL_MS : ttlMs();
      const rpcKey = `POST ${url} ${init.body} ${headerSig(init.headers)}`;
      const rpcNow = Date.now();
      const rpcHit = store.get(rpcKey);
      if (rpcHit && rpcNow - rpcHit.at < ttl) return (await rpcHit.master).clone();
      const rpcMaster = fetch(input, init);
      store.set(rpcKey, { at: rpcNow, master: rpcMaster });
      if (store.size > MAX_ENTRIES) store.clear();
      try {
        const res = await rpcMaster;
        if (!res.ok) store.delete(rpcKey);
        return res.clone();
      } catch (e) {
        store.delete(rpcKey);
        throw e;
      }
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
      else if (url.includes("/rest/v1/classroom_students?") && url.includes("student_user_id=eq.")) {
        // Ангид ороогүй сурагч гэдгийг тэмдэглэнэ — ангийн сорилын хүсэлтийг алгасахад хэрэглэнэ.
        void res
          .clone()
          .json()
          .then((rows: unknown) => {
            const uid = /student_user_id=eq\.([0-9a-f-]{36})/i.exec(url)?.[1] ?? "";
            if (Array.isArray(rows) && rows.length === 0 && uid) rememberNoClassroom(uid);
            else forgetNoClassroom();
          })
          .catch(() => {});
      }
      return res.clone();
    } catch (e) {
      cache.delete(key);
      throw e;
    }
  };
}

const NO_CLASS_KEY = "bs.noClassroomAt";
const NO_CLASS_MS = 5 * 60_000;

function rememberNoClassroom(userId: string) {
  try {
    window.sessionStorage.setItem(NO_CLASS_KEY, `${userId}|${Date.now()}`);
  } catch {
    /* ignore */
  }
}

function forgetNoClassroom() {
  try {
    window.sessionStorage.removeItem(NO_CLASS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Сүүлийн 5 минутад «энэ сурагч ямар ч ангид алга» гэж уншигдсан эсэх.
 * Ангид нэгдэх (бичилт) үед шууд мартагдана.
 */
export function knownNoClassroom(userId: string): boolean {
  try {
    const [uid, ts] = (window.sessionStorage.getItem(NO_CLASS_KEY) ?? "").split("|");
    const at = Number(ts);
    return uid === userId && Number.isFinite(at) && at > 0 && Date.now() - at < NO_CLASS_MS;
  } catch {
    return false;
  }
}
