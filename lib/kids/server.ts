import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { deleteUserOwnedRows } from "@/lib/server/user-data-cleanup";
import {
  DEFAULT_KID_AVATAR,
  KID_NAME_MAX_LENGTH,
  isKidAvatar,
  isKidEmail,
  isValidKidPin,
  kidEmailForId,
  type KidLoginTokens,
  type KidProfile,
} from "@/lib/kids/types";

/**
 * Хүүхдийн бүртгэл (migration 065) — зөвхөн server (service role).
 *
 * Хүүхэд бүр жинхэнэ Supabase auth хэрэглэгч: зохиомол имэйл + нууц үг нь
 * HMAC(secret, childUserId) — хаана ч хадгалагдахгүй. PIN-г sha256(childId + pin)
 * хэлбэрээр kid_profiles-д хадгална.
 */

export type KidsResult<T> =
  | { ok: true; data: T; warning?: string }
  | { ok: false; status: number; error: string; adminHint?: string };

/** Service role байхгүй үеийн тайлбар (ADMIN_SERVICE_ROLE_ENV_HINT загвараар). */
export const KIDS_SERVICE_ROLE_ENV_HINT =
  "Vercel → Settings → Environment Variables дээр SUPABASE_SERVICE_ROLE_KEY нэмнэ үү " +
  "(утга: Supabase Dashboard → Settings → API → service_role). " +
  "Зөвхөн server route-д ашиглана — client bundle-д орохгүй. " +
  "Сонголтоор KIDS_PASSWORD_SECRET (урт санамсаргүй мөр) нэмбэл хүүхдийн нууц үгийг түүгээр гаргана.";

export const KIDS_NOT_CONFIGURED_MESSAGE =
  "Хүүхдийн бүртгэл одоогоор идэвхгүй байна — сервер дээр тохиргоо дутуу (SUPABASE_SERVICE_ROLE_KEY).";

const MIGRATION_MISSING_MESSAGE =
  "Хүүхдийн бүртгэлийн хүснэгт алга — Supabase дээр 065_kid_profiles.sql migration-ийг ажиллуулна уу.";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- Crypto helpers ---

function passwordSecret(): string | null {
  return process.env.KIDS_PASSWORD_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/** Хүүхдийн нууц үг — хэзээ ч хадгалагдахгүй, шаардлагатай үед л гаргана. */
function deriveKidPassword(childUserId: string): string {
  const secret = passwordSecret();
  if (!secret) throw new Error("KIDS_PASSWORD_SECRET / SUPABASE_SERVICE_ROLE_KEY missing");
  return createHmac("sha256", secret).update(childUserId).digest("hex");
}

function hashKidPin(childUserId: string, pin: string): string {
  return createHash("sha256").update(childUserId + pin).digest("hex");
}

function pinMatches(childUserId: string, pin: string, storedHash: string): boolean {
  const a = Buffer.from(hashKidPin(childUserId, pin), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- PIN brute-force хамгаалалт (instance бүрт санах ойд; хялбар хязгаарлалт) ---

const PIN_MAX_FAILS = 5;
const PIN_LOCK_MS = 60_000;
const pinFailures = new Map<string, { count: number; lockedUntil: number }>();

function pinLockedSeconds(childUserId: string): number {
  const entry = pinFailures.get(childUserId);
  if (!entry || entry.lockedUntil <= Date.now()) return 0;
  return Math.ceil((entry.lockedUntil - Date.now()) / 1000);
}

function recordPinFailure(childUserId: string): void {
  const entry = pinFailures.get(childUserId) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= PIN_MAX_FAILS) {
    entry.count = 0;
    entry.lockedUntil = Date.now() + PIN_LOCK_MS;
  }
  pinFailures.set(childUserId, entry);
}

// --- Generic helpers ---

function fail<T>(status: number, error: string, adminHint?: string): KidsResult<T> {
  return { ok: false, status, error, adminHint };
}

function isMissingTableError(message: string | undefined): boolean {
  const lower = (message ?? "").toLowerCase();
  return (
    lower.includes("kid_profiles") &&
    (lower.includes("does not exist") ||
      lower.includes("schema cache") ||
      lower.includes("could not find"))
  );
}

function dbError<T>(message: string): KidsResult<T> {
  if (isMissingTableError(message)) return fail(503, MIGRATION_MISSING_MESSAGE);
  return fail(500, message);
}

function requireService(): { ok: true; client: SupabaseClient } | { ok: false; result: KidsResult<never> } {
  if (!hasServiceRoleSupabaseConfig) {
    return {
      ok: false,
      result: { ok: false, status: 503, error: KIDS_NOT_CONFIGURED_MESSAGE, adminHint: KIDS_SERVICE_ROLE_ENV_HINT },
    };
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return {
      ok: false,
      result: { ok: false, status: 503, error: "Service client үүсгэж чадсангүй.", adminHint: KIDS_SERVICE_ROLE_ENV_HINT },
    };
  }
  return { ok: true, client };
}

function cleanName(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, KID_NAME_MAX_LENGTH) : "";
}

function cleanBirthYear(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) return null;
  const year = new Date().getFullYear();
  return n >= year - 20 && n <= year ? n : null;
}

