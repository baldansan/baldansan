import { TeacherReportsView } from "@/components/teacher/teacher-reports-view";

export const metadata = {
  title: "Тайлан — Багшийн ажлын талбар",
  description:
    "Teacher class progress reports — assignment completion, quiz averages, exportable markdown.",
};

export default function TeacherReportsPage() {
  return <TeacherReportsView />;
}
