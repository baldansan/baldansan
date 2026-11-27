import { NextResponse } from "next/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { getLearnerGradeBoard } from "@/lib/supabase/admin-learner-grades";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { sendPushToUsers } from "@/lib/server/push/send-to-users";
import { loadPushUserIds } from "@/lib/server/push/audience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

type Audience =
  | { type: "all" }
  | { type: "inactive"; days: number }
  | { type: "classroom"; classroomId: string }
  | { type: "users"; userIds: string[] };

type Learner = {
  userId: string;
  name: string;
  email: string | null;
  lastActiveAt: string | null;
  daysInactive: number | null;
  push: boolean;
};

async function loadDirectory() {
  const service = createServiceRoleSupabaseClient();
  if (!service) return null;
  const [board, pushIds, classrooms, students, chatNames] = await Promise.all([
    getLearnerGradeBoard(),
    loadPushUserIds(service),
    service.from("classrooms").select("id, name, level, status").limit(500),
    service
      .from("classroom_students")
      .select("classroom_id, student_user_id")
      .not("student_user_id", "is", null)
      .limit(20000),
    service.from("chat_profiles").select("user_id, display_name").limit(20000),
  ]);
  const pushSet = new Set(pushIds);
  const nick = new Map<string, string>();
  for (const row of (chatNames.data ?? []) as { user_id: string; display_name: string | null }[]) {
    if (row.display_name?.trim()) nick.set(String(row.user_id), row.display_name.trim());
  }
  const now = Date.now();
  const learners: Learner[] = board.rows
    .filter((r) => !r.isDemo)
    .map((r) => {
      const last = r.lastActiveAt ? new Date(r.lastActiveAt).getTime() : NaN;
      return {
        userId: r.userId,
        name: r.displayName?.trim() || nick.get(r.userId) || r.email?.split("@")[0] || "Нэргүй",
        email: r.email,
        lastActiveAt: r.lastActiveAt,
        daysInactive: Number.isNaN(last) ? null : Math.max(0, Math.floor((now - last) / DAY_MS)),
        push: pushSet.has(r.userId),
      };
    });
  // Мэдэгдэл асаасан ч жагсаалтад (үнэлгээний самбарт) хараахан ороогүй хүмүүс — шинээр бүртгүүлсэн.
  const known = new Set(learners.map((l) => l.userId));
  for (const uid of pushIds) {
    if (known.has(uid)) continue;
    learners.push({
      userId: uid,
      name: nick.get(uid) || "Шинэ хэрэглэгч",
      email: null,
      lastActiveAt: null,
      daysInactive: null,
      push: true,
    });
  }
  const members = new Map<string, string[]>();
  for (const row of (students.data ?? []) as { classroom_id: string; student_user_id: string }[]) {
    const list = members.get(String(row.classroom_id)) ?? [];
    list.push(String(row.student_user_id));
    members.set(String(row.classroom_id), list);
  }
  const classes = ((classrooms.data ?? []) as { id: string; name: string; level: string | null; status: string }[])
    .filter((c) => c.status !== "archived")
    .map((c) => ({
      id: String(c.id),
      name: c.level ? `${c.name} · ${c.level}` : c.name,
      userIds: [...new Set(members.get(String(c.id)) ?? [])],
    }))
    .filter((c) => c.userIds.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { service, learners, classes };
}

function resolveTargets(
  audience: Audience,
  learners: Learner[],
  classes: { id: string; userIds: string[] }[]
): string[] {
  switch (audience.type) {
    case "all":
      return learners.map((l) => l.userId);
    case "inactive": {
      const days = Math.max(1, Math.floor(audience.days));
      return learners.filter((l) => l.daysInactive == null || l.daysInactive >= days).map((l) => l.userId);
    }
    case "classroom":
      return classes.find((c) => c.id === audience.classroomId)?.userIds ?? [];
    case "users": {
      const known = new Set(learners.map((l) => l.userId));
      return [...new Set(audience.userIds.map(String))].filter((id) => known.has(id)).slice(0, 2000);
    }
    default:
      return [];
  }
}

/** Хүлээн авагчдын лавлах: сурагчид (нэр, сүүлд орсон, мэдэгдэл асаасан эсэх) + ангиуд. Зөвхөн админд. */
export async function GET() {
  if (!(await isCurrentUserAdminServer())) {
    return NextResponse.json({ ok: false, error: "Зөвхөн админ." }, { status: 403 });
  }
  if (!hasServiceRoleSupabaseConfig) {
    return NextResponse.json({ ok: false, error: "Серверийн тохиргоо дутуу." }, { status: 503 });
  }
  const dir = await loadDirectory();
  if (!dir) return NextResponse.json({ ok: false, error: "Серверийн тохиргоо дутуу." }, { status: 503 });
  return NextResponse.json(
    { ok: true, learners: dir.learners, classes: dir.classes },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Сонгосон хүмүүсийн утас/хөтөч рүү мэдэгдэл (push) илгээнэ. Зөвхөн админ.
 * Мэдэгдэл асаагаагүй хүнд очихгүй — хэдэд нь очсоныг буцаана.
 */
export async function POST(request: Request) {
  if (!(await isCurrentUserAdminServer())) {
    return NextResponse.json({ ok: false, error: "Зөвхөн админ." }, { status: 403 });
  }
  let payload: { audience?: Audience; title?: string; body?: string; url?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Буруу хүсэлт." }, { status: 400 });
  }
  const title = String(payload.title ?? "").trim().slice(0, 80);
  const body = String(payload.body ?? "").trim().slice(0, 240);
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/home";
  const audience = payload.audience;
  if (!title || !body || !audience || typeof audience !== "object") {
    return NextResponse.json({ ok: false, error: "Гарчиг, бичвэр, хүлээн авагчаа бөглөнө үү." }, { status: 400 });
  }
  const dir = await loadDirectory();
  if (!dir) return NextResponse.json({ ok: false, error: "Серверийн тохиргоо дутуу." }, { status: 503 });

  const targets = resolveTargets(audience, dir.learners, dir.classes);
  const withPush = new Set(dir.learners.filter((l) => l.push).map((l) => l.userId));
  const sendable = targets.filter((id) => withPush.has(id));
  let reached = 0;
  let configured = true;
  for (let i = 0; i < sendable.length; i += 100) {
    const res = await sendPushToUsers(dir.service, sendable.slice(i, i + 100), { title, body, url });
    configured = res.configured;
    reached += res.reached.size;
    if (!res.configured) break;
  }
  console.log(`[admin-messages] "${title}" → ${targets.length} сонгосон, ${sendable.length} мэдэгдэлтэй, ${reached}-д хүрсэн.`);
  return NextResponse.json({
    ok: true,
    selected: targets.length,
    withPush: sendable.length,
    reached,
    pushConfigured: configured,
  });
}
