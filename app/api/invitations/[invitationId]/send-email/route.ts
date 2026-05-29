import { NextResponse } from "next/server";
import { sendInvitationEmailForId } from "@/lib/server/email/send-invitation-email";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ invitationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ ok: false, message: "Supabase not configured." }, { status: 503 });
  }

  const { invitationId } = await context.params;
  const client = await createServerSupabaseClient();
  if (!client) {
    return NextResponse.json({ ok: false, message: "Could not create server client." }, { status: 503 });
  }

  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const result = await sendInvitationEmailForId(client, invitationId, userId, request);

  const httpStatus =
    result.status === "failed" && !result.deliveryId
      ? 500
      : result.status === "failed"
        ? 502
        : 200;

  return NextResponse.json(
    {
      ok: result.ok,
      status: result.status,
      message: result.message,
      deliveryId: result.deliveryId,
      inviteUrl: result.inviteUrl,
      providerStatus: result.providerStatus,
    },
    { status: httpStatus }
  );
}
