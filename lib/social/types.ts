export type ChatKind = "class" | "topic" | "team" | "age" | "dm";

export type AgeBand = "13-17" | "18-24" | "25-34" | "35+";

export const AGE_BANDS: AgeBand[] = ["13-17", "18-24", "25-34", "35+"];

export const TEAM_MAX_MEMBERS = 5;
export const MESSAGE_MAX_LENGTH = 2000;

export type ChatRoom = {
  id: string;
  kind: ChatKind;
  title: string;
  topic: string | null;
  description: string | null;
  owner_user_id: string | null;
  classroom_id: string | null;
  age_band: AgeBand | null;
  language: string;
  is_open: boolean;
  is_closed: boolean;
  max_members: number | null;
  created_at: string;
  member_count: number;
  is_member: boolean;
  owner_name: string | null;
  owner_avatar: string | null;
};

export type ChatMember = {
  room_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  display_name: string;
  avatar: string | null;
};

export type ChatMessage = {
  id: number;
  room_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type PublicProfile = {
  user_id: string;
  display_name: string;
  avatar: string | null;
  is_public: boolean;
  level_label: string | null;
  instagram: string | null;
  bio: string | null;
  age_band: AgeBand | null;
  chat_banned?: boolean;
};

/** Өөрийн профайлын засах талбарууд (user_public_profile). */
export type OwnProfile = {
  user_id: string;
  display_name: string;
  avatar: string | null;
  instagram: string | null;
  is_public: boolean;
  level_label: string | null;
  age_band: AgeBand | null;
  bio: string | null;
  chat_banned: boolean;
};

export type SocialResult<T> = { data: T | null; error: string | null };

export function ok<T>(data: T): SocialResult<T> {
  return { data, error: null };
}

export function fail<T>(error: unknown): SocialResult<T> {
  return { data: null, error: socialErrorMessage(error) };
}

/** Supabase / SQL алдааг монгол мессеж болгоно. */
export function socialErrorMessage(error: unknown): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Алдаа гарлаа";
  if (raw.includes("chat_room_full")) return "Өрөө дүүрсэн байна.";
  if (raw.includes("chat_rooms_one_topic_per_owner"))
    return "Та аль хэдийн нэг сэдвийн өрөө нээсэн байна.";
  if (raw.includes("row-level security") || raw.includes("not_allowed"))
    return "Энэ үйлдлийг хийх эрх алга.";
  if (raw.includes("blocked")) return "Энэ хэрэглэгчтэй мессеж бичих боломжгүй.";
  if (raw.includes("Supabase is not configured")) return "Supabase тохиргоо дутуу байна.";
  return raw;
}
