import { BichlegImportClient } from "@/components/admin/bichleg-import-client";
import { fetchAdminSeriesList } from "@/lib/admin/bichleg-admin-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Бичлэгийн хадмал оруулах — Удирдлагын хэсэг",
  description: "Богино бичлэгийн хадмалын JSON багцыг Supabase рүү байршуулах.",
};

export default async function AdminBichlegImportPage() {
  const series = await fetchAdminSeriesList();
  const songSeries = series
    .filter((s) => s.id.startsWith("songs-"))
    .map((s) => ({
      id: s.id,
      title_mn: s.title_mn,
      title_zh: s.title_zh,
      hsk_level: s.hsk_level,
    }));
  return <BichlegImportClient songSeries={songSeries} />;
}
