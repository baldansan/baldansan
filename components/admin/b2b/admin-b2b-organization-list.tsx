"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Organization, OrganizationStatus } from "@/lib/b2b/types";
import { getOrganizations } from "@/lib/supabase/organizations";

const STATUS_OPTIONS: OrganizationStatus[] = [
  "lead",
  "contacted",
  "demo_scheduled",
  "pilot",
  "active",
  "paused",
  "closed",
];

export function AdminB2BOrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const res = await getOrganizations();
      setLoading(false);
      if (res.error) setError(res.error);
      else setOrganizations(res.data ?? []);
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (typeFilter !== "all" && o.organizationType !== typeFilter) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        (o.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [organizations, statusFilter, typeFilter, search]);

  const orgTypes = useMemo(
    () => [...new Set(organizations.map((o) => o.organizationType))],
    [organizations]
  );

  if (loading) {
    return <p className="text-sm text-slate-600">Loading organizations…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link href="/admin/b2b" className="text-sm text-slate-600 hover:text-emerald-600">
          ← B2B CRM
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Organizations</h1>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/b2b/organizations/new"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Create organization
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:min-w-[200px]"
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
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{o.name}</td>
                <td className="px-4 py-3 text-slate-600">{o.organizationType}</td>
                <td className="px-4 py-3 text-slate-600">{o.status}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {o.email ?? o.phone ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{o.memberCount ?? 0}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/b2b/organizations/${o.id}`}
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
    </div>
  );
}
