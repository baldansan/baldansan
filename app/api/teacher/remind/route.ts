import { NextResponse } from "next/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { sendPushToUsers } from "@/lib/server/push/send-to-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  classroomId?: string;
  userIds?: string[];
  title?: string;
  body?: string;
  url?: string;
};

/**
 * Багш өөрийн ангийн сурагчдын утас/хөтөч рүү мэдэгдэл (push) илгээнэ.
 * - Зөвхөн тухайн ангийн багш (эсвэл админ) дуудаж чадна.
 * - Зөвхөн тэр ангийн жагсаалтад байгаа сурагчид руу явна.
 * - Мэдэгдэл асаагаагүй сурагчид очихгүй — хэдэд нь очсоныг буцаана,
 *   багш үлдсэнд нь бичвэр хуулж илгээнэ.
 */
export async function POST(request: Request) {
  let payload: Body;
  try {
    payload = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Буруу хүсэлт." }, { status: 400 });
  }
  const classroomId = String(payload.classroomId ?? "").trim();
  const wanted = Array.isArray(payload.userIds)
    ? [...new Set(payload.userIds.map(String))].slice(0, 500)
    : [];
  const title = String(payload.title ?? "").trim().slice(0, 80);
  const body = String(payload.body ?? "").trim().slice(0, 240);
  const url =
    typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/home";
  if (!classroomId || !title || !body) {
    return NextResponse.json({ ok: false, error: "Мэдээлэл дутуу." }, { status: 400 });
  }

  const client = await createServerSupabaseClient();
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  const userId = auth.user?.id;
  if (!client || !userId) {
    return NextResponse.json({ ok: false, error: "Нэвтрээгүй байна." }, { status: 401 });
  }

  const { data: classroom } = await client
    .from("classrooms")
    .select("id, teacher_user_id")
    .eq("id", classroomId)
    .maybeSingle();
  const isOwner = classroom && String(classroom.teacher_user_id) === userId;
  if (!classroom || !(isOwner || (await isCurrentUserAdminServer()))) {
    return NextResponse.json({ ok: false, error: "Энэ анги таных биш." }, { status: 403 });
  }

  const { data: roster } = await client
    .from("classroom_students")
    .select("student_user_id")
    .eq("classroom_id", classroomId)
    .not("student_user_id", "is", null);
  const inClass = new Set((roster ?? []).map((r) => String(r.student_user_id)));
  const targets = (wanted.length > 0 ? wanted : [...inClass]).filter((id) => inClass.has(id));
  if (targets.length === 0) {
    return NextResponse.json({ ok: true, configured: true, targets: 0, reached: 0 });
  }

  const service = hasServiceRoleSupabaseConfig ? createServiceRoleSupabaseClient() : null;
  if (!service) {
    return NextResponse.json({ ok: true, configured: false, targets: targets.length, reached: 0 });
  }

  // Хөтөч, Android апп, iPhone апп — сурагчийн бүх төхөөрөмж рүү.
  const result = await sendPushToUsers(service, targets, { title, body, url });
  return NextResponse.json({
    ok: true,
    configured: result.configured,
    targets: targets.length,
    reached: result.reached.size,
  });
}
