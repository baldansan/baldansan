import { LessonCreateForm } from "@/components/admin/lesson-create-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Шинэ хичээл — Удирдлагын хэсэг",
};

export default function AdminNewLessonPage() {
  return <LessonCreateForm />;
}
