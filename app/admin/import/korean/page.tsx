import { LessonZipImportClient } from "@/components/admin/lesson-zip-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Солонгос номын хичээл оруулах — Удирдлагын хэсэг",
  description: "Солонгос хэлний сурах бичгийн хичээлийн ZIP багцыг ноороглон оруулах.",
};

export default function AdminKoreanImportPage() {
  return (
    <LessonZipImportClient
      track="korean"
      title="Солонгос номын хичээл оруулах"
      description="Монгол хүнд зориулсан Солонгос хэлний номын хичээл, 한글, үгсийн сан, дасгалыг оруулах."
      backHref="/admin/import"
      templateHint="content/templates/korean-lesson-zip-package/"
      formatDocHint="KOREAN_ZIP_IMPORT_FORMAT.md"
      showCourseSetupHint
    />
  );
}
