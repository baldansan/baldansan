"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    return <p className="text-sm text-slate-600">Loading inquiries…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link href="/admin/b2b" className="text-sm text-slate-600 hover:text-emerald-600">
          ← B2B CRM
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Inquiries</h1>
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
          placeholder="Search organization, contact, email…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:min-w-[240px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {orgTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
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
                  {i.organizationType ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {i.interestedPackage ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{i.status}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(i.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/b2b/inquiries/${i.id}`}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600">No inquiries match filters.</p>
      ) : null}
    </div>
  );
}
