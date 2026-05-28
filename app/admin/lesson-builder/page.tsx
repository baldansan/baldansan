import { LessonBuilderWorkflow } from "@/components/admin/lesson-builder-workflow";
import { getHsk5LessonsWithQa } from "@/lib/admin/lesson-fetch";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lesson Builder — Admin",
};

export default async function LessonBuilderPage() {
  const reports = await getHsk5LessonsWithQa();

  return <LessonBuilderWorkflow reports={reports} />;
}
