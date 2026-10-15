import { supabase } from "@/lib/supabase/client";
import {
  fail,
  ok,
  TEAM_MAX_MEMBERS,
  type ChatMember,
  type ChatRoom,
  type SocialResult,
} from "./types";

const NOT_CONFIGURED = "Supabase тохиргоо дутуу байна.";

const ROOM_COLUMNS =
  "id, kind, title, topic, description, owner_user_id, classroom_id, age_band, language, is_open, is_closed, max_members, created_at, member_count, is_member, owner_name, owner_avatar";

async function listRooms(
  build: (q: ReturnType<NonNullable<typeof supabase>["from"]>) => unknown
): Promise<SocialResult<ChatRoom[]>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const base = supabase.from("chat_room_directory");
    const query = build(base) as PromiseLike<{ data: unknown; error: { message: string } | null }>;
    const { data, error } = await query;
    if (error) return fail(error);
    return ok((data ?? []) as ChatRoom[]);
  } catch (e) {
    return fail(e);
  }
}

/** Нээлттэй сэдвийн өрөөнүүд (шинэ нь эхэнд). */
export function listOpenTopicRooms(): Promise<SocialResult<ChatRoom[]>> {
  return listRooms((t) =>
    (t as ReturnType<NonNullable<typeof supabase>["from"]>)
      .select(ROOM_COLUMNS)
      .eq("kind", "topic")
      .eq("is_open", true)
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(100)
  );
}

/** Нээлттэй багууд (сул байр харуулахын тулд дүүрсэн нь ч орно). */
export function listTeamRooms(): Promise<SocialResult<ChatRoom[]>> {
  return listRooms((t) =>
    (t as ReturnType<NonNullable<typeof supabase>["from"]>)
      .select(ROOM_COLUMNS)
      .eq("kind", "team")
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(100)
  );
}

/** Хятадаар ярилцъя — 4 насны өрөө. */
export function listAgeRooms(): Promise<SocialResult<ChatRoom[]>> {
  return listRooms((t) =>
    (t as ReturnType<NonNullable<typeof supabase>["from"]>)
      .select(ROOM_COLUMNS)
      .eq("kind", "age")
      .order("age_band", { ascending: true })
  );
}

/** Миний гишүүн болсон өрөөнүүд (анги, сэдэв, баг, dm). */
export function listMyRooms(): Promise<SocialResult<ChatRoom[]>> {
  return listRooms((t) =>
    (t as ReturnType<NonNullable<typeof supabase>["from"]>)
      .select(ROOM_COLUMNS)
      .eq("is_member", true)
      .order("created_at", { ascending: false })
      .limit(200)
  );
}

export async function getRoom(roomId: string): Promise<SocialResult<ChatRoom | null>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from("chat_room_directory")
      .select(ROOM_COLUMNS)
      .eq("id", roomId)
      .maybeSingle();
    if (error) return fail(error);
    return ok((data as ChatRoom | null) ?? null);
  } catch (e) {
    return fail(e);
  }
}

export type CreateRoomInput = {
  title: string;
  topic?: string;
  description?: string;
};

export async function createTopicRoom(
  userId: string,
  input: CreateRoomInput
): Promise<SocialResult<{ id: string }>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        kind: "topic",
        title: input.title.trim().slice(0, 80),
        topic: input.topic?.trim().slice(0, 80) || null,
        description: input.description?.trim().slice(0, 500) || null,
        owner_user_id: userId,
        is_open: true,
        language: "zh",
      })
      .select("id")
      .single();
    if (error) return fail(error);
    return ok({ id: (data as { id: string }).id });
  } catch (e) {
    return fail(e);
  }
}

export async function createTeamRoom(
  userId: string,
  input: CreateRoomInput
): Promise<SocialResult<{ id: string }>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        kind: "team",
        title: input.title.trim().slice(0, 80),
        topic: input.topic?.trim().slice(0, 80) || null,
        description: input.description?.trim().slice(0, 500) || null,
        owner_user_id: userId,
        is_open: true,
        max_members: TEAM_MAX_MEMBERS,
        language: "zh",
      })
      .select("id")
      .single();
    if (error) return fail(error);
    return ok({ id: (data as { id: string }).id });
  } catch (e) {
    return fail(e);
  }
}

/** Хэрэглэгч эзэмшиж буй сэдвийн өрөө (1 хүн = 1 өрөө). */
export async function getMyTopicRoom(userId: string): Promise<SocialResult<ChatRoom | null>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from("chat_room_directory")
      .select(ROOM_COLUMNS)
      .eq("kind", "topic")
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (error) return fail(error);
    return ok((data as ChatRoom | null) ?? null);
  } catch (e) {
    return fail(e);
  }
}

export async function joinRoom(roomId: string, userId: string): Promise<SocialResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { error } = await supabase
      .from("chat_members")
      .insert({ room_id: roomId, user_id: userId, role: "member" });
    if (error && error.code !== "23505") return fail(error);
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function leaveRoom(roomId: string, userId: string): Promise<SocialResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { error } = await supabase
      .from("chat_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", userId);
    if (error) return fail(error);
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function removeMember(roomId: string, userId: string): Promise<SocialResult<true>> {
  return leaveRoom(roomId, userId);
}

export async function listMembers(roomId: string): Promise<SocialResult<ChatMember[]>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from("chat_member_profiles")
      .select("room_id, user_id, role, joined_at, display_name, avatar")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });
    if (error) return fail(error);
    return ok((data ?? []) as ChatMember[]);
  } catch (e) {
    return fail(e);
  }
}

export async function renameRoom(roomId: string, title: string): Promise<SocialResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { error } = await supabase
      .from("chat_rooms")
      .update({ title: title.trim().slice(0, 80) })
      .eq("id", roomId);
    if (error) return fail(error);
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

export async function setRoomClosed(roomId: string, closed: boolean): Promise<SocialResult<true>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { error } = await supabase
      .from("chat_rooms")
      .update({ is_closed: closed })
      .eq("id", roomId);
    if (error) return fail(error);
    return ok(true);
  } catch (e) {
    return fail(e);
  }
}

/** Хоёр хүний мессежийн өрөө (dm) нээх/олох. */
export async function openDirectMessage(otherUserId: string): Promise<SocialResult<string>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase.rpc("chat_open_dm", { p_other: otherUserId });
    if (error) return fail(error);
    return ok(String(data));
  } catch (e) {
    return fail(e);
  }
}

/** Хэд хэдэн өрөөний гишүүд (dm-ийн нэр гаргахад). */
export async function listMembersForRooms(
  roomIds: string[]
): Promise<SocialResult<ChatMember[]>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  if (roomIds.length === 0) return ok([]);
  try {
    const { data, error } = await supabase
      .from("chat_member_profiles")
      .select("room_id, user_id, role, joined_at, display_name, avatar")
      .in("room_id", roomIds);
    if (error) return fail(error);
    return ok((data ?? []) as ChatMember[]);
  } catch (e) {
    return fail(e);
  }
}
