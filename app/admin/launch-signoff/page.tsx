import { LaunchSignoffView } from "@/components/admin/launch-signoff-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Production Launch Sign-off — Admin",
};

export default function AdminLaunchSignoffPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Production Launch Sign-off
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Go-live хийхийн өмнөх эцсийн баталгаажуулалт, decision, monitoring
          readiness.
        </p>
      </section>
      <LaunchSignoffView />
    </div>
  );
}
