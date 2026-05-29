import { ClassroomStudentsImportView } from "@/components/teacher/classroom-students-import-view";

export const metadata = {
  title: "Bulk import students — Classroom",
};

type Props = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassroomStudentsImportPage({ params }: Props) {
  const { classroomId } = await params;
  return <ClassroomStudentsImportView classroomId={classroomId} />;
}
