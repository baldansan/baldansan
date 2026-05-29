import "server-only";

import type { B2BCrmSummary, B2BInquiry } from "@/lib/b2b/types";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminB2BMetrics = {
  summary: B2BCrmSummary;
  recentInquiries: B2BInquiry[];
  warnings: string[];
};

function isMigrationPending(message: string): boolean {
  return (
    message.includes("b2b_inquiries") ||
    message.includes("organizations") ||
    message.includes("does not exist")
  );
}

export async function getAdminB2BMetrics(): Promise<AdminB2BMetrics> {
  const empty: AdminB2BMetrics = {
    summary: {
      newInquiries: 0,
      contactedInquiries: 0,
      demoScheduledInquiries: 0,
      pilotInquiries: 0,
      wonInquiries: 0,
      lostInquiries: 0,
      activeOrganizations: 0,
      migrationPending: !hasSupabaseConfig,
    },
    recentInquiries: [],
    warnings: [],
  };

  if (!hasSupabaseConfig) {
    return {
      ...empty,
      warnings: ["Supabase is not configured."],
    };
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return {
      ...empty,
      warnings: ["Could not create Supabase server client."],
    };
  }

  const [inquiriesRes, orgsRes] = await Promise.all([
    client.from("b2b_inquiries").select("*").order("created_at", { ascending: false }),
    client.from("organizations").select("id, status"),
  ]);

  const warnings: string[] = [];

  if (inquiriesRes.error) {
    if (isMigrationPending(inquiriesRes.error.message)) {
      return {
        ...empty,
        summary: { ...empty.summary, migrationPending: true },
        warnings: [
          "Run supabase/migrations/012_school_organizations_b2b_crm.sql for B2B CRM.",
        ],
      };
    }
    warnings.push(inquiriesRes.error.message);
  }

  if (orgsRes.error && !isMigrationPending(orgsRes.error.message)) {
    warnings.push(orgsRes.error.message);
  }

  const inquiries = (inquiriesRes.data ?? []).map((row) => ({
    id: String(row.id),
    organizationName: String(row.organization_name),
    contactPerson: row.contact_person ? String(row.contact_person) : null,
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    organizationType: row.organization_type ? String(row.organization_type) : null,
    studentCount: row.student_count ? String(row.student_count) : null,
    interestedPackage: row.interested_package
      ? String(row.interested_package)
      : null,
    message: row.message ? String(row.message) : null,
    source: String(row.source ?? "school_inquiry_page"),
    status: String(row.status ?? "new") as B2BInquiry["status"],
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    adminNote: row.admin_note ? String(row.admin_note) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));

  const countStatus = (status: string) =>
    inquiries.filter((i) => i.status === status).length;

  const orgs = orgsRes.data ?? [];
  const activeOrganizations = orgs.filter(
    (o) => o.status === "active" || o.status === "pilot"
  ).length;

  return {
    summary: {
      newInquiries: countStatus("new"),
      contactedInquiries: countStatus("contacted"),
      demoScheduledInquiries: countStatus("demo_scheduled"),
      pilotInquiries: countStatus("pilot"),
      wonInquiries: countStatus("won"),
      lostInquiries: countStatus("lost"),
      activeOrganizations,
      migrationPending: false,
    },
    recentInquiries: inquiries.slice(0, 5),
    warnings,
  };
}

export type B2BCrmTaskInput = {
  newInquiryCount: number;
  demoScheduledCount: number;
  pilotOrgCount: number;
  migrationPending: boolean;
};

export async function getB2BCrmTaskInput(): Promise<B2BCrmTaskInput> {
  const metrics = await getAdminB2BMetrics();
  return {
    newInquiryCount: metrics.summary.newInquiries,
    demoScheduledCount: metrics.summary.demoScheduledInquiries,
    pilotOrgCount: metrics.summary.activeOrganizations,
    migrationPending: metrics.summary.migrationPending,
  };
}
