import Link from "next/link";
import type { PilotReadiness } from "@/lib/b2b/types";
import type { OnboardingStatus, PilotStage } from "@/lib/b2b/types";

type Props = {
  organizationId: string;
  readiness: PilotReadiness;
  onboardingStatus?: OnboardingStatus | null;
  pilotStage?: PilotStage | null;
  showSetupLink?: boolean;
};

export function PilotReadinessCard({
  organizationId,
  readiness,
  onboardingStatus,
  pilotStage,
  showSetupLink = true,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pilot readiness</h2>
          <p className="mt-1 text-sm text-slate-600">
            Score {readiness.score}/100 · {readiness.completedCount}/
            {readiness.totalCount} key tasks
          </p>
        </div>
        <span
          className={
            readiness.ready
              ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
              : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
          }
        >
          {readiness.ready ? "Ready for pilot" : "Needs work"}
        </span>
      </div>

      {(onboardingStatus || pilotStage) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onboardingStatus ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {onboardingStatus}
            </span>
          ) : null}
          {pilotStage ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {pilotStage}
            </span>
          ) : null}
        </div>
      )}

      {readiness.blockers.length > 0 ? (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2">
          <p className="text-xs font-semibold text-red-900">Blockers</p>
          <ul className="mt-1 list-inside list-disc text-xs text-red-800">
            {readiness.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
          <p className="text-xs font-semibold text-amber-900">Warnings</p>
          <ul className="mt-1 list-inside list-disc text-xs text-amber-800">
            {readiness.warnings.slice(0, 4).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showSetupLink ? (
        <Link
          href={`/organization/${organizationId}/setup`}
          className="mt-4 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Open setup wizard →
        </Link>
      ) : null}
    </section>
  );
}
