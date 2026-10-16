import { NextResponse } from "next/server";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";

type SubscribeBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/** Push subscription хадгалах (хэрэглэгч тохиргооноос зөвшөөрөл өгсний дараа дуудна). */
export async function POST(request: Request) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json(
      { ok: false, message: "Supabase not configured." },
      { status: 503 }
    );
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Could not create server client." },
      { status: 503 }
    );
  }

  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { ok: false, message: "Missing endpoint/keys." },
      { status: 400 }
    );
  }

  const { error } = await client.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: body.endpoint,
      keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    // push_subscriptions хүснэгт SQL migration ажиллуулаагүй бол энд алдаа буцна —
    // клиент тал Notification байдлыг local storage-д тэмдэглэхээс өөр юу ч хийхгүй.
    console.error("[push/subscribe] хадгалахад алдаа:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Push subscription устгах (Notification-г унтраахад). */
export async function DELETE(request: Request) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json(
      { ok: false, message: "Supabase not configured." },
      { status: 503 }
    );
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, message: "Could not create server client." },
      { status: 503 }
    );
  }

  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  let body: { endpoint?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body байхгүй бол бүх subscription-г устгана
  }

  const query = client.from("push_subscriptions").delete().eq("user_id", userId);
  const { error } = body.endpoint
    ? await query.eq("endpoint", body.endpoint)
    : await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
