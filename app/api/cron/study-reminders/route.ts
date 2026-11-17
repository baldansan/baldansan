import { NextResponse } from "next/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { sendPushToUsers } from "@/lib/server/push/send-to-users";

export const dynamic = "force-dynamic";

/** Сурагчдын цаг: Улаанбаатар / Хөх хот хоёулаа UTC+8. */
const TZ_OFFSET_MIN = 8 * 60;
/** Дуудлага хоорондын зайнаас арай урт цонх — нэг ч сануулга алгасахгүй. */
const WINDOW_MIN = 25;
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

type ReminderRow = {
  id: string;
  user_id: string;
  title: string | null;
  reminder_time: string | null;
  days_of_week: string[] | null;
  last_shown_at: string | null;
};

/**
 * «Миний сурах систем»-ийн сануулга: сурагчийн сонгосон цагт утсанд нь мэдэгдэл илгээнэ.
 * 10–15 минут тутам дуудагдана (supabase/migrations/102 — pg_cron). Нэг сануулга өдөрт нэг л удаа.
 * Нууц мэдээлэл буцаадаггүй, давхар илгээдэггүй тул түлхүүргүй дуудаж болно.
 */
export async function GET() {
  if (!hasServiceRoleSupabaseConfig) {
    return NextResponse.json({ ok: false, skipped: true, reason: "service role not configured" });
  }
  const service = createServiceRoleSupabaseClient();
  if (!service) return NextResponse.json({ ok: false, skipped: true, reason: "no service client" });

  const local = new Date(Date.now() + TZ_OFFSET_MIN * 60_000);
  const today = local.toISOString().slice(0, 10);
  const dayKey = DAY_KEYS[local.getUTCDay()];
  const nowMin = local.getUTCHours() * 60 + local.getUTCMinutes();

  const { data, error } = await service
    .from("user_study_reminders")
    .select("id, user_id, title, reminder_time, days_of_week, last_shown_at")
    .eq("enabled", true)
    .not("reminder_time", "is", null)
    .limit(5000);
  if (error) return NextResponse.json({ ok: false, reason: error.message });

  const due = ((data ?? []) as ReminderRow[]).filter((r) => {
    const [h, m] = String(r.reminder_time ?? "").split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
    if (r.days_of_week?.length && !r.days_of_week.includes(dayKey)) return false;
    const diff = nowMin - (h * 60 + m);
    if (diff < 0 || diff >= WINDOW_MIN) return false;
    if (r.last_shown_at) {
      const shownLocal = new Date(new Date(r.last_shown_at).getTime() + TZ_OFFSET_MIN * 60_000);
      if (shownLocal.toISOString().slice(0, 10) === today) return false;
    }
    return true;
  });

  let sent = 0;
  let configured = true;
  for (const r of due) {
    const res = await sendPushToUsers(service, [r.user_id], {
      title: "⏰ Сурах цаг боллоо",
      body: r.title?.trim() || "Өнөөдрийн үгээ цээжилье!",
      url: "/home",
    });
    configured = res.configured;
    if (!res.configured) break;
    // Хүрээгүй бол тэмдэглэхгүй — апп нээхэд доторх сануулга гарна.
    if (!res.reached.size) continue;
    sent += 1;
    await service
      .from("user_study_reminders")
      .update({ last_shown_at: new Date().toISOString() })
      .eq("id", r.id);
  }

  return NextResponse.json({ ok: true, due: due.length, sent, pushConfigured: configured });
}
