import { supabase } from "@/lib/supabase/client";
import {
  AGE_BANDS,
  fail,
  ok,
  type AgeBand,
  type OwnProfile,
  type PublicProfile,
  type SocialResult,
} from "./types";

/**
 * Нийтийн профайл — `user_public_profile` (migration 071) хүснэгтэд тулгуурлана.
 * 071-ийн lib/points/rank.ts-тэй нэгтгэх хүртэл энд өөрийн минимал helper-үүд.
 */

const NOT_CONFIGURED = "Supabase тохиргоо дутуу байна.";

export function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === "string" && (AGE_BANDS as string[]).includes(value);
}

/** "@name", "https://instagram.com/name/" → "name" */
export function normalizeInstagram(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let v = raw.trim();
  if (!v) return null;
  v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  v = v.replace(/^@/, "").replace(/[/?#].*$/, "");
  v = v.replace(/[^A-Za-z0-9._]/g, "").slice(0, 30);
  return v || null;
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

function mapOwn(userId: string, row: Record<string, unknown> | null): OwnProfile {
  return {
    user_id: userId,
    display_name: typeof row?.display_name === "string" ? row.display_name : "",
    avatar: typeof row?.avatar === "string" ? row.avatar : null,
    instagram: typeof row?.instagram === "string" ? row.instagram : null,
    is_public: row?.is_public === true,
    level_label: typeof row?.level_label === "string" ? row.level_label : null,
    age_band: isAgeBand(row?.age_band) ? row.age_band : null,
    bio: typeof row?.bio === "string" ? row.bio : null,
    chat_banned: row?.chat_banned === true,
  };
}

export async function getOwnProfile(userId: string): Promise<SocialResult<OwnProfile>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from("user_public_profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return fail(error);
    return ok(mapOwn(userId, (data as Record<string, unknown> | null) ?? null));
  } catch (e) {
    return fail(e);
  }
}

export type OwnProfileInput = {
  display_name: string;
  avatar: string | null;
  instagram: string | null;
  is_public: boolean;
  age_band: AgeBand | null;
  bio: string | null;
};

export async function saveOwnProfile(
  userId: string,
  input: OwnProfileInput
): Promise<SocialResult<OwnProfile>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const row = {
      user_id: userId,
      display_name: input.display_name.trim().slice(0, 40),
      avatar: input.avatar,
      instagram: normalizeInstagram(input.instagram),
      is_public: input.is_public,
      age_band: input.age_band,
      bio: input.bio?.trim().slice(0, 300) || null,
    };
    const { data, error } = await supabase
      .from("user_public_profile")
      .upsert(row, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    if (error) return fail(error);
    return ok(mapOwn(userId, (data as Record<string, unknown> | null) ?? row));
  } catch (e) {
    return fail(e);
  }
}

/** Бусдын профайл (chat_profiles view: нэр/avatar үргэлж, бусад нь is_public үед). */
export async function getPublicProfile(
  userId: string
): Promise<SocialResult<PublicProfile | null>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase
      .from("chat_profiles")
      .select(
        "user_id, display_name, avatar, is_public, level_label, instagram, bio, age_band, chat_banned"
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return fail(error);
    if (!data) return ok(null);
    const row = data as Record<string, unknown>;
    return ok({
      user_id: String(row.user_id),
      display_name: typeof row.display_name === "string" ? row.display_name : "",
      avatar: typeof row.avatar === "string" ? row.avatar : null,
      is_public: row.is_public === true,
      level_label: typeof row.level_label === "string" ? row.level_label : null,
      instagram: typeof row.instagram === "string" ? row.instagram : null,
      bio: typeof row.bio === "string" ? row.bio : null,
      age_band: isAgeBand(row.age_band) ? row.age_band : null,
      chat_banned: row.chat_banned === true,
    });
  } catch (e) {
    return fail(e);
  }
}

/** Оноо — `user_points_summary` байхгүй эсвэл эрх хүрэхгүй бол null. */
export async function getPointsTotal(userId: string): Promise<number | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("user_points_summary")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    for (const key of ["total_points", "points_total", "total", "points"]) {
      const v = row[key];
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
  } catch {
    return null;
  }
}

export function profileInitial(name: string | null | undefined): string {
  const t = (name ?? "").trim();
  return t ? Array.from(t)[0].toUpperCase() : "?";
}
