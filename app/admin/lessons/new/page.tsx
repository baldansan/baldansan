import { LessonCreateForm } from "@/components/admin/lesson-create-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New lesson — Admin",
};

export default function AdminNewLessonPage() {
  return <LessonCreateForm />;
}
