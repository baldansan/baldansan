import { LaunchCandidateView } from "@/components/admin/launch-candidate-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Launch Candidate — Admin",
};

export default function AdminLaunchCandidatePage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Launch Candidate
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Production release хийхийн өмнөх final smoke test, security, QA,
          rollback, monitoring checklist.
        </p>
      </section>
      <LaunchCandidateView />
    </div>
  );
}
