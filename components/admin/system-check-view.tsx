"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  runSystemChecks,
  SQL_VERIFICATION_INSTRUCTIONS,
  type CheckResult,
  type SystemCheckReport,
} from "@/lib/system/system-checks";

function resultClass(result: CheckResult): string {
  if (result === "pass") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (result === "warn") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }
  if (result === "fail") {
    return "bg-red-50 text-red-800 ring-red-200";
  }
  if (result === "missing") {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }
  return "bg-slate-100 text-slate-500 ring-slate-200";
}

function resultLabel(result: CheckResult): string {
  return result;
}

export function SystemCheckView() {
  const [report, setReport] = useState<SystemCheckReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const next = await runSystemChecks();
      setReport(next);
    } catch {
      setError("System checks could not complete.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function copySqlInstructions() {
    try {
      await navigator.clipboard.writeText(SQL_VERIFICATION_INSTRUCTIONS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const passCount =
    report?.checks.filter((c) => c.result === "pass").length ?? 0;
  const warnCount =
    report?.checks.filter((c) => c.result === "warn").length ?? 0;
  const failCount =
    report?.checks.filter((c) => c.result === "fail").length ?? 0;
  const total = report?.checks.length ?? 0;

  const groups = report
    ? [...new Set(report.checks.map((c) => c.group))]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              App-side verification using the current browser session. Env
              values and keys are never displayed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-60"
          >
            {loading ? "Running…" : "Re-run checks"}
          </button>
        </div>
        {report ? (
          <p className="mt-3 text-sm text-slate-700">
            {passCount} pass · {warnCount} warn · {failCount} fail · {total}{" "}
            total · last run {new Date(report.ranAt).toLocaleString()}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700">{error}</p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Supabase SQL verification
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {SQL_VERIFICATION_INSTRUCTIONS}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          See supabase/verify/README.md for pass/warn/fail meanings and common
          fixes.
        </p>
        <button
          type="button"
          onClick={() => void copySqlInstructions()}
          className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-800"
        >
          {copied ? "Copied!" : "Copy SQL verification instructions"}
        </button>
      </section>

      {loading && !report ? (
        <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
          System check ачааллаж байна…
        </p>
      ) : null}

      {report
        ? groups.map((group) => (
            <section
              key={group}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <h2 className="text-lg font-semibold capitalize text-slate-900">
                {group.replace(/_/g, " ")}
              </h2>
              <ul className="mt-4 divide-y divide-slate-100">
                {report.checks
                  .filter((check) => check.group === group)
                  .map((check) => (
                    <li
                      key={check.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {check.label}
                        </p>
                        {check.detail ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {check.detail}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ring-1 ${resultClass(check.result)}`}
                      >
                        {resultLabel(check.result)}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ))
        : null}

      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
        <h2 className="text-base font-semibold text-slate-900">
          Deployment docs
        </h2>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <Link
              href="/deployment-check"
              className="font-medium text-emerald-800 hover:underline"
            >
              Public deployment check
            </Link>
          </li>
          <li>
            <Link
              href="/admin/final-audit"
              className="font-medium text-emerald-800 hover:underline"
            >
              Phase 5 Final Audit
            </Link>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          VERCEL_DEPLOYMENT_GUIDE.md · SUPABASE_PRODUCTION_SETUP.md ·
          PRODUCTION_CHECKLIST.md · DEPLOYMENT_PLAN.md ·
          supabase/verify/README.md
        </p>
      </section>
    </div>
  );
}
