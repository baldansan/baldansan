import { supabase } from "@/lib/supabase/client";
import {
  fail,
  MESSAGE_MAX_LENGTH,
  ok,
  type ChatMessage,
  type SocialResult,
} from "./types";

const NOT_CONFIGURED = "Supabase тохиргоо дутуу байна.";
const MESSAGE_COLUMNS = "id, room_id, user_id, body, created_at";

/** Сүүлийн 50 мессеж (хуучин нь эхэнд), блоклосон хүнийг view нуусан. */
export async function fetchRecentMessages(
  roomId: string,
  limit = 50,
  beforeId?: number
): Promise<SocialResult<ChatMessage[]>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    let q = supabase
      .from("chat_messages_visible")
      .select(MESSAGE_COLUMNS)
      .eq("room_id", roomId)
      .order("id", { ascending: false })
      .limit(limit);
    if (beforeId) q = q.lt("id", beforeId);
    const { data, error } = await q;
    if (error) return fail(error);
    const rows = ((data ?? []) as ChatMessage[]).slice().reverse();
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

/** Realtime: шинэ мессеж ирэх бүрд `onInsert`, устгагдахад `onDelete`. Буцаах функц нь unsubscribe. */
export function subscribeToMessages(
  roomId: string,
  handlers: {
    onInsert: (message: ChatMessage) => void;
    onDelete?: (id: number) => void;
  }
): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel(`chat-room-${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
      (payload) => handlers.onInsert(payload.new as ChatMessage)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "chat_messages" },
      (payload) => {
        const id = (payload.old as { id?: number }).id;
        if (typeof id === "number") handlers.onDelete?.(id);
      }
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export async function sendMessage(
  roomId: string,
  userId: string,
  body: string
): Promise<SocialResult<ChatMessage>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const text = body.trim();
  if (!text) return { data: null, error: "Мессеж хоосон байна." };
  if (text.length > MESSAGE_MAX_LENGTH)
    return { data: null, error: `Мессеж ${MESSAGE_MAX_LENGTH} тэмдэгтээс хэтрэхгүй.` };
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, user_id: userId, body: text })
      .select(MESSAGE_COLUMNS)
      .single();
    if (error) return fail(error);
    return ok(data as ChatMessage);
  } catch (e) {
    return fail(e);
  }
}

export async function reportMessage(
  messageId: number,
  reason: string
): Promise<SocialResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { error } = await supabase.rpc("chat_report_message", {
      p_message_id: messageId,
      p_reason: reason,
    });
    if (error) return fail(error);
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function listBlockedIds(): Promise<SocialResult<string[]>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase.from("user_blocks").select("blocked_id");
    if (error) return fail(error);
    return ok(((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id));
  } catch (e) {
    return fail(e);
  }
}

export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<SocialResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: blockerId, blocked_id: blockedId });
    if (error && error.code !== "23505") return fail(error);
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<SocialResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);
    if (error) return fail(error);
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}
