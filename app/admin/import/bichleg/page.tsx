import { BichlegImportClient } from "@/components/admin/bichleg-import-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Бичлэгийн хадмал оруулах — Удирдлагын хэсэг",
  description: "Богино бичлэгийн хадмалын JSON багцыг Supabase рүү байршуулах.",
};

export default function AdminBichlegImportPage() {
  return <BichlegImportClient />;
}