type KidRow = {
  child_user_id: string;
  guardian_user_id: string;
  display_name: string;
  avatar: string;
  pin_hash: string;
  birth_year: number | null;
  classroom_id: string | null;
  created_at: string | null;
};

const KID_COLUMNS =
  "child_user_id, guardian_user_id, display_name, avatar, pin_hash, birth_year, classroom_id, created_at";

async function getKidRow(
  service: SupabaseClient,
  childUserId: string
): Promise<KidsResult<KidRow>> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(childUserId)) {
    return fail(400, "Хүүхдийн бүртгэл олдсонгүй.");
  }
  const { data, error } = await service
    .from("kid_profiles")
    .select(KID_COLUMNS)
    .eq("child_user_id", childUserId)
    .maybeSingle();
  if (error) return dbError(error.message);
  if (!data) return fail(404, "Хүүхдийн бүртгэл олдсонгүй.");
  return { ok: true, data: data as KidRow };
}

async function canManageClassroom(
  service: SupabaseClient,
  classroomId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await service.rpc("can_manage_org_classroom", {
    classroom_id: classroomId,
    check_user_id: userId,
  });
  if (error) return false;
  return data === true;
}

async function findClassroomByJoinCode(
  service: SupabaseClient,
  code: string
): Promise<KidsResult<{ id: string; name: string }>> {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return fail(400, "Ангийн код 6 оронтой байх ёстой.");
  const { data, error } = await service
    .from("classrooms")
    .select("id, name")
    .eq("join_code", clean)
    .eq("status", "active")
    .maybeSingle();
  if (error) return fail(500, error.message);
  if (!data) return fail(404, "Ийм кодтой анги олдсонгүй.");
  return { ok: true, data: { id: String(data.id), name: String(data.name) } };
}

async function addKidToClassroom(
  service: SupabaseClient,
  classroomId: string,
  childUserId: string,
  displayName: string
): Promise<string | null> {
  const { data: existing } = await service
    .from("classroom_students")
    .select("id")
    .eq("classroom_id", classroomId)
    .eq("student_user_id", childUserId)
    .limit(1)
    .maybeSingle();
  if (existing) {
    const { error } = await service
      .from("classroom_students")
      .update({ status: "active", display_name: displayName })
      .eq("id", existing.id);
    return error?.message ?? null;
  }
  const { error } = await service.from("classroom_students").insert({
    classroom_id: classroomId,
    student_user_id: childUserId,
    display_name: displayName,
    email: null,
    status: "active",
    joined_at: new Date().toISOString(),
  });
  return error?.message ?? null;
}

