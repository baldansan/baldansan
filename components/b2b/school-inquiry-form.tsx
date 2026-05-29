"use client";

import { useState } from "react";
import {
  INQUIRY_PACKAGES,
  ORG_TYPES,
} from "@/lib/content/b2b-copy";
import { createB2BInquiry } from "@/lib/supabase/b2b-inquiries";

export function SchoolInquiryForm() {
  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgType, setOrgType] =
    useState<(typeof ORG_TYPES)[number]["value"]>("training_center");
  const [studentCount, setStudentCount] = useState("");
  const [packageInterest, setPackageInterest] =
    useState<(typeof INQUIRY_PACKAGES)[number]["value"]>("school");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const orgLabel =
    ORG_TYPES.find((t) => t.value === orgType)?.label ?? orgType;
  const packageLabel =
    INQUIRY_PACKAGES.find((p) => p.value === packageInterest)?.label ??
    packageInterest;

  function buildInquiryMessage(): string {
    return [
      "# Buunduu Surtsgaay — School / B2B Inquiry",
      "",
      `- **Organization:** ${orgName.trim() || "—"}`,
      `- **Contact person:** ${contactPerson.trim() || "—"}`,
      `- **Email:** ${email.trim() || "—"}`,
      `- **Phone:** ${phone.trim() || "—"}`,
      `- **Organization type:** ${orgLabel}`,
      `- **Number of students:** ${studentCount.trim() || "—"}`,
      `- **Interested package:** ${packageLabel}`,
      `- **Date:** ${new Date().toISOString()}`,
      "",
      "## Message",
      "",
      message.trim() || "(empty)",
    ].join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildInquiryMessage());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await createB2BInquiry({
      organizationName: orgName,
      contactPerson,
      email,
      phone,
      organizationType: orgType,
      studentCount,
      interestedPackage: packageInterest,
      message,
      source: "school_inquiry_page",
    });

    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
        <h2 className="text-lg font-semibold text-emerald-900">
          Inquiry амжилттай илгээгдлээ.
        </h2>
        <p className="mt-2 text-sm text-emerald-800">
          Бид тантай удахгүй холбогдоно.
        </p>
        <p className="mt-2 text-sm text-emerald-800">
          Дараагийн алхам: demo call → organization setup → pilot classroom.
        </p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="mt-4 rounded-full border border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-emerald-800"
        >
          {copied ? "Хууллаа!" : "Copy inquiry message"}
        </button>
      </section>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Organization name *</span>
        <input
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Жишээ: Shine Mongol Training Center"
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Contact person</span>
        <input
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Organization type</span>
        <select
          value={orgType}
          onChange={(e) =>
            setOrgType(e.target.value as (typeof ORG_TYPES)[number]["value"])
          }
          className="rounded-lg border border-slate-200 px-3 py-2"
        >
          {ORG_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Number of students</span>
        <input
          value={studentCount}
          onChange={(e) => setStudentCount(e.target.value)}
          placeholder="e.g. 30"
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Interested package</span>
        <select
          value={packageInterest}
          onChange={(e) =>
            setPackageInterest(
              e.target.value as (typeof INQUIRY_PACKAGES)[number]["value"]
            )
          }
          className="rounded-lg border border-slate-200 px-3 py-2"
        >
          {INQUIRY_PACKAGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Сургалтын төвийн хэрэгцээ, demo хүсэлт, асуулт..."
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
        disabled={submitting}
        className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send inquiry"}
      </button>

      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-200"
      >
        {copied ? "Хууллаа!" : "Copy inquiry message (fallback)"}
      </button>

      <p className="text-xs leading-5 text-slate-500">
        Inquiry is saved to admin CRM when Supabase is configured. Copy fallback
        works if submission fails or you prefer email/messenger.
      </p>
    </form>
  );
}
