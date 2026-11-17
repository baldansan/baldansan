import { supabase } from "@/lib/supabase/client";

/**
 * Уншаагүй чатын тоо. «Хамгийн сүүлд харсан мессежийн id»-г төхөөрөмж дээр (localStorage)
 * өрөө тус бүрээр хадгална — сангийн бүтэц өөрчлөхгүй. Өөр төхөөрөмж дээр тусдаа тоологдоно.
 */
const KEY = "bs.chat.lastSeen.v1";
const TOTAL_CACHE_KEY = "bs.chat.unreadTotal.v1";
const TOTAL_CACHE_MS = 2 * 60_000;

type SeenMap = Record<string, number>;

function readSeen(): SeenMap {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as SeenMap;
  } catch {
    return {};
  }
}

export function markRoomSeen(roomId: string, lastMessageId: number) {
  if (!Number.isFinite(lastMessageId) || lastMessageId <= 0) return;
  try {
    const map = readSeen();
    if ((map[roomId] ?? 0) >= lastMessageId) return;
    map[roomId] = lastMessageId;
    window.localStorage.setItem(KEY, JSON.stringify(map));
    window.sessionStorage.removeItem(TOTAL_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** Гишүүн болсон өрөө бүрийн уншаагүй (бусдын бичсэн) мессежийн тоо. */
export async function fetchUnreadCounts(
  roomIds: string[],
  userId: string
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!supabase || roomIds.length === 0) return out;
  const client = supabase;
  const seen = readSeen();
  await Promise.all(
    roomIds.slice(0, 30).map(async (roomId) => {
      try {
        const { count, error } = await client
          .from("chat_messages_visible")
          .select("id", { count: "exact", head: true })
          .eq("room_id", roomId)
          .gt("id", seen[roomId] ?? 0)
          .neq("user_id", userId);
        if (!error && count) out[roomId] = count;
      } catch {
        /* ignore */
      }
    })
  );
  return out;
}

/** Нүүр хуудсанд: нийт уншаагүй тоо (2 минут санана; санасан үед сан руу огт очихгүй). */
export async function fetchUnreadTotal(
  userId: string,
  getRoomIds: () => Promise<string[]>
): Promise<number> {
  try {
    const raw = window.sessionStorage.getItem(TOTAL_CACHE_KEY);
    if (raw) {
      const [uid, ts, n] = raw.split("|");
      if (uid === userId && Date.now() - Number(ts) < TOTAL_CACHE_MS) return Number(n) || 0;
    }
  } catch {
    /* ignore */
  }
  const counts = await fetchUnreadCounts(await getRoomIds(), userId);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  try {
    window.sessionStorage.setItem(TOTAL_CACHE_KEY, `${userId}|${Date.now()}|${total}`);
  } catch {
    /* ignore */
  }
  return total;
}

export function formatUnread(n: number): string {
  return n > 99 ? "99+" : String(n);
}
