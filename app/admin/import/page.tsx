import { LessonZipImportClient } from "@/components/admin/lesson-zip-import-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson ZIP Import — Admin",
  description:
    "Upload Korean/Chinese lesson ZIP packages for draft import into Buunduu Surtsgaay.",
};

export default function AdminLessonZipImportPage() {
  return <LessonZipImportClient />;
}
