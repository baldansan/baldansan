import { BichlegImportClient } from "@/components/admin/bichleg-import-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Бичлэг хадмал импорт — Admin",
  description: "Upload short video subtitle JSON packages into Supabase.",
};

export default function AdminBichlegImportPage() {
  return <BichlegImportClient />;
}
