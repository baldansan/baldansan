import Link from "next/link";
import type { MyOrganization, OrganizationPilotSummary } from "@/lib/b2b/types";
import { OrganizationRoleBadge } from "@/components/organization/organization-role-badge";

type Props = {
  org: MyOrganization;
  pilotSummary?: OrganizationPilotSummary | null;
};

export function OrganizationCard({ org, pilotSummary }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <Link
        href={`/organization/${org.id}`}
        className="block hover:text-emerald-700"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900">{org.name}</h3>
          <OrganizationRoleBadge role={org.memberRole} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {org.organizationType} · {org.status}
        </p>
      </Link>
      {pilotSummary ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pilotSummary.onboarding ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {pilotSummary.onboarding.onboardingStatus}
            </span>
          ) : null}
          <span className="text-xs font-medium text-emerald-700">
            Readiness {pilotSummary.readiness.score}%
          </span>
          <Link
            href={`/organization/${org.id}/setup`}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            Setup wizard →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
