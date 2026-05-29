"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { canRollbackActivity } from "@/lib/admin/admin-rollback-eligibility";
import { executeRollback } from "@/lib/supabase/admin-rollback";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

type Props = {
  activity: AdminActivityRow;
};

export function RollbackExecutionCard({ activity }: Props) {
  const router = useRouter();
  const eligibility = canRollbackActivity(activity);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRollback() {
    if (!confirmed || !eligibility.supported) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await executeRollback(activity.id);
    setLoading(false);

    if (result.error || !result.data) {
      setError(result.error ?? "Rollback амжилтгүй.");
      return;
    }

    setSuccess(
      `Rollback амжилттай. ${result.data.restoredFields.join(", ")} сэргээгдлээ.`
    );
    router.refresh();
  }

  return (
    <section className="rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-200 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Rollback</h3>
        {eligibility.supported ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            Rollback available
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            Unsupported
          </span>
        )}
      </div>

      {eligibility.supported ? (
        <>
          <p className="mt-2 text-sm text-slate-700">
            Before snapshot-оос дараах field-үүдийг сэргээнэ:
          </p>
          <p className="mt-1 font-mono text-xs text-slate-800">
            {eligibility.restoredFields.join(", ")}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-700">
          {eligibility.reason ??
            "Rollback энэ action дээр одоогоор дэмжигдээгүй."}
        </p>
      )}

      <p className="mt-3 text-xs text-amber-900">
        Rollback нь зөвхөн сонгосон metadata/status/media/release fields-г
        сэргээнэ. Subtitle/vocabulary/quiz bulk rollback одоогоор идэвхгүй.
      </p>

      {eligibility.supported ? (
        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>Би rollback хийх гэж буй өөрчлөлтийг ойлгож байна.</span>
        </label>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-200">
          <p>{success}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {activity.lessonId ? (
              <Link
                href={`/admin/lessons/${activity.lessonId}/edit`}
                className="font-semibold text-emerald-800 hover:text-emerald-900"
              >
                Open lesson edit →
              </Link>
            ) : null}
            <Link
              href="/admin/activity"
              className="font-semibold text-emerald-800 hover:text-emerald-900"
            >
              Activity log →
            </Link>
          </div>
        </div>
      ) : null}

      {eligibility.supported ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={!confirmed || loading}
            onClick={handleRollback}
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Rolling back…" : "Execute rollback"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
