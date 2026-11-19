import { NextResponse } from "next/server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";
import { callClaude, parseNumbered, SUBTITLE_RULES } from "@/lib/bichleg/youtube/claude";

export const maxDuration = 300;

type Body = {
  titleZh?: string;
  lines?: { n: number; zh: string }[];
  /** Өмнөх хэсгийн сүүлийн мөрүүд — зөвхөн контекст. */
  prev?: string[];
  wantTitle?: boolean;
};

/** Хадмалын нэг хэсгийг (≤60 мөр) монгол руу орчуулна. */
export async function POST(request: Request) {
  const admin = await getAdminServiceRoleSupabaseClient();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON бие буруу байна." }, { status: 400 });
  }

  const lines = (body.lines ?? []).slice(0, 60);
  const titleZh = (body.titleZh ?? "").slice(0, 200);
  if (!lines.length && !body.wantTitle) {
    return NextResponse.json({ ok: false, error: "Мөр алга." }, { status: 400 });
  }

  try {
    const system = SUBTITLE_RULES.replace("{title}", titleZh || "(гарчиггүй)");
    const tasks: Promise<void>[] = [];
    const mn: Record<number, string> = {};
    let titleMn = "";

    if (lines.length) {
      tasks.push(
        (async () => {
          const ctx = body.prev?.length
            ? "Өмнөх хэсгийн сүүлийн мөрүүд (зөвхөн контекст, орчуулахгүй):\n" +
              body.prev.slice(-8).join("\n") +
              "\n\n"
            : "";
          const ask = (rows: { n: number; zh: string }[]) =>
            callClaude(system, `${ctx}Орчуул:\n${rows.map((l) => `${l.n}|${l.zh}`).join("\n")}`);
          Object.assign(mn, parseNumbered(await ask(lines)));
          const miss = lines.filter((l) => !mn[l.n]);
          if (miss.length) Object.assign(mn, parseNumbered(await ask(miss)));
        })()
      );
    }

    if (body.wantTitle && titleZh) {
      tasks.push(
        (async () => {
          const text = await callClaude(
            "Хятад бичлэгийн гарчгийг монгол сурагчид ойлгомжтой, богино (10 үгээс хэтрэхгүй) монгол гарчиг болго. Хаштаг, эможи, сувгийн нэрийг хас. Зөвхөн гарчгийг бич.",
            titleZh,
            200
          );
          titleMn = text.trim().split("\n")[0].replace(/^["«]|["»]$/g, "");
        })()
      );
    }

    await Promise.all(tasks);
    return NextResponse.json({ ok: true, mn, titleMn });
  } catch (error) {
    console.error("[api/admin/bichleg/youtube/translate]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Орчуулахад алдаа гарлаа." },
      { status: 500 }
    );
  }
}
