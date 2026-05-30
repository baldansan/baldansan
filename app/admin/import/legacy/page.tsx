import { LessonZipImportClient } from "@/components/admin/lesson-zip-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Legacy ZIP Import — Admin",
  description: "Legacy auto-detect Chinese/Korean ZIP import.",
};

export default function AdminLegacyImportPage() {
  return (
    <LessonZipImportClient
      track="legacy"
      title="Legacy ZIP Import"
      description="Auto-detect Chinese or Korean from manifest (legacy unified importer)."
      backHref="/admin/import"
      templateHint="content/templates/lesson-zip-package/"
      formatDocHint="LESSON_ZIP_IMPORT_FORMAT.md"
    />
  );
}
