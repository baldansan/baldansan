/** Хүүхдийн бүртгэл (migration 065) — client/server хоёуланд хэрэглэгдэх төрөл, тогтмол. */

export type KidProfile = {
  childUserId: string;
  guardianUserId: string;
  displayName: string;
  avatar: string;
  birthYear: number | null;
  classroomId: string | null;
  classroomName: string | null;
  /** Сүүлд идэвхтэй байсан огноо (ISO) — streak эсвэл сүүлийн нэвтрэлтээс. */
  lastActiveAt: string | null;
  currentStreak: number;
  createdAt: string | null;
  /** Нэвтэрсэн хэрэглэгч энэ хүүхдийн асран хамгаалагч мөн эсэх (багш бол false байж болно). */
  isGuardian: boolean;
};

export type KidLoginTokens = {
  childUserId: string;
  displayName: string;
  avatar: string;
  accessToken: string;
  refreshToken: string;
};

/** Хүүхэд сонгох avatar-ууд. */
export const KID_AVATARS = [
  "🐼",
  "🐯",
  "🦊",
  "🐰",
  "🐻",
  "🐨",
  "🦁",
  "🐸",
  "🐵",
  "🐧",
  "🦄",
  "🐶",
] as const;

export const DEFAULT_KID_AVATAR = "🐼";

/** Зохиомол имэйлийн домэйн — энэ хаяг руу имэйл хэзээ ч очихгүй. */
export const KID_EMAIL_DOMAIN = "kids.buunduu.mn";

export const KID_MODE_STORAGE_KEY = "buunduu-kid-mode-v1";
export const KID_MODE_PROFILE_STORAGE_KEY = "buunduu-kid-profile-v1";
export const GUARDIAN_EMAIL_STORAGE_KEY = "buunduu-guardian-email-v1";

export const KID_NAME_MAX_LENGTH = 40;

export function isValidKidPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function isKidAvatar(value: unknown): value is string {
  return typeof value === "string" && (KID_AVATARS as readonly string[]).includes(value);
}

export function kidEmailForId(childUserId: string): string {
  return `kid-${childUserId}@${KID_EMAIL_DOMAIN}`;
}

export function isKidEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${KID_EMAIL_DOMAIN}`));
}
