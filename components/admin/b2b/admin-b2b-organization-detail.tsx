"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatMongoliaDateTime } from "@/lib/datetime/mongolia-time";
import type {
  B2BInquiry,
  Organization,
  OrganizationMember,
  OrganizationMemberRole,
  OrganizationPilotSummary,
  OrganizationStatus,
  OrganizationType,
} from "@/lib/b2b/types";
import { PilotReadinessCard } from "@/components/organization/pilot-readiness-card";
import { getB2BInquiriesByOrganizationName } from "@/lib/supabase/b2b-inquiries";
import type { Assignment, Classroom } from "@/lib/classroom/types";
import {
  getOrganizationPilotSummary,
  initializeOrganizationOnboarding,
  markOrganizationReadyForPilot,
  seedDefaultOnboardingTasks,
  upsertOrganizationOnboarding,
} from "@/lib/supabase/organization-onboarding";
import { getOrganizationInvitations } from "@/lib/supabase/invitations";
import { getInvitationEmailDeliveryCounts } from "@/lib/supabase/invitation-email-deliveries";
import {
  addOrganizationMember,
  getOrganizationAssignments,
  getOrganizationById,
  getOrganizationClassrooms,
  getOrganizationMembers,
  removeOrganizationMember,
  updateOrganization,
} from "@/lib/supabase/organizations";

const TYPE_OPTIONS: OrganizationType[] = [
  "training_center",
  "school",
  "university",
  "teacher",
  "company",
  "other",
];

const STATUS_OPTIONS: OrganizationStatus[] = [
  "lead",
  "contacted",
  "demo_scheduled",
  "pilot",
  "active",
  "paused",
  "closed",
];

const ROLE_OPTIONS: OrganizationMemberRole[] = [
  "owner",
  "manager",
  "teacher",
  "assistant",
  "student",
];

/** Зөвхөн дэлгэцэнд харуулах нэр — өгөгдлийн утгыг өөрчлөхгүй. */
const TYPE_LABELS: Record<string, string> = {
  training_center: "Сургалтын төв",
  school: "Сургууль",
  university: "Их сургууль",
  teacher: "Багш (хувь хүн)",
  company: "Компани",
  other: "Бусад",
};

const STATUS_LABELS: Record<string, string> = {
  lead: "Сонирхсон",
  contacted: "Холбоо барьсан",
  demo_scheduled: "Танилцуулга товлосон",
  pilot: "Туршилт",
  active: "Идэвхтэй",
  paused: "Түр зогссон",
  closed: "Хаасан",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Эзэмшигч",
  manager: "Менежер",
  teacher: "Багш",
  assistant: "Туслах",
  student: "Сурагч",
};

const MEMBER_STATUS_LABELS: Record<string, string> = {
  invited: "Уригдсан",
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
};

const ONBOARDING_STATUS_LABELS: Record<string, string> = {
  not_started: "Эхлээгүй",
  in_progress: "Хийгдэж байна",
  ready_for_pilot: "Туршилтад бэлэн",
  pilot_running: "Туршилт явж байна",
  completed: "Дууссан",
  paused: "Түр зогссон",
};

const PILOT_STAGE_LABELS: Record<string, string> = {
  inquiry: "Хүсэлт ирсэн",
  organization_setup: "Байгууллагын тохиргоо",
  teacher_setup: "Багш бүртгэх",
  classroom_setup: "Анги үүсгэх",
  assignment_setup: "Даалгавар үүсгэх",
  student_invite: "Сурагч урих",
  pilot_ready: "Туршилтад бэлэн",
  pilot_running: "Туршилт явж байна",
  pilot_review: "Туршилтын дүгнэлт",
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Хаалттай",
  organization: "Байгууллагын",
  archived: "Архивласан",
};

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  assigned: "Өгсөн",
  draft: "Ноорог",
  active: "Идэвхтэй",
  closed: "Хаасан",
  archived: "Архивласан",
};

const INQUIRY_STATUS_LABELS: Record<string, string> = {
  new: "Шинэ",
  contacted: "Холбоо барьсан",
  demo_scheduled: "Танилцуулга товлосон",
  proposal_sent: "Санал илгээсэн",
  pilot: "Туршилт",
  won: "Гэрээ байгуулсан",
  lost: "Татгалзсан",
  archived: "Архивласан",
};

