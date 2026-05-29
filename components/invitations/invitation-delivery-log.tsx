"use client";

import { useCallback, useEffect, useState } from "react";
import type { InvitationEmailDelivery } from "@/lib/b2b/types";
import { getInvitationEmailDeliveries } from "@/lib/supabase/invitation-email-deliveries";

type Props = {
  invitationId: string;
  refreshKey?: number;
};

export function InvitationDeliveryLog({ invitationId, refreshKey = 0 }: Props) {
  const [deliveries, setDeliveries] = useState<InvitationEmailDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getInvitationEmailDeliveries(invitationId);
    setLoading(false);
    if (res.error) setError(res.error);
    else setDeliveries(res.data ?? []);
  }, [invitationId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading) {
    return <p className="text-xs text-slate-500">Loading delivery log…</p>;
  }

  if (error) {
    return <p className="text-xs text-red-700">{error}</p>;
  }

  if (deliveries.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        No email delivery attempts yet. Use Send email invite or copy link manually.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {deliveries.map((d) => (
        <li
          key={d.id}
          className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold uppercase">{d.status}</span>
            <span>{d.provider}</span>
            <span>{d.recipientEmail}</span>
          </div>
          <p className="text-slate-500">
            {d.sentAt
              ? `Sent ${new Date(d.sentAt).toLocaleString()}`
              : `Created ${new Date(d.createdAt).toLocaleString()}`}
          </p>
          {d.errorMessage ? (
            <p className="text-amber-800">
              {d.errorMessage}
              {d.status === "skipped" || d.status === "manual_copy"
                ? " — manual copy fallback."
                : null}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