async function removeKidFromClassroom(
  service: SupabaseClient,
  classroomId: string,
  childUserId: string
): Promise<string | null> {
  const { error } = await service
    .from("classroom_students")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("student_user_id", childUserId);
  return error?.message ?? null;
}

/** Хүүхдийн мөрийг ангийн нэр, сүүлийн идэвхтэй огноогоор баяжуулна. */
async function enrichKidRows(
  service: SupabaseClient,
  rows: KidRow[],
  callerUserId: string
): Promise<KidProfile[]> {
  if (rows.length === 0) return [];
  const childIds = rows.map((r) => r.child_user_id);
  const classIds = [...new Set(rows.map((r) => r.classroom_id).filter((v): v is string => Boolean(v)))];

  const [classesRes, streaksRes, authUsers] = await Promise.all([
    classIds.length
      ? service.from("classrooms").select("id, name").in("id", classIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
    service
      .from("user_streaks")
      .select("user_id, current_streak, last_active_date")
      .in("user_id", childIds),
    Promise.all(
      childIds.map(async (id) => {
        const { data } = await service.auth.admin.getUserById(id);
        return { id, lastSignInAt: data.user?.last_sign_in_at ?? null };
      })
    ),
  ]);

  const classNames = new Map<string, string>();
  for (const c of (classesRes.data ?? []) as Array<{ id: string; name: string }>) {
    classNames.set(String(c.id), String(c.name));
  }
  const streaks = new Map<string, { current: number; lastActive: string | null }>();
  for (const s of (streaksRes.data ?? []) as Array<Record<string, unknown>>) {
    streaks.set(String(s.user_id), {
      current: Number(s.current_streak ?? 0),
      lastActive: s.last_active_date ? String(s.last_active_date) : null,
    });
  }
  const signIns = new Map(authUsers.map((u) => [u.id, u.lastSignInAt]));

  return rows.map((r) => {
    const streak = streaks.get(r.child_user_id);
    const candidates = [streak?.lastActive ?? null, signIns.get(r.child_user_id) ?? null].filter(
      (v): v is string => Boolean(v)
    );
    const lastActiveAt =
      candidates.length > 0
        ? candidates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
        : null;
    return {
      childUserId: r.child_user_id,
      guardianUserId: r.guardian_user_id,
      displayName: r.display_name,
      avatar: r.avatar || DEFAULT_KID_AVATAR,
      birthYear: r.birth_year ?? null,
      classroomId: r.classroom_id ?? null,
      classroomName: r.classroom_id ? classNames.get(r.classroom_id) ?? null : null,
      lastActiveAt,
      currentStreak: streak?.current ?? 0,
      createdAt: r.created_at ?? null,
      isGuardian: r.guardian_user_id === callerUserId,
    };
  });
}

// --- Route caller ---

export type KidsCaller = { userId: string; email: string | null };

/**
 * Route handler-т: cookie session-оос нэвтэрсэн том хүнийг (эцэг эх/багш) авна.
 * Хүүхдийн session-оор хүүхэд удирдах боломжгүй.
 */
export async function getKidsCaller(): Promise<KidsResult<KidsCaller>> {
  if (!hasServerSupabaseConfig) return fail(503, "Supabase тохируулагдаагүй.");
  const sessionClient = await createServerSupabaseClient();
  if (!sessionClient) return fail(503, "Server client үүсгэж чадсангүй.");
  const { data: auth } = await sessionClient.auth.getUser();
  const user = auth.user;
  if (!user?.id) return fail(401, "Эцэг эх эсвэл багш эхлээд нэвтэрнэ үү.");
  if (user.user_metadata?.kid === true || isKidEmail(user.email)) {
    return fail(403, "Хүүхдийн бүртгэлээр энэ үйлдлийг хийх боломжгүй. Эцэг эх нэвтэрнэ үү.");
  }
  return { ok: true, data: { userId: user.id, email: user.email ?? null } };
}

// --- Public API ---

export async function listKids(input: {
  callerUserId: string;
  classroomId?: string | null;
}): Promise<KidsResult<KidProfile[]>> {
  const svc = requireService();
  if (!svc.ok) return svc.result;
  const service = svc.client;

  let query = service.from("kid_profiles").select(KID_COLUMNS).order("created_at", { ascending: true });
  if (input.classroomId) {
    if (!(await canManageClassroom(service, input.classroomId, input.callerUserId))) {
      return fail(403, "Энэ ангийг удирдах эрхгүй байна.");
    }
    query = query.eq("classroom_id", input.classroomId);
  } else {
    query = query.eq("guardian_user_id", input.callerUserId);
  }

  const { data, error } = await query;
  if (error) return dbError(error.message);
  const kids = await enrichKidRows(service, (data ?? []) as KidRow[], input.callerUserId);
  return { ok: true, data: kids };
}

export async function createKid(input: {
  guardianUserId: string;
  displayName: string;
  avatar?: string | null;
  pin: string;
  birthYear?: number | string | null;
  classroomJoinCode?: string | null;
  /** Багшийн ангийн хуудаснаас: ангийг шууд id-аар (багш эрхийг шалгана). */
  classroomId?: string | null;
}): Promise<KidsResult<KidProfile>> {
  const displayName = cleanName(input.displayName);
  if (!displayName) return fail(400, "Хүүхдийн нэрийг оруулна уу.");
  if (!isValidKidPin(input.pin)) return fail(400, "PIN яг 4 оронтой тоо байх ёстой.");
  const avatar = isKidAvatar(input.avatar) ? input.avatar : DEFAULT_KID_AVATAR;
  const birthYear = cleanBirthYear(input.birthYear);

  const svc = requireService();
  if (!svc.ok) return svc.result;
  const service = svc.client;

  // Анги (сонголттой)
  let classroom: { id: string; name: string | null } | null = null;
  if (input.classroomId) {
    if (!(await canManageClassroom(service, input.classroomId, input.guardianUserId))) {
      return fail(403, "Энэ ангийг удирдах эрхгүй байна.");
    }
    classroom = { id: input.classroomId, name: null };
  } else if (input.classroomJoinCode?.trim()) {
    const found = await findClassroomByJoinCode(service, input.classroomJoinCode);
    if (!found.ok) return found;
    classroom = found.data;
  }

  // Хүснэгт байгаа эсэхийг auth user үүсгэхээс өмнө шалгана
  const probe = await service.from("kid_profiles").select("child_user_id").limit(1);
  if (probe.error) return dbError(probe.error.message);

  const childUserId = randomUUID();
  const { error: createError } = await service.auth.admin.createUser({
    id: childUserId,
    email: kidEmailForId(childUserId),
    email_confirm: true,
    password: deriveKidPassword(childUserId),
    user_metadata: { kid: true, display_name: displayName, avatar },
  });
  if (createError) {
    return fail(500, `Хүүхдийн бүртгэл үүсгэж чадсангүй: ${createError.message}`);
  }

  const { data: inserted, error: insertError } = await service
    .from("kid_profiles")
    .insert({
      child_user_id: childUserId,
      guardian_user_id: input.guardianUserId,
      display_name: displayName,
      avatar,
      pin_hash: hashKidPin(childUserId, input.pin),
      birth_year: birthYear,
      classroom_id: classroom?.id ?? null,
    })
    .select(KID_COLUMNS)
    .single();

  if (insertError || !inserted) {
    // Rollback: өнчин auth хэрэглэгч үлдээхгүй
    await service.auth.admin.deleteUser(childUserId);
    return dbError(insertError?.message ?? "kid_profiles insert failed");
  }

  let warning: string | undefined;
  if (classroom) {
    const joinError = await addKidToClassroom(service, classroom.id, childUserId, displayName);
    if (joinError) warning = `Бүртгэл үүслээ, гэхдээ ангид нэмж чадсангүй: ${joinError}`;
  }

  const [kid] = await enrichKidRows(service, [inserted as KidRow], input.guardianUserId);
  return { ok: true, data: kid, warning };
}

export async function kidLogin(input: {
  guardianUserId: string;
  childUserId: string;
  pin: string;
}): Promise<KidsResult<KidLoginTokens>> {
  if (!isValidKidPin(input.pin)) return fail(400, "PIN яг 4 оронтой тоо байх ёстой.");

  const svc = requireService();
  if (!svc.ok) return svc.result;
  const service = svc.client;

  const row = await getKidRow(service, input.childUserId);
  if (!row.ok) return row;
  const kid = row.data;

  const allowed =
    kid.guardian_user_id === input.guardianUserId ||
    (kid.classroom_id
      ? await canManageClassroom(service, kid.classroom_id, input.guardianUserId)
      : false);
  if (!allowed) return fail(403, "Энэ хүүхдээр нэвтрүүлэх эрхгүй байна.");

  const locked = pinLockedSeconds(kid.child_user_id);
  if (locked > 0) {
    return fail(429, `Олон удаа буруу PIN оруулсан. ${locked} секундын дараа дахин оролдоно уу.`);
  }
  if (!pinMatches(kid.child_user_id, input.pin, kid.pin_hash)) {
    recordPinFailure(kid.child_user_id);
    return fail(401, "PIN буруу байна.");
  }
  pinFailures.delete(kid.child_user_id);

  if (!supabaseUrl || !supabaseAnonKey) return fail(503, "Supabase тохируулагдаагүй.");
  // Шинэ, session хадгалахгүй client — service client-ийн төлөвийг бохирдуулахгүй
  const anon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({
    email: kidEmailForId(kid.child_user_id),
    password: deriveKidPassword(kid.child_user_id),
  });
  if (error || !data.session) {
    return fail(500, `Хүүхдээр нэвтэрч чадсангүй: ${error?.message ?? "session алга"}`);
  }

  return {
    ok: true,
    data: {
      childUserId: kid.child_user_id,
      displayName: kid.display_name,
      avatar: kid.avatar || DEFAULT_KID_AVATAR,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  };
}

export async function updateKid(input: {
  guardianUserId: string;
  childUserId: string;
  displayName?: string | null;
  avatar?: string | null;
  pin?: string | null;
  birthYear?: number | string | null;
  /** undefined = өөрчлөхгүй, null/"" = ангиас гаргах, код = шинэ ангид шилжүүлэх */
  classroomJoinCode?: string | null;
}): Promise<KidsResult<KidProfile>> {
  const svc = requireService();
  if (!svc.ok) return svc.result;
  const service = svc.client;

  const row = await getKidRow(service, input.childUserId);
  if (!row.ok) return row;
  const kid = row.data;
  if (kid.guardian_user_id !== input.guardianUserId) {
    return fail(403, "Зөвхөн асран хамгаалагч засах боломжтой.");
  }

  const patch: Record<string, unknown> = {};
  const metadata: Record<string, unknown> = {};

  if (input.displayName !== undefined && input.displayName !== null) {
    const name = cleanName(input.displayName);
    if (!name) return fail(400, "Хүүхдийн нэрийг оруулна уу.");
    patch.display_name = name;
    metadata.display_name = name;
  }
  if (input.avatar !== undefined && input.avatar !== null) {
    if (!isKidAvatar(input.avatar)) return fail(400, "Avatar буруу байна.");
    patch.avatar = input.avatar;
    metadata.avatar = input.avatar;
  }
  if (input.pin) {
    if (!isValidKidPin(input.pin)) return fail(400, "PIN яг 4 оронтой тоо байх ёстой.");
    patch.pin_hash = hashKidPin(kid.child_user_id, input.pin);
  }
  if (input.birthYear !== undefined) {
    patch.birth_year = cleanBirthYear(input.birthYear);
  }

  // Анги солих
  let newClassroomId: string | null | undefined;
  if (input.classroomJoinCode !== undefined) {
    if (!input.classroomJoinCode || !input.classroomJoinCode.trim()) {
      newClassroomId = null;
    } else {
      const found = await findClassroomByJoinCode(service, input.classroomJoinCode);
      if (!found.ok) return found;
      newClassroomId = found.data.id;
    }
    patch.classroom_id = newClassroomId;
  }

  const finalName = (patch.display_name as string | undefined) ?? kid.display_name;
  let warning: string | undefined;

  if (Object.keys(patch).length > 0) {
    const { error } = await service
      .from("kid_profiles")
      .update(patch)
      .eq("child_user_id", kid.child_user_id);
    if (error) return dbError(error.message);
  }

  if (Object.keys(metadata).length > 0) {
    const { error } = await service.auth.admin.updateUserById(kid.child_user_id, {
      user_metadata: { kid: true, display_name: finalName, avatar: patch.avatar ?? kid.avatar },
    });
    if (error) warning = `Нэвтрэлтийн мэдээллийг шинэчилж чадсангүй: ${error.message}`;
  }

  if (newClassroomId !== undefined && newClassroomId !== kid.classroom_id) {
    if (kid.classroom_id) {
      const removeError = await removeKidFromClassroom(service, kid.classroom_id, kid.child_user_id);
      if (removeError) warning = `Хуучин ангиас гаргаж чадсангүй: ${removeError}`;
    }
    if (newClassroomId) {
      const joinError = await addKidToClassroom(service, newClassroomId, kid.child_user_id, finalName);
      if (joinError) warning = `Шинэ ангид нэмж чадсангүй: ${joinError}`;
    }
  } else if (patch.display_name && kid.classroom_id) {
    await service
      .from("classroom_students")
      .update({ display_name: finalName })
      .eq("classroom_id", kid.classroom_id)
      .eq("student_user_id", kid.child_user_id);
  }

  const updated = await getKidRow(service, kid.child_user_id);
  if (!updated.ok) return updated;
  const [profile] = await enrichKidRows(service, [updated.data], input.guardianUserId);
  return { ok: true, data: profile, warning };
}

export async function deleteKid(input: {
  guardianUserId: string;
  childUserId: string;
}): Promise<KidsResult<{ childUserId: string }>> {
  const svc = requireService();
  if (!svc.ok) return svc.result;
  const service = svc.client;

  const row = await getKidRow(service, input.childUserId);
  if (!row.ok) return row;
  if (row.data.guardian_user_id !== input.guardianUserId) {
    return fail(403, "Зөвхөн асран хамгаалагч устгах боломжтой.");
  }

  const cleanupErrors = await deleteUserOwnedRows(service, input.childUserId);
  if (cleanupErrors.length > 0) {
    return fail(
      500,
      `Зарим өгөгдлийг устгаж чадсангүй тул бүртгэл устгаагүй: ${cleanupErrors.join("; ")}`
    );
  }

  // auth user устгахад kid_profiles мөр FK-аар (on delete cascade) устна
  const { error } = await service.auth.admin.deleteUser(input.childUserId);
  if (error) return fail(500, `Хүүхдийн бүртгэл устгахад алдаа гарлаа: ${error.message}`);
  pinFailures.delete(input.childUserId);
  return { ok: true, data: { childUserId: input.childUserId } };
}

// --- Route handler helpers ---

/** KidsResult → JSON хариу ({ ok, data?, message?, adminHint?, warning? }). */
export function kidsJson<T>(result: KidsResult<T>): NextResponse {
  if (result.ok) {
    return NextResponse.json({ ok: true, data: result.data, warning: result.warning ?? null });
  }
  return NextResponse.json(
    {
      ok: false,
      message: result.error,
      adminHint: result.adminHint ?? null,
      serviceRoleMissing: result.adminHint === KIDS_SERVICE_ROLE_ENV_HINT,
    },
    { status: result.status }
  );
}

/** Request body-г JSON объект болгож уншина (алдаатай бол хоосон объект). */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function stringField(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
}
