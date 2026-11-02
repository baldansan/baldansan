import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { WorkbookImportClient } from "@/components/admin/workbook-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дасгалын ном (workbook) оруулах — Удирдлагын хэсэг",
};

export default function AdminWorkbookImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Дасгалын ном оруулах"
        description="Байгаа хичээлийн ЗӨВХӨН 练习册 (workbook.json) хэсгийг солино — үг, эх бичвэр, дүрэм, сорил хэвээр үлдэнэ. Формат: content/hsk4-workbooks/FORMAT.md."
      />
      <WorkbookImportClient />
    </div>
  );
}
