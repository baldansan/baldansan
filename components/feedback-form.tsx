"use client";

import { useState } from "react";

const FEEDBACK_TYPES = [
  "bug",
  "content issue",
  "feature request",
  "translation issue",
  "other",
] as const;

export function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<(typeof FEEDBACK_TYPES)[number]>("bug");
  const [lessonId, setLessonId] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  function buildMessage(): string {
    return [
      "# Buunduu Surtsgaay — Feedback",
      "",
      `- **Type:** ${type}`,
      `- **Name:** ${name.trim() || "—"}`,
      `- **Email:** ${email.trim() || "—"}`,
      `- **Lesson ID:** ${lessonId.trim() || "—"}`,
      `- **Date:** ${new Date().toISOString()}`,
      "",
      "## Message",
      "",
      message.trim() || "(empty)",
    ].join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildMessage());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Name (optional)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Feedback type</span>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as (typeof FEEDBACK_TYPES)[number])
          }
          className="rounded-lg border border-slate-200 px-3 py-2"
        >
          {FEEDBACK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Lesson ID (optional)</span>
        <input
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          placeholder="e.g. 1"
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          required
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        {copied ? "Copied!" : "Copy feedback message"}
      </button>
    </form>
  );
}
