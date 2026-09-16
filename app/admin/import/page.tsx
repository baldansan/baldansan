import { ImportHub } from "@/components/admin/import-hub";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Хичээл оруулах — Удирдлагын хэсэг",
  description: "Хятад/HSK эсвэл Солонгос номын хичээл оруулах аргаа сонгоно уу.",
};

export default function AdminImportHubPage() {
  return <ImportHub />;
}
