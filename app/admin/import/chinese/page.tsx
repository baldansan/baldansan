import { LessonZipImportClient } from "@/components/admin/lesson-zip-import-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Хятад / HSK хичээл оруулах — Удирдлагын хэсэг",
  description: "HSK болон хятад хэлний хичээлийн ZIP багцыг ноороглон оруулах.",
};

export default function AdminChineseImportPage() {
  return (
    <LessonZipImportClient
      track="chinese"
      title="Хятад / HSK хичээл оруулах"
      description="HSK түвшинг таньдаг ZIP багц оруулалт — түвшин тус бүрийн шалгалттай, зөвхөн ноорог болгож оруулна."
      backHref="/admin/import"
      templateHint="content/templates/chinese-lesson-zip-package/"
      formatDocHint="docs/BUUNDUU_CHINESE_HSK_PACKAGE_V1.md"
    />
  );
}
