import { ProductionQaView } from "@/components/admin/production-qa-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ажиллагааны чанарын шалгалт — Удирдлагын хэсэг",
};

export default function AdminProductionQaPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Ажиллагааны чанарын шалгалт
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ажиллаж буй байршуулалтын хуудсууд, нэвтрэлт, Supabase, удирдлагын
          хэсгийн бэлэн байдлыг шалгах жагсаалт.
        </p>
      </section>
      <ProductionQaView />
    </div>
  );
}
