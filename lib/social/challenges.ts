import { supabase } from "@/lib/supabase/client";

/**
 * Групп чатын 7 хоногийн сорилт (112 SQL): «Бүгдээрээ N үг цээжилье».
 * Төлөвийг chat_challenge_status RPC нийлүүлж өгнө (нийт, миний тоо, эхний 3).
 */
export type ChallengeStatus = {
  id: number;
  title: string;
  target: number;
  startsAt: string;
  endsAt: string;
  total: number;
  mine: number;
  top: { name: string; n: number }[];
};

export async function fetchChallengeStatus(roomId: string): Promise<ChallengeStatus | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("chat_challenge_status", { p_room: roomId });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) return null;
    const raw = data as Record<string, unknown>;
    if (raw.id == null || !raw.title) return null;
    const top = Array.isArray(raw.top)
      ? (raw.top as Record<string, unknown>[]).map((row) => ({
          name: String(row.name ?? "Сурагч"),
          n: Number(row.n ?? 0),
        }))
      : [];
    return {
      id: Number(raw.id),
      title: String(raw.title ?? ""),
      target: Number(raw.target ?? 0),
      startsAt: String(raw.starts_at ?? ""),
      endsAt: String(raw.ends_at ?? ""),
      total: Number(raw.total ?? 0),
      mine: Number(raw.mine ?? 0),
      top,
    };
  } catch {
    return null;
  }
}

/** Хөтлөгч сорилт зарлана. Алдаа гарвал монгол мессеж буцаана. */
export async function createChallenge(
  roomIds: string[],
  userId: string,
  title: string,
  target: number,
  days: number
): Promise<string | null> {
  if (!supabase) return "Тохиргоо дутуу.";
  const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  try {
    const { error } = await supabase.from("chat_challenges").insert(
      roomIds.map((roomId) => ({
        room_id: roomId,
        title: title.trim(),
        target,
        ends_at: endsAt,
        created_by: userId,
      }))
    );
    return error ? "Сорилт үүсгэж чадсангүй. (112 SQL ажилласан эсэхийг шалгана уу.)" : null;
  } catch {
    return "Сорилт үүсгэж чадсангүй.";
  }
}
