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

/** Зөвхөн дэлгэцэнд харуулах нэр — өгөгдлийн утгыг өөрчлөхгүй. */
const STATUS_LABELS: Record<string, string> = {
  lead: "Сонирхсон",
  contacted: "Холбоо барьсан",
  demo_scheduled: "Танилцуулга товлосон",
  pilot: "Туршилт",
  active: "Идэвхтэй",
  paused: "Түр зогссон",
  closed: "Хаасан",
};

const TYPE_LABELS: Record<string, string> = {
  training_center: "Сургалтын төв",
  school: "Сургууль",
  university: "Их сургууль",
  teacher: "Багш (хувь хүн)",
  company: "Компани",
  other: "Бусад",
};

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
    return <p className="text-sm text-slate-600">Ачаалж байна…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link href="/admin/b2b" className="text-sm text-slate-600 hover:text-emerald-600">
          ← Сургууль, байгууллага
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Байгууллагууд</h1>
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
          Байгууллага үүсгэх
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр, и-мэйлээр хайх…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:min-w-[200px]"
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
              {TYPE_LABELS[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Нэр</th>
              <th className="px-4 py-3">Төрөл</th>
              <th className="px-4 py-3">Төлөв</th>
              <th className="px-4 py-3">Холбоо барих</th>
              <th className="px-4 py-3">Гишүүд</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{o.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {TYPE_LABELS[o.organizationType] ?? o.organizationType}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {STATUS_LABELS[o.status] ?? o.status}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {o.email ?? o.phone ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{o.memberCount ?? 0}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/b2b/organizations/${o.id}`}
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
    </div>
  );
}
