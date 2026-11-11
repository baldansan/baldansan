import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Store-ын апп (Android/iOS)-аас ирсэн мэдэгдлийн token-ийг хэрэглэгчтэй холбож хадгална (092). */
export async function POST(request: Request) {
  let body: { token?: string; platform?: string };
  try {
    body = (await request.json()) as { token?: string; platform?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const token = String(body.token ?? "").trim();
  const platform = body.platform === "ios" ? "ios" : body.platform === "android" ? "android" : "";
  if (token.length < 20 || token.length > 4096 || !platform) {
    return NextResponse.json({ ok: false, error: "Bad token" }, { status: 400 });
  }
  const client = await createServerSupabaseClient();
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  if (!client || !auth.user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const { error } = await client.rpc("register_native_push_token", {
    p_token: token,
    p_platform: platform,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
