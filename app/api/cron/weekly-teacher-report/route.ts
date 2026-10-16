import { NextResponse } from "next/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { getWeeklyTeacherReportData } from "@/lib/supabase/teacher-weekly-report-data";
import {
  isWeeklyReportResendConfigured,
  sendWeeklyTeacherReportEmail,
} from "@/lib/server/email/teacher-weekly-report-email";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron (vercel.json: "0 0 * * 1", UTC) — Улаанбаатар бол UTC+8 тул энэ нь
 * Даваа гарагийн өглөө 08:00 УБ-ын цагаар ажиллана.
 * Идэвхтэй багш бүрт долоо хоногийн тайлан имэйлээр илгээнэ.
 * Стандарт Vercel cron загвар: Authorization: Bearer <CRON_SECRET> эсвэл
 * x-vercel-cron толгойгоор баталгаажуулна. CRON_SECRET тохируулаагүй бол
 * алгасаж лог бичнэ (local dev-д тус бүртгэл шаардахгүй).
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Орчны хувьсагч тохируулаагүй — локал/preview орчинд cron-г блоклохгүй,
    // production дээр CRON_SECRET тохируулахыг зөвлөнө.
    return true;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRoleSupabaseConfig) {
    console.log("[weekly-teacher-report] Supabase service-role тохируулаагүй — алгаслаа.");
    return NextResponse.json(
      { ok: false, skipped: true, reason: "Service role Supabase not configured" },
      { status: 200 }
    );
  }

  if (!isWeeklyReportResendConfigured()) {
    console.log(
      "[weekly-teacher-report] RESEND_API_KEY/RESEND_FROM_EMAIL тохируулаагүй — алгаслаа."
    );
    return NextResponse.json(
      { ok: false, skipped: true, reason: "Resend not configured" },
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

  const { data: teachers, error } = await service
    .from("teacher_profiles")
    .select("user_id, display_name, weekly_report_enabled");

  if (error) {
    console.error("[weekly-teacher-report] teacher_profiles уншихад алдаа:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const activeTeachers = (teachers ?? []).filter(
    (t) => t.weekly_report_enabled !== false
  );

  const results: Array<{ teacherUserId: string; ok: boolean; reason?: string }> = [];

  for (const teacher of activeTeachers) {
    const teacherUserId = String(teacher.user_id);
    const teacherName = String(teacher.display_name ?? "Багш");

    try {
      const { data: authUser } = await service.auth.admin.getUserById(teacherUserId);
      const email = authUser?.user?.email;
      if (!email) {
        results.push({ teacherUserId, ok: false, reason: "no email" });
        continue;
      }

      const reportData = await getWeeklyTeacherReportData(
        service,
        teacherUserId,
        teacherName
      );
      if (!reportData || reportData.classCount === 0) {
        results.push({ teacherUserId, ok: false, reason: "no classrooms" });
        continue;
      }

      const sendResult = await sendWeeklyTeacherReportEmail(email, reportData);
      results.push({
        teacherUserId,
        ok: sendResult.ok,
        reason: sendResult.reason ?? sendResult.error,
      });
    } catch (e) {
      console.error("[weekly-teacher-report] багшийн тайлан бэлтгэхэд алдаа:", e);
      results.push({
        teacherUserId,
        ok: false,
        reason: e instanceof Error ? e.message : "unknown error",
      });
    }
  }

  const sentCount = results.filter((r) => r.ok).length;
  console.log(
    `[weekly-teacher-report] ${activeTeachers.length} багшаас ${sentCount} илгээлээ.`
  );

  return NextResponse.json({
    ok: true,
    teacherCount: activeTeachers.length,
    sentCount,
    results,
  });
}
