import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "feedback-screenshots";
/** JPEG data URL, ~1.5 MB хүртэл (html2canvas 0.7 чанар, 1× scale). */
const MAX_IMAGE_BYTES = 1_800_000;

type Body = {
  note?: string;
  pagePath?: string | null;
  lessonId?: string | null;
  screenshot?: string | null;
  userAgent?: string | null;
  viewport?: string | null;
};

function decodeDataUrl(dataUrl: string): { buf: Buffer; ext: string; mime: string } | null {
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[3], "base64");
  if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
  const ext = m[2] === "jpeg" ? "jpg" : m[2];
  return { buf, ext, mime: m[1] };
}

async function ensureBucket(service: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>) {
  const { data } = await service.storage.getBucket(BUCKET);
  if (data) return;
  await service.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_IMAGE_BYTES });
}

/**
 * «Алдаа мэдээлэх» — тэмдэглэл + дэлгэцийн зураг. Зургийг service-role-оор storage-д
 * хийж, feedback мөрөнд URL-ийг нь бичнэ. Service role тохируулаагүй бол зураггүй,
 * хэрэглэгчийн өөрийн клиентээр (RLS: insert) хадгална — client fallback хийдэг.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const note = (body.note ?? "").trim();
  if (!note) return NextResponse.json({ ok: false, error: "note required" }, { status: 400 });

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json({ ok: false, error: "service role not configured" }, { status: 503 });
  }

  // Хэн илгээснийг (нэвтэрсэн бол) cookie session-оос.
  let userId: string | null = null;
  try {
    const session = await createServerSupabaseClient();
    const { data } = session ? await session.auth.getUser() : { data: { user: null } };
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  let screenshotUrl: string | null = null;
  if (body.screenshot) {
    const img = decodeDataUrl(body.screenshot);
    if (img) {
      try {
        await ensureBucket(service);
        const now = new Date();
        const path = `reports/${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${img.ext}`;
        const { error } = await service.storage
          .from(BUCKET)
          .upload(path, img.buf, { contentType: img.mime, cacheControl: "31536000", upsert: false });
        if (!error) {
          screenshotUrl = service.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        } else {
          console.warn("[feedback] screenshot upload failed", error.message);
        }
      } catch (error) {
        console.warn("[feedback] screenshot upload threw", error);
      }
    }
  }

  const base = {
    user_id: userId,
    lesson_id: body.lessonId?.trim() || null,
    stage: "report",
    note,
    page_path: body.pagePath?.trim() || null,
  };
  const ua = body.userAgent?.slice(0, 300) || null;
  const viewport = body.viewport?.slice(0, 40) || null;

  // 077 migration ажиллаагүй байж болно → багана байхгүй бол note дотор URL-ийг хадгална.
  let { error } = await service.from("feedback").insert({
    ...base,
    screenshot_url: screenshotUrl,
    user_agent: ua,
    viewport,
  });
  if (error && /column|schema cache/i.test(error.message)) {
    const extra = [
      screenshotUrl ? `📷 ${screenshotUrl}` : null,
      ua ? `UA: ${ua}` : null,
      viewport ? `Дэлгэц: ${viewport}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    ({ error } = await service
      .from("feedback")
      .insert({ ...base, note: extra ? `${note}\n\n${extra}` : note }));
  }
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, screenshotUrl });
}
