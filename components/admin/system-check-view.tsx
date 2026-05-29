"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  runSystemChecks,
  type CheckResult,
  type SystemCheckReport,
} from "@/lib/system/system-checks";

function resultClass(result: CheckResult): string {
  if (result === "pass") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (result === "fail") {
    return "bg-red-50 text-red-800 ring-red-200";
  }
  if (result === "missing") {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }
  return "bg-amber-50 text-amber-900 ring-amber-200";
}

function resultLabel(result: CheckResult): string {
  if (result === "pass") return "pass";
  if (result === "fail") return "fail";
  if (result === "missing") return "missing";
  return "skip";
}

export function SystemCheckView() {
  const [report, setReport] = useState<SystemCheckReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const passCount = report?.checks.filter((c) => c.result === "pass").length ?? 0;
  const total = report?.checks.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              Read-only checks using the current browser session. Env values are
              never displayed.
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
            {passCount} / {total} checks passed · last run{" "}
            {new Date(report.ranAt).toLocaleString()}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700">{error}</p>
        ) : null}
      </section>

      {loading && !report ? (
        <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
          System check ачааллаж байна…
        </p>
      ) : null}

      {report ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Checks</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {report.checks.map((check) => (
              <li
                key={check.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {check.label}
                  </p>
                  {check.detail ? (
                    <p className="mt-1 text-xs text-slate-500">{check.detail}</p>
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
      ) : null}

      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
        <h2 className="text-base font-semibold text-slate-900">Deployment docs</h2>
        <p className="mt-2 text-sm text-slate-700">
          Use these guides before go-live. Do not deploy until Supabase migrations
          and policies are applied.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <Link href="/admin/final-audit" className="font-medium text-emerald-800 hover:underline">
              Phase 5 Final Audit
            </Link>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          See DEPLOYMENT_PLAN.md, PRODUCTION_CHECKLIST.md,
          VERCEL_DEPLOYMENT_GUIDE.md, and SUPABASE_PRODUCTION_SETUP.md in the repo.
        </p>
      </section>
    </div>
  );
}
