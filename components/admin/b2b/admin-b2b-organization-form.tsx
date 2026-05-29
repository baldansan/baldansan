"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrganizationStatus, OrganizationType } from "@/lib/b2b/types";
import { createOrganization } from "@/lib/supabase/organizations";

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

export function AdminB2BOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationType, setOrganizationType] =
    useState<OrganizationType>("training_center");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<OrganizationStatus>("lead");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createOrganization({
      name,
      organizationType,
      website,
      phone,
      email,
      address,
      notes,
      status,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) {
      router.push(`/admin/b2b/organizations/${res.data.id}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <Link
          href="/admin/b2b/organizations"
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          ← Organizations
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Create organization
        </h1>
      </section>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Name *</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            value={organizationType}
            onChange={(e) =>
              setOrganizationType(e.target.value as OrganizationType)
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrganizationStatus)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Website</span>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create organization"}
        </button>
      </form>
    </div>
  );
}
