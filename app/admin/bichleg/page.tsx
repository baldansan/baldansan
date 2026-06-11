import { BichlegAdminClient } from "@/components/admin/bichleg-admin-client";
import { fetchAdminSeriesList } from "@/lib/admin/bichleg-admin-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Бичлэг удирдлага — Admin",
  description: "Цуврал болон ангиудыг удирдах.",
};

export default async function AdminBichlegPage() {
  const series = await fetchAdminSeriesList();
  return <BichlegAdminClient initialSeries={series} />;
}
