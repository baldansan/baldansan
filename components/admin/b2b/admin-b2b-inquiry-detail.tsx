"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { B2BInquiry, B2BInquiryActivity, B2BInquiryStatus } from "@/lib/b2b/types";
import {
  addB2BInquiryActivity,
  getB2BInquiryActivity,
  getB2BInquiryById,
  updateB2BInquiryNote,
  updateB2BInquiryStatus,
} from "@/lib/supabase/b2b-inquiries";
import { createOrganizationFromInquiry, getOrganizationMembers } from "@/lib/supabase/organizations";
import { createOrganizationMemberInvitation } from "@/lib/supabase/invitations";

const STATUS_OPTIONS: B2BInquiryStatus[] = [
  "new",
  "contacted",
  "demo_scheduled",
  "proposal_sent",
  "pilot",
  "won",
  "lost",
  "archived",
];

/** Зөвхөн дэлгэцэнд харуулах нэр — өгөгдлийн утгыг өөрчлөхгүй. */
const STATUS_LABELS: Record<string, string> = {
  new: "Шинэ",
  contacted: "Холбоо барьсан",
  demo_scheduled: "Танилцуулга товлосон",
  proposal_sent: "Санал илгээсэн",
  pilot: "Туршилт",
  won: "Гэрээ байгуулсан",
  lost: "Татгалзсан",
  archived: "Архивласан",
};

const ORG_TYPE_LABELS: Record<string, string> = {
  training_center: "Сургалтын төв",
  school: "Сургууль",
  university: "Их сургууль",
  teacher: "Багш (хувь хүн)",
  company: "Компани",
  other: "Бусад",
};

const PACKAGE_LABELS: Record<string, string> = {
  teacher: "Багшийн багц",
  school: "Сургуулийн багц",
  training_center: "Сургалтын төвийн багц",
  custom: "Тусгай багц",
};

const SOURCE_LABELS: Record<string, string> = {
  school_inquiry_page: "Сургуулийн хүсэлтийн хуудас",
};

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  note_added: "Тэмдэглэл нэмсэн",
  status_updated: "Төлөв өөрчилсөн",
  organization_created: "Байгууллага үүсгэсэн",
};

type Props = {
  inquiryId: string;
};

