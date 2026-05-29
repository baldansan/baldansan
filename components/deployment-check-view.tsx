"use client";

import { useEffect, useState } from "react";
import {
  runDeploymentChecks,
  type DeploymentCheckReport,
} from "@/lib/system/deployment-checks";
import type { CheckResult } from "@/lib/system/system-checks";

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
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function DeploymentCheckView() {
  const [report, setReport] = useState<DeploymentCheckReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const next = await runDeploymentChecks();
      setReport(next);
    } catch {
      setError("Deployment checks could not complete.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const passCount =
    report?.checks.filter((c) => c.result === "pass").length ?? 0;
  const warnCount =
    report?.checks.filter((c) => c.result === "warn").length ?? 0;
  const failCount =
    report?.checks.filter((c) => c.result === "fail").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              Public-safe smoke test. No login required. Env values and keys are
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
            {passCount} pass · {warnCount} warn · {failCount} fail · environment:{" "}
            {report.nodeEnv} · last run{" "}
            {new Date(report.ranAt).toLocaleString()}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700">{error}</p>
        ) : null}
      </section>

      {loading && !report ? (
        <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
          Deployment check ачааллаж байна…
        </p>
      ) : null}

      {report ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <ul className="divide-y divide-slate-100">
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
                    <p className="mt-1 text-xs text-slate-500">
                      {check.detail}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ring-1 ${resultClass(check.result)}`}
                >
                  {check.result}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">
          After first deploy
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Update Supabase Auth Site URL and Redirect URLs, then test{" "}
          <code className="text-xs">/login</code>,{" "}
          <code className="text-xs">/courses/hsk5</code>, and{" "}
          <code className="text-xs">/admin/system-check</code> (admin). See
          VERCEL_DEPLOYMENT_GUIDE.md.
        </p>
      </section>
    </div>
  );
}
