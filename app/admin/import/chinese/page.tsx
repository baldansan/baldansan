import { LessonZipImportClient } from "@/components/admin/lesson-zip-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chinese / HSK Lesson Import — Admin",
  description: "Upload HSK and Chinese lesson ZIP packages for draft import.",
};

export default function AdminChineseImportPage() {
  return (
    <LessonZipImportClient
      track="chinese"
      title="Chinese / HSK Lesson Import"
      description="HSK хичээл, subtitle, vocabulary, quiz, audio/image ZIP импортлох."
      backHref="/admin/import"
      templateHint="content/templates/chinese-lesson-zip-package/"
      formatDocHint="LESSON_ZIP_IMPORT_FORMAT.md"
    />
  );
}
