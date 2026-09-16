import { LessonZipImportClient } from "@/components/admin/lesson-zip-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Хуучин ZIP багц оруулах — Удирдлагын хэсэг",
  description: "Хятад, солонгос хэлийг өөрөө таньдаг хуучин ZIP багц оруулалт.",
};

export default function AdminLegacyImportPage() {
  return (
    <LessonZipImportClient
      track="legacy"
      title="Хуучин ZIP багц оруулах"
      description="Багцын мэдээллээс хятад эсвэл солонгос хэлийг өөрөө таньна (хуучин нэгдсэн оруулагч)."
      backHref="/admin/import"
      templateHint="content/templates/lesson-zip-package/"
      formatDocHint="LESSON_ZIP_IMPORT_FORMAT.md"
    />
  );
}
