"use client";

import Link from "next/link";
import { useState } from "react";
import {
  bulkInviteCsvTemplate,
  parseBulkInviteCsv,
} from "@/lib/organization/csv-invite-parser";
import {
  bulkInviteOrganizationMembers,
  getInvitationPublicUrl,
} from "@/lib/supabase/organization-invitations";
import type { OrganizationInvitation } from "@/lib/b2b/types";

type Props = {
  organizationId: string;
  canManage: boolean;
  onComplete: () => void;
};

export function BulkInvitePanel({ organizationId, canManage, onComplete }: Props) {
  const [csvText, setCsvText] = useState(bulkInviteCsvTemplate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [created, setCreated] = useState<OrganizationInvitation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleImport() {
    if (!canManage) return;
    setSaving(true);
    setError(null);
    setCreated([]);
    const parsed = parseBulkInviteCsv(csvText);
    setParseErrors(parsed.errors);
    if (parsed.rows.length === 0) {
      setSaving(false);
      setError("No valid rows to import.");
      return;
    }
    const res = await bulkInviteOrganizationMembers(organizationId, parsed.rows);
    setSaving(false);
    if (res.error) setError(res.error);
    else if (res.data) {
      setCreated(res.data.invitations);
      if (res.data.errors.length > 0) setParseErrors(res.data.errors);
      onComplete();
    }
  }

  async function handleCopyLink(inv: OrganizationInvitation) {
    const url = getInvitationPublicUrl(inv);
    await navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  }

  if (!canManage) {
    return (
      <p className="text-sm text-slate-600">Only owner/manager can bulk invite.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Bulk invite (CSV)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Columns: email, display_name, role (teacher, student, manager, assistant).
        </p>
      </div>
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={8}
        className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleImport()}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Importing…" : "Import CSV invites"}
        </button>
        <Link
          href={`/organization/${organizationId}/members`}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Back to members
        </Link>
      </div>
      {parseErrors.length > 0 ? (
        <ul className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {parseErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {created.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {created.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span>
                {inv.email} · {inv.role}
              </span>
              <button
                type="button"
                onClick={() => void handleCopyLink(inv)}
                className="text-xs font-semibold text-emerald-600"
              >
                {copiedId === inv.id ? "Copied!" : "Copy invite link"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
