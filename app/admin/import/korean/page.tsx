import { LessonZipImportClient } from "@/components/admin/lesson-zip-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Korean Book Lesson Import — Admin",
  description: "Upload Korean textbook lesson ZIP packages for draft import.",
};

export default function AdminKoreanImportPage() {
  return (
    <LessonZipImportClient
      track="korean"
      title="Korean Book Lesson Import"
      description="Монгол хүнд зориулсан Солонгос хэлний номын хичээл, 한글, үгийн сан, quiz, дасгал импортлох."
      backHref="/admin/import"
      templateHint="content/templates/korean-lesson-zip-package/"
      formatDocHint="KOREAN_ZIP_IMPORT_FORMAT.md"
      showCourseSetupHint
    />
  );
}
