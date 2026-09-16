import { SecurityAuditView } from "@/components/admin/security-audit-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Аюулгүй байдал / RLS үзлэг — Удирдлагын хэсэг",
};

export default function AdminSecurityAuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Аюулгүй байдал / RLS үзлэг
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Нээхийн өмнөх нэвтрэлт, RLS, файл хадгалалт, админы эрх, нууц түлхүүрийн
          аюулгүй байдлын шалгалт.
        </p>
      </section>
      <SecurityAuditView />
    </div>
  );
}
