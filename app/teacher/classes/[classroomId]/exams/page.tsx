import { ClassExamView } from "@/components/teacher/class-exam-view";

export const metadata = {
  title: "Ангийн загвар шалгалт — Багшийн хэсэг",
  description: "Ангид HSK загвар шалгалт товлох, дүнг харах.",
};

type Props = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassroomExamsPage({ params }: Props) {
  const { classroomId } = await params;
  return <ClassExamView classroomId={classroomId} />;
}
