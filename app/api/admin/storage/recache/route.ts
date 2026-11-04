import { NextResponse } from "next/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/admin/storage/recache — Storage bucket доторх файлуудыг 1 жилийн CDN кэштэй
 * (cache-control: max-age=31536000) дахин бичнэ. Supabase нь cache-control-ийг объектын
 * S3 metadata-аас уншдаг тул storage.objects хүснэгтийг SQL-ээр засах нь хангалтгүй —
 * файлыг татаад upsert-ээр дахин байршуулна. Нэг дуудлагад `batch` файл (default 20),
 * 40с-ийн хугацааны хяналттай; `cursor` (дараагийн файлын индекс)-ийг буцаана.
 *
 * Body: { bucket?: string, prefix?: string, cursor?: number, batch?: number, dryRun?: boolean }
 */
const TARGET = "31536000";
const TIME_BUDGET_MS = 40_000;

type Entry = { path: string; cacheControl: string | null; size: number };

async function listAll(
  client: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>,
  bucket: string,
  prefix: string,
  out: Entry[]
): Promise<void> {
  let offset = 0;
  const limit = 1000;
  for (;;) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const e of data) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      if (!e.id) {
        await listAll(client, bucket, path, out);
      } else {
        const meta = (e.metadata ?? {}) as Record<string, unknown>;
        out.push({
          path,
          cacheControl: typeof meta.cacheControl === "string" ? meta.cacheControl : null,
          size: typeof meta.size === "number" ? meta.size : 0,
        });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdminServer())) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY Vercel env-д тохируулагдаагүй." },
      { status: 503 }
    );
  }
  let body: { bucket?: string; prefix?: string; cursor?: number; batch?: number; dryRun?: boolean } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    // default body
  }
  const bucket = (body.bucket ?? "lesson-media").trim();
  const prefix = (body.prefix ?? "").trim().replace(/^\/+|\/+$/g, "");
  const cursor = Math.max(0, Number(body.cursor ?? 0) | 0);
  const batch = Math.min(100, Math.max(1, Number(body.batch ?? 20) | 0));
  const started = Date.now();

  const all: Entry[] = [];
  try {
    await listAll(client, bucket, prefix, all);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  const pending = all.filter((e) => e.cacheControl !== `max-age=${TARGET}`);
  const total = all.length;

  if (body.dryRun) {
    return NextResponse.json({ ok: true, bucket, prefix, total, pending: pending.length });
  }

  const slice = pending.slice(cursor, cursor + batch);
  const results: Array<{ path: string; ok: boolean; error?: string }> = [];
  for (const entry of slice) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    const { data: blob, error: dlErr } = await client.storage.from(bucket).download(entry.path);
    if (dlErr || !blob) {
      results.push({ path: entry.path, ok: false, error: dlErr?.message ?? "download failed" });
      continue;
    }
    const { error: upErr } = await client.storage.from(bucket).upload(entry.path, blob, {
      upsert: true,
      cacheControl: TARGET,
      contentType: blob.type || undefined,
    });
    results.push({ path: entry.path, ok: !upErr, ...(upErr ? { error: upErr.message } : {}) });
  }
  const done = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  // Амжилттай бичигдсэн файлууд дараагийн list-д pending-ээс гарна → cursor нь зөвхөн алдаатайг алгасна.
  const nextCursor = cursor + failed.length;
  return NextResponse.json({
    ok: failed.length === 0,
    bucket,
    prefix,
    total,
    pendingBefore: pending.length,
    processed: results.length,
    done,
    failed,
    nextCursor,
    remaining: Math.max(0, pending.length - done - cursor),
    ms: Date.now() - started,
  });
}
