import { NextResponse } from "next/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { isWebPushConfigured, sendWebPush } from "@/lib/server/push/web-push-client";

export const dynamic = "force-dynamic";

const INACTIVE_DAYS = 3;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * Vercel Cron (vercel.json: "0 1 * * *", UTC) — Улаанбаатар бол UTC+8 тул энэ нь
 * өдөр бүр 09:00 УБ-ын цагаар ажиллана.
 * 3+ хоног ороогүй сурагчдад push мэдэгдэл илгээнэ.
 * push_subscriptions хүснэгт (migration 076) болон web-push VAPID түлхүүр
 * тохируулаагүй бол лог бичээд graceful-degrade хийнэ.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRoleSupabaseConfig) {
    console.log("[inactive-student-check] Supabase service-role тохируулаагүй — алгаслаа.");
    return NextResponse.json(
      { ok: false, skipped: true, reason: "Service role Supabase not configured" },
      { status: 200 }
    );
  }

  if (!isWebPushConfigured()) {
    console.log("[inactive-student-check] VAPID түлхүүр тохируулаагүй — алгаслаа.");
    return NextResponse.json(
      { ok: false, skipped: true, reason: "VAPID keys not configured" },
      { status: 200 }
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json(
      { ok: false, message: "Could not create service-role client." },
      { status: 503 }
    );
  }

  // push_subscriptions хүснэгт байхгүй бол (migration ажиллуулаагүй) алгасна.
  const { data: subscriptions, error: subError } = await service
    .from("push_subscriptions")
    .select("id, user_id, endpoint, keys");

  if (subError) {
    console.log(
      "[inactive-student-check] push_subscriptions уншихад алдаа (migration ажиллуулаагүй байж болно) — алгаслаа:",
      subError.message
    );
    return NextResponse.json(
      { ok: false, skipped: true, reason: subError.message },
      { status: 200 }
    );
  }

  const subs = (subscriptions ?? []) as SubscriptionRow[];
  if (subs.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, sent: 0 });
  }

  const userIds = [...new Set(subs.map((s) => s.user_id))];
  const now = Date.now();
  const inactiveSinceMs = now - INACTIVE_DAYS * 24 * 60 * 60 * 1000;

  const [{ data: quizAttempts }, { data: vocabProgress }] = await Promise.all([
    service
      .from("user_quiz_attempts")
      .select("user_id, created_at")
      .in("user_id", userIds),
    service
      .from("user_vocabulary_progress")
      .select("user_id, updated_at")
      .in("user_id", userIds),
  ]);

  const lastActivity = new Map<string, number>();
  for (const row of [...(quizAttempts ?? []), ...(vocabProgress ?? [])]) {
    const uid = String((row as { user_id: string }).user_id);
    const atRaw =
      (row as { created_at?: string }).created_at ??
      (row as { updated_at?: string }).updated_at;
    if (!atRaw) continue;
    const at = new Date(atRaw).getTime();
    if (Number.isNaN(at)) continue;
    const prev = lastActivity.get(uid) ?? 0;
    if (at > prev) lastActivity.set(uid, at);
  }

  const inactiveUserIds = userIds.filter((uid) => {
    const last = lastActivity.get(uid);
    return last == null || last < inactiveSinceMs;
  });

  let sent = 0;
  const results: Array<{ userId: string; ok: boolean; reason?: string }> = [];

  for (const uid of inactiveUserIds) {
    const sub = subs.find((s) => s.user_id === uid);
    if (!sub) continue;

    const result = await sendWebPush(
      { endpoint: sub.endpoint, keys: sub.keys },
      {
        title: "Сурцгаая! 📚",
        body: "Чи 3-с дээш хоног ороогүй байна. Өнөөдөр 5 минут зарцуулж дасгалаа хийгээрэй!",
        url: "/",
      }
    );

    if (result.ok) sent += 1;
    results.push({ userId: uid, ok: result.ok, reason: result.reason ?? result.error });

    // Эндпойнт устсан (410/404) бол бүртгэлийг цэвэрлэнэ.
    if (!result.ok && (result.statusCode === 410 || result.statusCode === 404)) {
      await service.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }

  console.log(
    `[inactive-student-check] ${inactiveUserIds.length} идэвхгүй хэрэглэгчээс ${sent} мэдэгдэл илгээлээ.`
  );

  return NextResponse.json({
    ok: true,
    checked: userIds.length,
    inactive: inactiveUserIds.length,
    sent,
    results,
  });
}
