import type { BulkInviteResult, BulkInviteRow, OrganizationInvitation } from "@/lib/b2b/types";
import { createOrganizationMemberInvitation, type InviteResult } from "@/lib/supabase/invitations";

export async function bulkInviteOrganizationMembers(
  organizationId: string,
  rows: BulkInviteRow[]
): Promise<InviteResult<BulkInviteResult>> {
  const invitations: OrganizationInvitation[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    const res = await createOrganizationMemberInvitation({
      organizationId,
      email: row.email,
      displayName: row.displayName,
      role: row.role ?? "teacher",
    });
    if (res.error || !res.data) errors.push(`${row.email}: ${res.error ?? "failed"}`);
    else invitations.push(res.data);
  }

  return {
    data: {
      successCount: invitations.length,
      errorCount: errors.length,
      errors,
      invitations,
    },
    error: null,
  };
}
