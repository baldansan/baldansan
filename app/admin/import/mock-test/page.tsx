import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MockTestImportClient } from "@/components/admin/mock-test-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Жинхэнэ шалгалт (真题) оруулах — Удирдлагын хэсэг",
};

export default function AdminMockTestImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Жинхэнэ шалгалт (真题) оруулах"
        description="HSK 1–6 жинхэнэ шалгалтын zip багц: <TID>.json + audio/ + images/. Аудио/зураг Storage (test-assets)-д, асуултууд mock_tests / mock_test_questions-д (tutor_note, тайлбар, аудио цаг хамт). Формат: docs/mock-test/ZHENTI-PACKAGE-FORMAT.md."
      />
      <MockTestImportClient />
    </div>
  );
}
