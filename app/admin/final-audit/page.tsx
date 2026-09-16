import { FinalAuditChecklist } from "@/components/admin/final-audit-checklist";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "5-р үе шатны эцсийн үзлэг — Удирдлагын хэсэг",
};

export default function AdminFinalAuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          5-р үе шатны эцсийн үзлэг
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Удирдлагын хэсэг, хувилбар гаргах урсгал, тайлан, ажил, үйлдлийн
          бүртгэл, буцаалт, аюулгүй байдлын бэлэн байдлыг харах шалгах жагсаалт.
        </p>
      </section>
      <FinalAuditChecklist />
    </div>
  );
}
