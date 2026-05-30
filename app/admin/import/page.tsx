import { ImportHub } from "@/components/admin/import-hub";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson Import — Admin",
  description: "Choose Chinese/HSK or Korean book lesson import workflow.",
};

export default function AdminImportHubPage() {
  return <ImportHub />;
}
