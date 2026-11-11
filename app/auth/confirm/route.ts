import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /auth/confirm — Supabase-ийн имэйл линк энд буцна (нууц үг сэргээх, имэйл баталгаажуулах).
 *
 * Хоёр хэлбэрийг дэмжинэ:
 *  1. ?token_hash=…&type=recovery&next=/reset-password — имэйлийн загварт {{ .TokenHash }}
 *     ашигласан үед. Ямар ч браузер/төхөөрөмж дээр ажиллана (PKCE verifier шаардахгүй).
 *  2. ?code=… — PKCE (анхдагч загвар). Зөвхөн хүсэлт илгээсэн браузер дээр ажиллана
 *     (verifier cookie тэнд байдаг).
 * Амжилттай бол session cookie-г тавьж `next` рүү шилжүүлнэ; алдаа бол
 * /reset-password?error=… рүү.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") ?? "/reset-password";
  const next = nextRaw.startsWith("/") ? nextRaw : "/reset-password";
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/reset-password?error=${encodeURIComponent(msg)}`, url.origin));

  const client = await createServerSupabaseClient();
  if (!client) return fail("Supabase тохируулагдаагүй.");

  if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail(error.message);
    return NextResponse.redirect(new URL(next, url.origin));
  }
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return fail(error.message);
    return NextResponse.redirect(new URL(next, url.origin));
  }
  return fail("Линкэнд token байхгүй.");
}
