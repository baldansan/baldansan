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
      description="HSK profile-aware ZIP import — level-specific validation, draft-only import."
      backHref="/admin/import"
      templateHint="content/templates/chinese-lesson-zip-package/"
      formatDocHint="docs/BUUNDUU_CHINESE_HSK_PACKAGE_V1.md"
    />
  );
}
