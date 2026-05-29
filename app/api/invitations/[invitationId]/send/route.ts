import { NextResponse } from "next/server";
import { sendInvitationEmailForId } from "@/lib/server/email/send-invitation-email";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ invitationId: string }> };

/** @deprecated Prefer POST /api/invitations/[id]/send-email */
export async function POST(request: Request, context: RouteContext) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const { invitationId } = await context.params;
  const client = await createServerSupabaseClient();
  if (!client) {
    return NextResponse.json({ error: "Could not create server client." }, { status: 503 });
  }

  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await sendInvitationEmailForId(client, invitationId, userId, request);

  return NextResponse.json({
    deliveryId: result.deliveryId,
    status: result.status,
    inviteUrl: result.inviteUrl,
    error: result.ok ? null : result.message,
    message: result.message,
  });
}
