import { DeploymentCheckView } from "@/components/deployment-check-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Deployment check",
};

export default function DeploymentCheckPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Deployment check
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Public-safe smoke test for Vercel deployments. Confirms the app loads
          and can reach Supabase for public content reads. No secrets shown.
        </p>
      </section>
      <DeploymentCheckView />
    </div>
  );
}