export function AdminB2BInquiryDetail({ inquiryId }: Props) {
  const [inquiry, setInquiry] = useState<B2BInquiry | null>(null);
  const [activity, setActivity] = useState<B2BInquiryActivity[]>([]);
  const [status, setStatus] = useState<B2BInquiryStatus>("new");
  const [adminNote, setAdminNote] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgLink, setOrgLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [inquiryRes, activityRes] = await Promise.all([
      getB2BInquiryById(inquiryId),
      getB2BInquiryActivity(inquiryId),
    ]);
    setLoading(false);
    if (inquiryRes.error) setError(inquiryRes.error);
    else if (inquiryRes.data) {
      setInquiry(inquiryRes.data);
      setStatus(inquiryRes.data.status);
      setAdminNote(inquiryRes.data.adminNote ?? "");
    }
    if (activityRes.data) setActivity(activityRes.data);
  }, [inquiryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveStatus() {
    setSaving(true);
    setError(null);
    const res = await updateB2BInquiryStatus(inquiryId, status);
    setSaving(false);
    if (res.error) setError(res.error);
    else {
      setInquiry(res.data);
      void load();
    }
  }

  async function handleSaveNote() {
    setSaving(true);
    setError(null);
    const res = await updateB2BInquiryNote(inquiryId, adminNote);
    setSaving(false);
    if (res.error) setError(res.error);
    else setInquiry(res.data);
  }

  async function handleAddActivity() {
    if (!activityNote.trim()) return;
    setSaving(true);
    const res = await addB2BInquiryActivity(
      inquiryId,
      "note_added",
      activityNote.trim()
    );
    setSaving(false);
    if (res.error) setError(res.error);
    else {
      setActivityNote("");
      void load();
    }
  }

  async function handleCreateOrganization() {
    if (!inquiry) return;
    setSaving(true);
    setError(null);
    const res = await createOrganizationFromInquiry({
      organizationName: inquiry.organizationName,
      contactPerson: inquiry.contactPerson,
      email: inquiry.email,
      phone: inquiry.phone,
      organizationType: inquiry.organizationType,
      notes: inquiry.message,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) {
      setOrgLink(res.data.id);
      if (inquiry.email) {
        const membersRes = await getOrganizationMembers(res.data.id);
        const manager = (membersRes.data ?? []).find(
          (m) => m.role === "manager" && m.email?.toLowerCase() === inquiry.email?.toLowerCase()
        );
        if (manager) {
          await createOrganizationMemberInvitation({
            organizationId: res.data.id,
            organizationMemberId: manager.id,
            email: inquiry.email ?? undefined,
            displayName: inquiry.contactPerson ?? undefined,
            role: "manager",
          });
        }
      }
      await updateB2BInquiryStatus(inquiryId, "contacted");
      await addB2BInquiryActivity(
        inquiryId,
        "organization_created",
        `Байгууллага үүсгэлээ: ${res.data.name}`,
        { organizationId: res.data.id }
      );
      void load();
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Ачаалж байна…</p>;
  }

  if (!inquiry) {
    return (
      <div>
        <p className="text-sm text-slate-600">{error ?? "Хүсэлт олдсонгүй."}</p>
        <Link href="/admin/b2b/inquiries" className="mt-2 text-sm text-emerald-600">
          ← Хүсэлтүүд
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link
          href="/admin/b2b/inquiries"
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Хүсэлтүүд
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {inquiry.organizationName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {inquiry.contactPerson ?? "—"} · {inquiry.email ?? inquiry.phone ?? "—"}
        </p>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Хүсэлтийн мэдээлэл</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Төрөл</dt>
            <dd>
              {inquiry.organizationType
                ? ORG_TYPE_LABELS[inquiry.organizationType] ??
                  inquiry.organizationType
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Сурагчийн тоо</dt>
            <dd>{inquiry.studentCount ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Багц</dt>
            <dd>
              {inquiry.interestedPackage
                ? PACKAGE_LABELS[inquiry.interestedPackage] ??
                  inquiry.interestedPackage
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Хаанаас ирсэн</dt>
            <dd>{SOURCE_LABELS[inquiry.source] ?? inquiry.source}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ирсэн огноо</dt>
            <dd>{formatMongoliaDateTimeWithLabel(inquiry.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Хариуцагч</dt>
            <dd className="text-slate-400">
              {inquiry.assignedTo ?? "Хариуцагч тодорхойгүй"}
            </dd>
          </div>
        </dl>
        {inquiry.message ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700" translate="no">
            {inquiry.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Төлөв</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as B2BInquiryStatus)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveStatus()}
          className="mt-3 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Хадгалж байна…" : "Төлөв хадгалах"}
        </button>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Админы тэмдэглэл</span>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={4}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveNote()}
          className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Тэмдэглэл хадгалах
        </button>
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleCreateOrganization()}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Энэ хүсэлтээс байгууллага үүсгэх
        </button>
        {orgLink ? (
          <Link
            href={`/admin/b2b/organizations/${orgLink}`}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
          >
            Байгууллагыг харах →
          </Link>
        ) : null}
      </section>

      {orgLink || status === "pilot" || status === "won" ? (
        <section className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <h2 className="font-semibold text-emerald-900">
            Дараагийн алхам: гишүүдийг бөөнөөр оруулах
          </h2>
          <p className="mt-2 text-sm text-emerald-800">
            Туршилтын бэлтгэл хийх үедээ багш, сурагчдыг бөөнөөр оруулна.
          </p>
          {orgLink ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/organization/${orgLink}/members/import`}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Гишүүдийг бөөнөөр оруулах →
              </Link>
              <Link
                href={`/organization/${orgLink}/setup`}
                className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800"
              >
                Тохиргооны алхмууд →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-800">
              Эхлээд байгууллагаа үүсгэсний дараа гишүүдийг бөөнөөр оруулах
              боломжтой болно.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">Үйлдлийн бүртгэл</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {activity.length === 0 ? (
            <li className="text-sm text-slate-600">Одоогоор үйлдэл алга.</li>
          ) : (
            activity.map((a) => (
              <li
                key={a.id}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <span className="font-medium">
                  {ACTIVITY_ACTION_LABELS[a.action] ?? a.action}
                </span>
                {a.note ? <span translate="no"> — {a.note}</span> : null}
                <span className="block text-xs text-slate-400">
                  {formatMongoliaDateTimeWithLabel(a.createdAt)}
                </span>
              </li>
            ))
          )}
        </ul>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={activityNote}
            onChange={(e) => setActivityNote(e.target.value)}
            placeholder="Тэмдэглэл бичих…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleAddActivity()}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Тэмдэглэл нэмэх
          </button>
        </div>
      </section>
    </div>
  );
}
