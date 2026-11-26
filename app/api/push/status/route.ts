import { NextResponse } from "next/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { isWebPushConfigured } from "@/lib/server/push/web-push-client";

export const dynamic = "force-dynamic";

/**
 * Сануулга (web push) бэлэн эсэхийг шалгах хуудас — зөвхөн тийм/үгүй хариу буцаана,
 * ямар ч түлхүүр, хэрэглэгчийн мэдээлэл гаргахгүй. Эзэн Vercel env болон Supabase SQL-ээ
 * тохируулсны дараа /api/push/status-ийг нээж бүгд true болсныг харна.
 */
export async function GET() {
  const serverPublic = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
  const clientPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";

  let subscriptionsTable = false;
  let remindersTable = false;
  if (hasServiceRoleSupabaseConfig) {
    const service = createServiceRoleSupabaseClient();
    if (service) {
      const [subs, reminders] = await Promise.all([
        service.from("push_subscriptions").select("id", { count: "exact", head: true }),
        service.from("user_study_reminders").select("id", { count: "exact", head: true }),
      ]);
      subscriptionsTable = !subs.error;
      remindersTable = !reminders.error;
    }
  }

  const checks = {
    /** VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_SUBJECT гурвуулаа байгаа эсэх */
    vapidServerKeys: isWebPushConfigured(),
    /** NEXT_PUBLIC_VAPID_PUBLIC_KEY байгаа эсэх (утсан дээр зөвшөөрөл асуухад хэрэгтэй) */
    vapidClientKey: Boolean(clientPublic),
    /** Дээрх хоёр public түлхүүр яг ижил эсэх */
    vapidKeysMatch: Boolean(serverPublic) && serverPublic === clientPublic,
    cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    serviceRole: hasServiceRoleSupabaseConfig,
    /** migration 076 ажилласан эсэх */
    pushSubscriptionsTable: subscriptionsTable,
    userStudyRemindersTable: remindersTable,
  };

  const ready =
    checks.vapidServerKeys &&
    checks.vapidClientKey &&
    checks.vapidKeysMatch &&
    checks.serviceRole &&
    checks.pushSubscriptionsTable &&
    checks.userStudyRemindersTable;

  return NextResponse.json({ ready, checks });
}
