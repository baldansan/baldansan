import { NextResponse } from "next/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { runAssignmentSchedulesServer } from "@/lib/server/assignment-schedules-server";
import { sendPushToUsers } from "@/lib/server/push/send-to-users";

export const dynamic = "force-dynamic";


function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/**
 * Vercel Cron (vercel.json: "0 1 * * *", UTC) — Улаанбаатар бол UTC+8 тул энэ нь
 * өдөр бүр 09:00 УБ-ын цагаар ажиллана.
 * Долоо хоног бүрийн автомат даалгаврыг үүсгэж, сурагчдад мэдэгдэнэ.
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

  // Долоо хоног бүрийн автомат даалгавар (091) — мэдэгдлийн тохиргооноос үл хамаарч ажиллана.
  const scheduleService = createServiceRoleSupabaseClient();
  let schedules: Awaited<ReturnType<typeof runAssignmentSchedulesServer>> | null = null;
  if (scheduleService) {
    try {
      schedules = await runAssignmentSchedulesServer(scheduleService);
      for (const n of schedules.notify) {
        await sendPushToUsers(scheduleService, n.userIds, {
          title: "📌 Багшийн шинэ даалгавар",
          body: n.title,
          url: "/home",
        });
      }
      console.log("[cron] assignment schedules:", schedules.due, "due,", schedules.created, "created");
    } catch (e) {
      console.error("[cron] assignment schedules failed:", e);
    }
  }

  // Олон хоног ороогүй хүнд явуулах сануулга эндээс салсан: /api/cron/inactive-reminder
  // (орой 20:00 УБ, өдөр бүр өөр үгтэй, бүх төхөөрөмж рүү). Энэ ажил одоо зөвхөн
  // долоо хоногийн автомат даалгаврыг үүсгэж мэдэгдэнэ.
  return NextResponse.json({ ok: true, schedules: schedules ? { due: schedules.due, created: schedules.created } : null });
}
