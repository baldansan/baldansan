"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { B2BInquiry, B2BInquiryStatus } from "@/lib/b2b/types";
import { getB2BInquiries } from "@/lib/supabase/b2b-inquiries";

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

export function AdminB2BInquiryList() {
  const [inquiries, setInquiries] = useState<B2BInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const res = await getB2BInquiries();
      setLoading(false);
      if (res.error) setError(res.error);
      else setInquiries(res.data ?? []);
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (typeFilter !== "all" && i.organizationType !== typeFilter) return false;
      if (!q) return true;
      return (
        i.organizationName.toLowerCase().includes(q) ||
        (i.contactPerson?.toLowerCase().includes(q) ?? false) ||
        (i.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [inquiries, statusFilter, typeFilter, search]);

  const orgTypes = useMemo(
    () =>
      [...new Set(inquiries.map((i) => i.organizationType).filter(Boolean))] as string[],
    [inquiries]
  );

  if (loading) {
    return <p className="text-sm text-slate-600">Ачаалж байна…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link href="/admin/b2b" className="text-sm text-slate-600 hover:text-emerald-600">
          ← Сургууль, байгууллага
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Ирсэн хүсэлтүүд</h1>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Байгууллага, холбоо барих хүн, и-мэйлээр хайх…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:min-w-[240px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">Бүх төлөв</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">Бүх төрөл</option>
          {orgTypes.map((t) => (
            <option key={t} value={t}>
              {ORG_TYPE_LABELS[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Байгууллага</th>
              <th className="px-4 py-3">Холбоо барих</th>
              <th className="px-4 py-3">Төрөл</th>
              <th className="px-4 py-3">Багц</th>
              <th className="px-4 py-3">Төлөв</th>
              <th className="px-4 py-3">Ирсэн огноо</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {i.organizationName}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{i.contactPerson ?? "—"}</div>
                  <div className="text-xs text-slate-500">
                    {i.email ?? i.phone ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {i.organizationType
                    ? ORG_TYPE_LABELS[i.organizationType] ?? i.organizationType
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {i.interestedPackage
                    ? PACKAGE_LABELS[i.interestedPackage] ?? i.interestedPackage
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {STATUS_LABELS[i.status] ?? i.status}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatMongoliaDateTimeWithLabel(i.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/b2b/inquiries/${i.id}`}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    Харах
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600">
          Шүүлтэд тохирох хүсэлт олдсонгүй.
        </p>
      ) : null}
    </div>
  );
}
