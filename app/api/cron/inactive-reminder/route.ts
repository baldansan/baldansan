import { NextResponse } from "next/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { sendPushToUsers } from "@/lib/server/push/send-to-users";
import { inactiveReminderPayload } from "@/lib/server/push/inactive-reminder-lines";
import { loadLastActivityByUser, loadPushUserIds } from "@/lib/server/push/audience";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Хэдэн хоног ороогүй бол сануулж эхлэх вэ. */
const INACTIVE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const TZ_OFFSET_MS = 8 * 60 * 60 * 1000; // Улаанбаатар / Хөх хот

/**
 * CRON_SECRET тохируулсан бол зөвхөн тэр түлхүүрээр. Тохируулаагүй бол зөвхөн Vercel-ийн
 * цагийн хуваарийн дуудлага (user-agent) бөгөөд 20 цагийн орчимд — гаднаас хэн нэгэн хаягийг
 * дуудаж хүмүүс рүү дахин дахин мэдэгдэл явуулахаас хамгаална.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  const fromVercelCron = (request.headers.get("user-agent") ?? "").includes("vercel-cron");
  const localHour = new Date(Date.now() + TZ_OFFSET_MS).getUTCHours();
  return fromVercelCron && localHour >= 19 && localHour <= 21;
}

/**
 * Vercel Cron (vercel.json: "0 12 * * *", UTC) = өдөр бүр 20:00 УБ-ын цагаар.
 * 3+ хоног ороогүй, мэдэгдэл асаасан хүн бүрд өдөрт нэг сануулга — өдөр бүр өөр үгтэй
 * (эзний шийдвэр 2026-11-28: өдөр бүр, зогсохгүй; үг нь Балдангийн өнгөөр).
 * Идэвх = сорил, үгийн давталт, өдрийн цуваа (user_streaks) гурвын хамгийн сүүлийнх.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!hasServiceRoleSupabaseConfig) {
    return NextResponse.json({ ok: false, skipped: true, reason: "service role not configured" });
  }
  const service = createServiceRoleSupabaseClient();
  if (!service) return NextResponse.json({ ok: false, skipped: true, reason: "no service client" });

  const pushUserIds = await loadPushUserIds(service);
  if (pushUserIds.length === 0) return NextResponse.json({ ok: true, checked: 0, sent: 0 });

  const lastActivity = await loadLastActivityByUser(service, pushUserIds);
  const now = Date.now();
  const localNow = new Date(now + TZ_OFFSET_MS);
  const dayOfYear = Math.floor(
    (Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()) -
      Date.UTC(localNow.getUTCFullYear(), 0, 0)) /
      DAY_MS
  );

  let inactive = 0;
  let sent = 0;
  let configured = true;
  for (const uid of pushUserIds) {
    const last = lastActivity.get(uid) ?? null;
    const days = last == null ? null : Math.floor((now - last) / DAY_MS);
    if (days != null && days < INACTIVE_DAYS) continue;
    inactive += 1;
    const res = await sendPushToUsers(service, [uid], inactiveReminderPayload(uid, days, dayOfYear));
    configured = res.configured;
    if (!res.configured) break;
    if (res.reached.size) sent += 1;
  }

  console.log(`[inactive-reminder] ${pushUserIds.length} хүнээс ${inactive} идэвхгүй, ${sent}-д хүрлээ.`);
  return NextResponse.json({ ok: true, checked: pushUserIds.length, inactive, sent, pushConfigured: configured });
}
