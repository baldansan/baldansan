"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { InvitationEmailDelivery } from "@/lib/b2b/types";
import { getRecentInvitationEmailDeliveries } from "@/lib/supabase/invitation-email-deliveries";

export function AdminB2BInvitationsView() {
  const [deliveries, setDeliveries] = useState<InvitationEmailDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [emailSearch, setEmailSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getRecentInvitationEmailDeliveries(100);
    setLoading(false);
    if (res.error) setError(res.error);
    else setDeliveries(res.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (providerFilter !== "all" && d.provider !== providerFilter) return false;
      if (
        emailSearch.trim() &&
        !d.recipientEmail.toLowerCase().includes(emailSearch.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [deliveries, statusFilter, providerFilter, emailSearch]);

  const providers = useMemo(
    () => [...new Set(deliveries.map((d) => d.provider))].sort(),
    [deliveries]
  );

  if (loading) {
    return <p className="text-sm text-slate-600">Loading invitation email deliveries…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Invitation email deliveries
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Recent send attempts for organization and classroom invitations.
        </p>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="all">All</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
            <option value="skipped">skipped</option>
            <option value="queued">queued</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Provider</span>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="all">All</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:min-w-[220px]">
          <span className="font-medium">Search email</span>
          <input
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            placeholder="recipient@example.com"
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </section>

      <ul className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <li className="text-sm text-slate-600">No delivery logs match filters.</li>
        ) : (
          filtered.map((d) => (
            <li
              key={d.id}
              className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold uppercase">{d.status}</span>
                <span className="text-slate-500">{d.provider}</span>
                <span>{d.recipientEmail}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {d.inviteKind ?? "invitation"} ·{" "}
                {d.organizationName ?? d.classroomName ?? "—"} ·{" "}
                {formatMongoliaDateTimeWithLabel(d.createdAt)}
              </p>
              {d.errorMessage ? (
                <p className="mt-1 text-xs text-amber-800">{d.errorMessage}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
