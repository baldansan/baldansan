import { ClassroomDetailView } from "@/components/teacher/classroom-detail-view";

export const metadata = {
  title: "Class detail — Teacher",
  description: "Classroom students and assignments.",
};

type Props = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassroomDetailPage({ params }: Props) {
  const { classroomId } = await params;
  return <ClassroomDetailView classroomId={classroomId} />;
}
