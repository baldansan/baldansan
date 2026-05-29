import { ProductionQaView } from "@/components/admin/production-qa-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Production QA — Admin",
};

export default function AdminProductionQaPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Production QA
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Live deployment route, auth, Supabase, admin CMS readiness шалгах
          checklist.
        </p>
      </section>
      <ProductionQaView />
    </div>
  );
}
