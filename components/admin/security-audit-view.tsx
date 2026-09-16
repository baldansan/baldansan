"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import {
  runSecurityAuditChecks,
  getSecurityBlockers,
  getSecurityWarnings,
  type SecurityAuditReport,
  type SecurityCheckResult,
} from "@/lib/admin/security-audit-checks";
import {
  buildSecurityAuditJson,
  buildSecurityAuditMarkdown,
  downloadSecurityAuditFile,
  summarizeSecurityAudit,
} from "@/lib/admin/security-audit-report";

const SQL_INSTRUCTIONS =
  "supabase/verify/production_verification.sql-ийг Supabase SQL Editor дээр ажиллуулна уу.";

function resultClass(result: SecurityCheckResult): string {
  if (result === "pass") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (result === "warn") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (result === "fail") return "bg-red-50 text-red-800 ring-red-200";
  if (result === "manual") return "bg-sky-50 text-sky-900 ring-sky-200";
  return "bg-slate-100 text-slate-500 ring-slate-200";
}

export function SecurityAuditView() {
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setReport(await runSecurityAuditChecks());
    } catch {
      setError("Аюулгүй байдлын үзлэгийг дуусгаж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function copyReport() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(buildSecurityAuditMarkdown(report));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const summary = report ? summarizeSecurityAudit(report.checks) : null;
  const blockers = report ? getSecurityBlockers(report.checks) : [];
  const warnings = report ? getSecurityWarnings(report.checks) : [];
  const groups = report ? [...new Set(report.checks.map((c) => c.group))] : [];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Товчоо</h2>
            <p className="mt-1 text-sm text-slate-600">
              Автомат болон гараар хийх шалгалтууд. Орчны утга, түлхүүрүүд
              хэзээ ч харагдахгүй.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            {loading ? "Ажиллаж байна…" : "Дахин шалгах"}
          </button>
        </div>
        {summary ? (
          <p className="mt-3 text-sm text-slate-700">
            {summary.pass} давсан · {summary.warn} анхааруулга ·{" "}
            {summary.fail} амжилтгүй · {summary.manual} гараар · гаргалт:{" "}
            {summary.launchRecommendation}
            {report ? ` · ${formatMongoliaDateTimeWithLabel(report.ranAt)}` : ""}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Холбоотой үзлэгүүд</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/system-check"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Системийн шалгалт
          </Link>
          <Link
            href="/admin/production-qa"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Чанарын шалгалт
          </Link>
          <Link
            href="/admin/security-audit"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Аюулгүй байдлын үзлэг
          </Link>
          <Link
            href="/admin/launch-candidate"
            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Гаргалтын хувилбар
          </Link>
          <Link
            href="/admin/launch-signoff"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Гаргалтын баталгаа
          </Link>
          <Link
            href="/admin/final-audit"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Эцсийн үзлэг
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">{SQL_INSTRUCTIONS}</p>
      </section>

      {loading && !report ? (
        <p className="rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
          Аюулгүй байдлын үзлэг ачаалж байна…
        </p>
      ) : null}

      {report
        ? groups.map((group) => (
            <section
              key={group}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <h2 className="text-lg font-semibold capitalize text-slate-900">
                {group.replace(/-/g, " ")}
              </h2>
              <ul className="mt-4 divide-y divide-slate-100">
                {report.checks
                  .filter((c) => c.group === group)
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
                        {check.result}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ))
        : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Гаргахад саад болж буй зүйлс</h2>
        {blockers.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-800">
            Автомат шалгалтаас саад олдсонгүй.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {blockers.map((item) => (
              <li
                key={item.id}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-red-100"
              >
                {item.label}
                {item.detail ? (
                  <p className="mt-1 text-xs text-red-800">{item.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {warnings.length > 0 ? (
          <>
            <h3 className="mt-6 text-sm font-semibold text-amber-900">
              Анхааруулга
            </h3>
            <ul className="mt-2 space-y-2">
              {warnings.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {report ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Тайлан гаргах</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyReport()}
              className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
            >
              {copied ? "Хуулагдлаа!" : "Аюулгүй байдлын тайланг хуулах"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadSecurityAuditFile(
                  buildSecurityAuditJson(report),
                  `security-audit-${dateStamp()}.json`,
                  "application/json"
                )
              }
              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
            >
              JSON татах
            </button>
            <button
              type="button"
              onClick={() =>
                downloadSecurityAuditFile(
                  buildSecurityAuditMarkdown(report),
                  `security-audit-${dateStamp()}.md`,
                  "text/markdown"
                )
              }
              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
            >
              Markdown татах
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
