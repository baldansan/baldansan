"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { formatMongoliaDateTime } from "@/lib/datetime/mongolia-time";
import type { B2BCrmSummary, B2BInquiry } from "@/lib/b2b/types";
import { getB2BInquiries } from "@/lib/supabase/b2b-inquiries";
import { getOnboardingStatusCounts } from "@/lib/supabase/organization-onboarding";
import { getInvitationEmailDeliveryCounts } from "@/lib/supabase/invitation-email-deliveries";
import { getOrganizations } from "@/lib/supabase/organizations";

/** Зөвхөн дэлгэцэнд харуулах нэр — өгөгдлийн утгыг өөрчлөхгүй. */
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
  initialSummary?: B2BCrmSummary;
  initialRecent?: B2BInquiry[];
  initialWarnings?: string[];
};

export function AdminB2BCrmHome({
  initialSummary,
  initialRecent = [],
  initialWarnings = [],
}: Props) {
  const [summary, setSummary] = useState<B2BCrmSummary | null>(
    initialSummary ?? null
  );
  const [recent, setRecent] = useState<B2BInquiry[]>(initialRecent);
  const [orgCount, setOrgCount] = useState(0);
  const [onboardingCounts, setOnboardingCounts] = useState({
    notStarted: 0,
    inProgress: 0,
    readyForPilot: 0,
    pilotRunning: 0,
    paused: 0,
  });
  const [emailDeliveryCounts, setEmailDeliveryCounts] = useState({
    sent: 0,
    failed: 0,
    skipped: 0,
  });
  const [warnings, setWarnings] = useState<string[]>(initialWarnings);
  const [loading, setLoading] = useState(!initialSummary);

  useEffect(() => {
    async function load() {
      const [inquiriesRes, orgsRes, onboardingRes, deliveryRes] = await Promise.all([
        getB2BInquiries(),
        getOrganizations(),
        getOnboardingStatusCounts(),
        getInvitationEmailDeliveryCounts(),
      ]);
      setLoading(false);
      const allWarnings: string[] = [...initialWarnings];
      if (inquiriesRes.error) allWarnings.push(inquiriesRes.error);
      if (orgsRes.error) allWarnings.push(orgsRes.error);

      const inquiries = inquiriesRes.data ?? [];
      const countStatus = (status: string) =>
        inquiries.filter((i) => i.status === status).length;
      const orgs = orgsRes.data ?? [];
      setOrgCount(orgs.length);
      if (onboardingRes.data) setOnboardingCounts(onboardingRes.data);
      if (deliveryRes.data) setEmailDeliveryCounts(deliveryRes.data);
      setRecent(inquiries.slice(0, 5));
      setSummary({
        newInquiries: countStatus("new"),
        contactedInquiries: countStatus("contacted"),
        demoScheduledInquiries: countStatus("demo_scheduled"),
        pilotInquiries: countStatus("pilot"),
        wonInquiries: countStatus("won"),
        lostInquiries: countStatus("lost"),
        activeOrganizations: orgs.filter(
          (o) => o.status === "active" || o.status === "pilot"
        ).length,
        migrationPending: false,
      });
      setWarnings(allWarnings);
    }
    if (!initialSummary) void load();
  }, [initialSummary, initialWarnings]);

  if (loading) {
    return <p className="text-sm text-slate-600">Ачаалж байна…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Сургууль, байгууллага
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Сургалтын төв, сургууль, багш, байгууллагаас ирсэн хүсэлт болон
          хамтран ажиллаж буй байгууллагууд.
        </p>
        {warnings.length > 0 ? (
          <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        ) : null}
        {summary?.migrationPending ? (
          <p className="mt-3 text-xs text-amber-800">
            Run migration 012_school_organizations_b2b_crm.sql
          </p>
        ) : null}
      </section>

      {summary ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <AdminMetricCard label="Шинэ" value={summary.newInquiries} accent="amber" />
          <AdminMetricCard label="Холбоо барьсан" value={summary.contactedInquiries} />
          <AdminMetricCard
            label="Танилцуулга товлосон"
            value={summary.demoScheduledInquiries}
          />
          <AdminMetricCard label="Туршилт" value={summary.pilotInquiries} />
          <AdminMetricCard label="Гэрээ байгуулсан" value={summary.wonInquiries} accent="emerald" />
          <AdminMetricCard label="Татгалзсан" value={summary.lostInquiries} accent="slate" />
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <AdminMetricCard label="Бэлтгэл эхлээгүй" value={onboardingCounts.notStarted} />
        <AdminMetricCard label="Хийгдэж байна" value={onboardingCounts.inProgress} accent="amber" />
        <AdminMetricCard label="Туршилтад бэлэн" value={onboardingCounts.readyForPilot} accent="emerald" />
        <AdminMetricCard label="Туршилт явж байна" value={onboardingCounts.pilotRunning} />
        <AdminMetricCard label="Түр зогссон" value={onboardingCounts.paused} accent="slate" />
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Урилгын и-мэйл</h2>
        <p className="mt-2 text-sm text-slate-600">
          Илгээсэн {emailDeliveryCounts.sent} · Амжилтгүй {emailDeliveryCounts.failed} · Алгассан{" "}
          {emailDeliveryCounts.skipped}
        </p>
        <Link
          href="/admin/b2b/invitations"
          className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Илгээлтийн бүртгэл харах →
        </Link>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link
          href="/admin/b2b/inquiries"
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Хүсэлтүүд
        </Link>
        <Link
          href="/admin/b2b/organizations"
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Байгууллагууд ({orgCount})
        </Link>
        <Link
          href="/admin/b2b/organizations/new"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
        >
          Байгууллага үүсгэх
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Сүүлд ирсэн хүсэлт</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Одоогоор хүсэлт алга.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recent.map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  href={`/admin/b2b/inquiries/${inquiry.id}`}
                  className="block rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 hover:ring-emerald-200"
                >
                  <span className="font-medium text-slate-900">
                    {inquiry.organizationName}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {INQUIRY_STATUS_LABELS[inquiry.status] ?? inquiry.status} ·{" "}
                    {formatMongoliaDateTime(inquiry.createdAt, "date")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
