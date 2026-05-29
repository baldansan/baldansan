import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import type {
  B2BInquiry,
  B2BInquiryActivity,
  B2BInquiryStatus,
} from "@/lib/b2b/types";

export type InquiryResult<T> = { data: T | null; error: string | null };

function notConfigured<T>(): InquiryResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

function toError(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

function mapInquiry(row: Record<string, unknown>): B2BInquiry {
  return {
    id: String(row.id),
    organizationName: String(row.organization_name),
    contactPerson: row.contact_person ? String(row.contact_person) : null,
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    organizationType: row.organization_type
      ? String(row.organization_type)
      : null,
    studentCount: row.student_count ? String(row.student_count) : null,
    interestedPackage: row.interested_package
      ? String(row.interested_package)
      : null,
    message: row.message ? String(row.message) : null,
    source: String(row.source ?? "school_inquiry_page"),
    status: String(row.status ?? "new") as B2BInquiryStatus,
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    adminNote: row.admin_note ? String(row.admin_note) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapActivity(row: Record<string, unknown>): B2BInquiryActivity {
  return {
    id: String(row.id),
    inquiryId: String(row.inquiry_id),
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    action: String(row.action),
    note: row.note ? String(row.note) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

export type CreateB2BInquiryInput = {
  organizationName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  organizationType?: string;
  studentCount?: string;
  interestedPackage?: string;
  message?: string;
  source?: string;
};

export async function createB2BInquiry(
  input: CreateB2BInquiryInput
): Promise<InquiryResult<B2BInquiry>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const organizationName = input.organizationName.trim();
  if (!organizationName) {
    return { data: null, error: "Organization name is required." };
  }

  const { data, error } = await supabase
    .from("b2b_inquiries")
    .insert({
      organization_name: organizationName,
      contact_person: input.contactPerson?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      organization_type: input.organizationType ?? null,
      student_count: input.studentCount?.trim() || null,
      interested_package: input.interestedPackage ?? null,
      message: input.message?.trim() || null,
      source: input.source ?? "school_inquiry_page",
      status: "new",
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapInquiry(data as Record<string, unknown>), error: null };
}

export async function getB2BInquiries(): Promise<InquiryResult<B2BInquiry[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("b2b_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []).map((row) => mapInquiry(row as Record<string, unknown>)),
    error: toError(error),
  };
}

export async function getB2BInquiryById(
  id: string
): Promise<InquiryResult<B2BInquiry>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("b2b_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Inquiry not found." };

  return { data: mapInquiry(data as Record<string, unknown>), error: null };
}

export async function updateB2BInquiryStatus(
  id: string,
  status: B2BInquiryStatus
): Promise<InquiryResult<B2BInquiry>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("b2b_inquiries")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  const { userId } = await getAuthenticatedUserId();
  await addB2BInquiryActivity(id, "status_updated", `Status → ${status}`, {
    status,
    actorUserId: userId,
  });

  return { data: mapInquiry(data as Record<string, unknown>), error: null };
}

export async function updateB2BInquiryNote(
  id: string,
  note: string
): Promise<InquiryResult<B2BInquiry>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("b2b_inquiries")
    .update({ admin_note: note.trim() || null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapInquiry(data as Record<string, unknown>), error: null };
}

export async function assignB2BInquiry(
  id: string,
  userId: string | null
): Promise<InquiryResult<B2BInquiry>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("b2b_inquiries")
    .update({ assigned_to: userId })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapInquiry(data as Record<string, unknown>), error: null };
}

export async function addB2BInquiryActivity(
  inquiryId: string,
  action: string,
  note?: string,
  metadata?: Record<string, unknown>
): Promise<InquiryResult<B2BInquiryActivity>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { userId } = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("b2b_inquiry_activity")
    .insert({
      inquiry_id: inquiryId,
      actor_user_id: userId,
      action,
      note: note?.trim() || null,
      metadata: metadata ?? {},
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapActivity(data as Record<string, unknown>), error: null };
}

export async function getB2BInquiryActivity(
  inquiryId: string
): Promise<InquiryResult<B2BInquiryActivity[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("b2b_inquiry_activity")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []).map((row) => mapActivity(row as Record<string, unknown>)),
    error: toError(error),
  };
}

export async function getB2BInquiriesByOrganizationName(
  organizationName: string
): Promise<InquiryResult<B2BInquiry[]>> {
  if (!hasSupabaseConfig || !supabase) return notConfigured();

  const { data, error } = await supabase
    .from("b2b_inquiries")
    .select("*")
    .ilike("organization_name", organizationName)
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []).map((row) => mapInquiry(row as Record<string, unknown>)),
    error: toError(error),
  };
}
