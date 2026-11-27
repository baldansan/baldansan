import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { sendPushToUsers } from "@/lib/server/push/send-to-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Хувийн мессеж (dm) илгээсний дараа нөгөө хүний утсанд мэдэгдэл очуулна.
 * - Зөвхөн тэр өрөөний гишүүн дуудаж чадна; зөвхөн `dm` өрөөнд (бүлгийн чатад мэдэгдэл явуулахгүй).
 * - Бичвэрийг клиентээс авахгүй — өрөөний хамгийн сүүлийн, дуудагчийн өөрийн мессежийг серверээс уншина.
 * - Хүлээн авагч илгээгчийг блоклосон бол явуулахгүй.
 */
export async function POST(request: Request) {
  let roomId = "";
  try {
    roomId = String(((await request.json()) as { roomId?: string }).roomId ?? "").trim();
  } catch {
    // ignore
  }
  if (!/^[0-9a-f-]{36}$/i.test(roomId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const client = await createServerSupabaseClient();
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  const userId = auth.user?.id;
  if (!client || !userId) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasServiceRoleSupabaseConfig) return NextResponse.json({ ok: false, skipped: true });
  const service = createServiceRoleSupabaseClient();
  if (!service) return NextResponse.json({ ok: false, skipped: true });

  const [{ data: room }, { data: members }] = await Promise.all([
    service.from("chat_rooms").select("id, kind").eq("id", roomId).maybeSingle(),
    service.from("chat_members").select("user_id").eq("room_id", roomId).limit(5),
  ]);
  const memberIds = ((members ?? []) as { user_id: string }[]).map((m) => String(m.user_id));
  if (!room || room.kind !== "dm" || !memberIds.includes(userId)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const others = memberIds.filter((id) => id !== userId);
  if (others.length === 0) return NextResponse.json({ ok: true, reached: 0 });

  const [{ data: last }, { data: profile }, { data: blocks }] = await Promise.all([
    service
      .from("chat_messages")
      .select("body, created_at")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service.from("chat_profiles").select("display_name").eq("user_id", userId).maybeSingle(),
    service.from("user_blocks").select("blocker_id").eq("blocked_id", userId).in("blocker_id", others),
  ]);
  // Дөнгөж сая (2 минутын дотор) бичсэн мессеж байх ёстой — хоосон дуудлагаар мэдэгдэл явуулахгүй.
  const sentAt = last?.created_at ? new Date(String(last.created_at)).getTime() : 0;
  if (!last?.body || Date.now() - sentAt > 2 * 60 * 1000) {
    return NextResponse.json({ ok: true, reached: 0 });
  }
  const blockedBy = new Set(((blocks ?? []) as { blocker_id: string }[]).map((b) => String(b.blocker_id)));
  const targets = others.filter((id) => !blockedBy.has(id));
  const name = String(profile?.display_name ?? "").trim() || "Шинэ мессеж";
  const text = String(last.body).replace(/\s+/g, " ").trim();
  const res = await sendPushToUsers(service, targets, {
    title: `💬 ${name}`.slice(0, 80),
    body: text.length > 120 ? `${text.slice(0, 117)}…` : text,
    url: `/chat/${roomId}`,
  });
  return NextResponse.json({ ok: true, reached: res.reached.size });
}
