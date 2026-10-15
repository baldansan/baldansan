import { StudentDetailView } from "@/components/teacher/student-detail-view";

export const metadata = {
  title: "Сурагчийн дэлгэрэнгүй — Багшийн хэсэг",
  description: "Сурагчийн оноо, сул тал, дүн, даалгавар.",
};

type Props = {
  params: Promise<{ classroomId: string; studentUserId: string }>;
};

export default async function StudentDetailPage({ params }: Props) {
  const { classroomId, studentUserId } = await params;
  return <StudentDetailView classroomId={classroomId} studentUserId={studentUserId} />;
}
