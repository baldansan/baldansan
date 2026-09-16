import { ClassReportView } from "@/components/teacher/class-report-view";

export const metadata = {
  title: "Ангийн тайлан — Багш",
  description:
    "Нэг ангийн хэвлэхэд бэлэн тайлан: хураангуй, үнэлгээний тархалт, сурагч бүрийн дүн.",
};

type Props = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassReportPage({ params }: Props) {
  const { classroomId } = await params;
  return <ClassReportView classroomId={classroomId} />;
}
