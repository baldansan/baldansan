"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CsvImportCard } from "@/components/import/csv-import-card";
import { PublicPageShell } from "@/components/public-page-shell";
import type { BulkImportResult, OrganizationMemberImportRow } from "@/lib/import/csv-import";
import { ORG_MEMBER_EXAMPLE_CSV } from "@/lib/import/csv-import";
import type { OrganizationMemberRole, OrganizationMemberStatus } from "@/lib/b2b/types";
import { canManageOrganization } from "@/lib/supabase/organization-permissions";
import {
  bulkAddOrganizationMembers,
  getMyMembershipForOrganization,
} from "@/lib/supabase/organizations";

type Props = {
  organizationId: string;
};

export function OrganizationMembersImportView({ organizationId }: Props) {
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await getMyMembershipForOrganization(organizationId);
    setLoading(false);
    const role = res.data?.memberRole ?? "assistant";
    setCanManage(canManageOrganization({ role }));
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleImport(
    validRows: OrganizationMemberImportRow[]
  ): Promise<BulkImportResult> {
    const res = await bulkAddOrganizationMembers(
      organizationId,
      validRows.map((row) => ({
        rowIndex: row.rowIndex,
        email: row.email,
        displayName: row.displayName,
        role: row.role as OrganizationMemberRole,
        status: row.status as OrganizationMemberStatus,
        userId: row.userId,
      }))
    );

    const importedAt = new Date().toISOString();
    if (res.error || !res.data) {
      return {
        importedAt,
        type: "organization_members",
        inserted: 0,
        skipped: 0,
        errors: [res.error ?? "Import failed."],
        warnings: [],
        duplicates: [],
        rows: [],
      };
    }

    return {
      importedAt,
      type: "organization_members",
      inserted: res.data.inserted,
      skipped: res.data.skipped,
      errors: res.data.errors,
      warnings: [],
      duplicates: [],
      rows: res.data.rows.map((r) => ({
        rowIndex: r.rowIndex ?? 0,
        status: r.status,
        message: r.message,
        email: r.email,
        displayName: r.displayName,
        id: r.memberId,
      })),
    };
  }

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading…</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/organization/${organizationId}/members`}
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Members
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Bulk import organization members
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Байгууллагын багш, менежер, туслах хэрэглэгчдийг CSV-ээр бөөнөөр нэмнэ.
        </p>
      </section>

      <CsvImportCard
        title="Organization member CSV import"
        subtitle="Paste CSV with email, display_name, role, status. No email is sent yet."
        importType="organization_members"
        expectedHeaders={["email", "display_name", "role", "status"]}
        exampleCsv={ORG_MEMBER_EXAMPLE_CSV}
        helpText="Invited rows are stored with status invited. Link user accounts later when auth is available."
        canImport={canManage}
        onImport={handleImport}
      />

      <Link
        href={`/organization/${organizationId}/members`}
        className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
      >
        ← Back to members
      </Link>
      <p className="text-sm text-slate-600">
        After import, generate invite links from{" "}
        <Link
          href={`/organization/${organizationId}/members`}
          className="font-semibold text-emerald-600"
        >
          members page
        </Link>{" "}
        or{" "}
        <Link
          href={`/organization/${organizationId}/invitations`}
          className="font-semibold text-emerald-600"
        >
          invitations list
        </Link>
        .
      </p>
    </PublicPageShell>
  );
}