type Props = {
  organizationId: string;
};

export function AdminB2BOrganizationDetail({ organizationId }: Props) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pilotSummary, setPilotSummary] = useState<OrganizationPilotSummary | null>(
    null
  );
  const [invitationCounts, setInvitationCounts] = useState({
    pending: 0,
    accepted: 0,
    inactive: 0,
  });
  const [emailDeliveryCounts, setEmailDeliveryCounts] = useState({
    sent: 0,
    failed: 0,
    skipped: 0,
  });
  const [relatedInquiries, setRelatedInquiries] = useState<B2BInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState<OrganizationMemberRole>("teacher");
  const [memberUserId, setMemberUserId] = useState("");

  const load = useCallback(async () => {
    const [orgRes, membersRes, classroomsRes, assignmentsRes, pilotRes, invRes, deliveryRes] =
      await Promise.all([
      getOrganizationById(organizationId),
      getOrganizationMembers(organizationId),
      getOrganizationClassrooms(organizationId),
      getOrganizationAssignments(organizationId),
      getOrganizationPilotSummary(organizationId),
      getOrganizationInvitations(organizationId),
      getInvitationEmailDeliveryCounts(),
    ]);
    setLoading(false);
    if (orgRes.error) setError(orgRes.error);
    else setOrg(orgRes.data);
    if (membersRes.error) setError(membersRes.error);
    else setMembers(membersRes.data ?? []);
    if (classroomsRes.error) setError(classroomsRes.error);
    else setClassrooms(classroomsRes.data ?? []);
    if (assignmentsRes.error) setError(assignmentsRes.error);
    else setAssignments(assignmentsRes.data ?? []);
    if (pilotRes.data) setPilotSummary(pilotRes.data);
    const invs = invRes.data ?? [];
    setInvitationCounts({
      pending: invs.filter((i) => i.status === "pending").length,
      accepted: invs.filter((i) => i.status === "accepted").length,
      inactive: invs.filter((i) => ["expired", "revoked"].includes(i.status)).length,
    });
    if (deliveryRes.data) setEmailDeliveryCounts(deliveryRes.data);

    if (orgRes.data) {
      const inqRes = await getB2BInquiriesByOrganizationName(orgRes.data.name);
      if (inqRes.data) setRelatedInquiries(inqRes.data);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveOrg() {
    if (!org) return;
    setSaving(true);
    setError(null);
    const res = await updateOrganization(organizationId, {
      name: org.name,
      organizationType: org.organizationType,
      website: org.website ?? "",
      phone: org.phone ?? "",
      email: org.email ?? "",
      address: org.address ?? "",
      notes: org.notes ?? "",
      status: org.status,
    });
    setSaving(false);
    if (res.error) setError(res.error);
    else setOrg(res.data);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await addOrganizationMember(organizationId, {
      email: memberEmail || undefined,
      displayName: memberName || undefined,
      role: memberRole,
      userId: memberUserId.trim() || undefined,
    });
    setSaving(false);
    if (res.error) setError(res.error);
    else {
      setMemberEmail("");
      setMemberName("");
      setMemberUserId("");
      void load();
    }
  }

  async function handleRemoveMember(memberId: string) {
    setSaving(true);
    const res = await removeOrganizationMember(memberId);
    setSaving(false);
    if (res.error) setError(res.error);
    else void load();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Ачаалж байна…</p>;
  }

  if (!org) {
    return (
      <div>
        <p className="text-sm text-slate-600">{error ?? "Байгууллага олдсонгүй."}</p>
        <Link href="/admin/b2b/organizations" className="mt-2 text-sm text-emerald-600">
          ← Байгууллагууд
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link
          href="/admin/b2b/organizations"
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Байгууллагууд
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{org.name}</h1>
        <Link
          href={`/organization/${organizationId}`}
          className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Байгууллагын самбар нээх →
        </Link>
        <Link
          href={`/organization/${organizationId}/reports`}
          className="mt-2 ml-2 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Байгууллагын тайлан →
        </Link>
        <Link
          href={`/organization/${organizationId}/setup`}
          className="mt-2 ml-2 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Тохиргооны алхмууд →
        </Link>
        <Link
          href={`/organization/${organizationId}/members/import`}
          className="mt-2 ml-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Гишүүдийг бөөнөөр оруулах →
        </Link>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Урилга</h2>
        <p className="mt-2 text-sm text-slate-600">
          Хүлээгдэж байна {invitationCounts.pending} · Хүлээн авсан{" "}
          {invitationCounts.accepted} · Хугацаа дууссан/цуцалсан{" "}
          {invitationCounts.inactive}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          И-мэйл илгээлт — илгээсэн {emailDeliveryCounts.sent} · амжилтгүй{" "}
          {emailDeliveryCounts.failed} · алгассан {emailDeliveryCounts.skipped}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/organization/${organizationId}/invitations`}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
          >
            Байгууллагын урилгууд →
          </Link>
          <Link
            href={`/organization/${organizationId}/members`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Гишүүд ба урилга үүсгэх →
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Туршилтын бэлтгэл</h2>
        {pilotSummary ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Төлөв:{" "}
              {ONBOARDING_STATUS_LABELS[
                pilotSummary.onboarding?.onboardingStatus ?? "not_started"
              ] ?? "Эхлээгүй"}{" "}
              · Алхам:{" "}
              {PILOT_STAGE_LABELS[
                pilotSummary.onboarding?.pilotStage ?? "inquiry"
              ] ?? "Хүсэлт ирсэн"}{" "}
              · Бэлэн байдал: {pilotSummary.readiness.score}%
            </p>
            {pilotSummary.onboarding?.targetStartDate ? (
              <p className="text-sm text-slate-600">
                Эхлэх огноо: {pilotSummary.onboarding.targetStartDate} · Сурагчийн
                тоо: {pilotSummary.onboarding.targetStudentCount ?? "—"}
              </p>
            ) : null}
            {pilotSummary.onboarding?.pilotGoal ? (
              <p className="mt-1 text-sm text-slate-600">
                Зорилго: {pilotSummary.onboarding.pilotGoal}
              </p>
            ) : null}
            <div className="mt-3">
              <PilotReadinessCard
                organizationId={organizationId}
                readiness={pilotSummary.readiness}
                onboardingStatus={pilotSummary.onboarding?.onboardingStatus}
                pilotStage={pilotSummary.onboarding?.pilotStage}
                showSetupLink={false}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Бэлтгэлийн бүртгэл хараахан үүсээгүй байна.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const res = await seedDefaultOnboardingTasks(organizationId);
              if (!pilotSummary?.onboarding) {
                await initializeOrganizationOnboarding(organizationId);
              }
              setSaving(false);
              if (res.error) setError(res.error);
              else void load();
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Бэлтгэлийн ажлуудыг үүсгэх
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const res = await upsertOrganizationOnboarding(organizationId, {
                onboardingStatus: "in_progress",
                pilotStage: "organization_setup",
              });
              setSaving(false);
              if (res.error) setError(res.error);
              else void load();
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            «Хийгдэж байна» болгох
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const res = await markOrganizationReadyForPilot(organizationId);
              setSaving(false);
              if (res.error) setError(res.error);
              else void load();
            }}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          >
            «Туршилтад бэлэн» болгох
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const res = await upsertOrganizationOnboarding(organizationId, {
                onboardingStatus: "paused",
              });
              setSaving(false);
              if (res.error) setError(res.error);
              else void load();
            }}
            className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800"
          >
            Бэлтгэлийг түр зогсоох
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Нэр</span>
          <input
            value={org.name}
            onChange={(e) => setOrg({ ...org, name: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Төрөл</span>
          <select
            value={org.organizationType}
            onChange={(e) =>
              setOrg({
                ...org,
                organizationType: e.target.value as OrganizationType,
              })
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Төлөв</span>
          <select
            value={org.status}
            onChange={(e) =>
              setOrg({ ...org, status: e.target.value as OrganizationStatus })
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">И-мэйл</span>
            <input
              value={org.email ?? ""}
              onChange={(e) => setOrg({ ...org, email: e.target.value || null })}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Утас</span>
            <input
              value={org.phone ?? ""}
              onChange={(e) => setOrg({ ...org, phone: e.target.value || null })}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Вэбсайт</span>
          <input
            value={org.website ?? ""}
            onChange={(e) => setOrg({ ...org, website: e.target.value || null })}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Хаяг</span>
          <input
            value={org.address ?? ""}
            onChange={(e) => setOrg({ ...org, address: e.target.value || null })}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Тэмдэглэл</span>
          <textarea
            value={org.notes ?? ""}
            onChange={(e) => setOrg({ ...org, notes: e.target.value || null })}
            rows={4}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveOrg()}
          className="self-start rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Гишүүд</h2>
        <p className="mt-1 text-sm text-slate-600">
          Нийт {members.length} ·{" "}
          {members.filter((m) => m.status === "invited").length} уригдсан ·{" "}
          {members.filter((m) => m.status === "active").length} идэвхтэй
        </p>
        <Link
          href={`/organization/${organizationId}/members/import`}
          className="mt-2 inline-block text-sm font-semibold text-emerald-600"
        >
          Гишүүдийг бөөнөөр оруулах →
        </Link>
        <ul className="mt-3 flex flex-col gap-2">
          {members.length === 0 ? (
            <li className="text-sm text-slate-600">Одоогоор гишүүн алга.</li>
          ) : (
            members.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span>
                  {m.displayName ?? m.email ?? "Гишүүн"} ·{" "}
                  {ROLE_LABELS[m.role] ?? m.role} ·{" "}
                  {MEMBER_STATUS_LABELS[m.status] ?? m.status}
                  {m.userId ? (
                    <span className="text-xs text-slate-500"> · {m.userId}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRemoveMember(m.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Хасах
                </button>
              </li>
            ))
          )}
        </ul>
        <form
          onSubmit={(e) => void handleAddMember(e)}
          className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4"
        >
          <h3 className="text-sm font-medium text-slate-700">Гишүүн нэмэх</h3>
          <input
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="Харагдах нэр"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="И-мэйл"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={memberRole}
            onChange={(e) =>
              setMemberRole(e.target.value as OrganizationMemberRole)
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </option>
            ))}
          </select>
          <input
            value={memberUserId}
            onChange={(e) => setMemberUserId(e.target.value)}
            placeholder="Хэрэглэгчийн ID (заавал биш, UUID)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Гишүүн нэмэх
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Байгууллагын ангиуд</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {classrooms.length === 0 ? (
            <li className="text-sm text-slate-600">
              Одоогоор холбогдсон анги алга.
            </li>
          ) : (
            classrooms.map((c) => (
              <li
                key={c.id}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                {c.name} ·{" "}
                {VISIBILITY_LABELS[c.visibility ?? "private"] ?? c.visibility} ·{" "}
                {c.studentCount ?? 0} сурагч
                {c.id ? (
                  <Link
                    href={`/teacher/classes/${c.id}`}
                    className="ml-2 text-emerald-600 hover:text-emerald-800"
                  >
                    Харах
                  </Link>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Байгууллагын даалгаврууд</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {assignments.length === 0 ? (
            <li className="text-sm text-slate-600">
              Одоогоор холбогдсон даалгавар алга.
            </li>
          ) : (
            assignments.map((a) => (
              <li
                key={a.id}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span translate="no">{a.title}</span> · {a.classroomName ?? "Анги"} ·{" "}
                {ASSIGNMENT_STATUS_LABELS[a.status] ?? a.status}
                <Link
                  href={`/teacher/assignments/${a.id}`}
                  className="ml-2 text-emerald-600 hover:text-emerald-800"
                >
                  Харах
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      {relatedInquiries.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="font-semibold text-slate-900">Холбоотой хүсэлтүүд</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {relatedInquiries.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/admin/b2b/inquiries/${i.id}`}
                  className="text-sm text-emerald-600 hover:text-emerald-800"
                >
                  {i.organizationName} —{" "}
                  {INQUIRY_STATUS_LABELS[i.status] ?? i.status} (
                  {formatMongoliaDateTime(i.createdAt, "date")})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
