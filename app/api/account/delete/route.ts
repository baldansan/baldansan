import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";
import { deleteUserOwnedRows } from "@/lib/server/user-data-cleanup";

/**
 * Permanently deletes the signed-in user's account and all their data.
 * Required for Google Play / App Store compliance (account deletion).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server (Vercel env) because
 * deleting the auth user needs admin privileges. RLS-protected rows in
 * newer tables cascade via FK; older tables are cleaned explicitly.
 */

export async function POST() {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json(
      { ok: false, message: "Supabase тохируулагдаагүй." },
      { status: 503 }
    );
  }

  const sessionClient = await createServerSupabaseClient();
  if (!sessionClient) {
    return NextResponse.json(
      { ok: false, message: "Server client үүсгэж чадсангүй." },
      { status: 503 }
    );
  }

  const { data: auth } = await sessionClient.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Нэвтэрсэн байх шаардлагатай." },
      { status: 401 }
    );
  }

  if (!hasServiceRoleSupabaseConfig) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Бүртгэл устгах боломж түр идэвхгүй байна. Та санал хүсэлтээр " +
          "(эсвэл имэйлээр) устгуулах хүсэлт илгээнэ үү.",
        adminHint:
          "Vercel → Settings → Environment Variables дээр SUPABASE_SERVICE_ROLE_KEY нэмнэ үү.",
      },
      { status: 503 }
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json(
      { ok: false, message: "Service client үүсгэж чадсангүй." },
      { status: 503 }
    );
  }

  // Best-effort data cleanup. Missing tables/columns are ignored —
  // the auth user delete below cascades FK-linked rows anyway.
  const cleanupErrors = await deleteUserOwnedRows(service, userId);

  if (cleanupErrors.length > 0) {
    // Do NOT delete the auth user if personal data could not be removed —
    // that would strand orphaned rows and falsely report full deletion.
    return NextResponse.json(
      {
        ok: false,
        message:
          "Зарим өгөгдлийг устгаж чадсангүй тул бүртгэл устгаагүй. Дахин оролдоно уу.",
        cleanupErrors,
      },
      { status: 500 }
    );
  }

  const { error: deleteUserError } = await service.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    return NextResponse.json(
      {
        ok: false,
        message: `Бүртгэл устгахад алдаа гарлаа: ${deleteUserError.message}`,
        cleanupErrors,
      },
      { status: 500 }
    );
  }

  // Clear the (now invalid) session cookies.
  await sessionClient.auth.signOut();

  return NextResponse.json({ ok: true, message: "Бүртгэл бүрмөсөн устлаа.", cleanupErrors });
}
