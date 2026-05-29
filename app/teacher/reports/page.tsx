import { TeacherReportsView } from "@/components/teacher/teacher-reports-view";

export const metadata = {
  title: "Class reports — Бөөндөө Сурцгаая",
  description:
    "Teacher class progress reports — assignment completion, quiz averages, exportable markdown.",
};

export default function TeacherReportsPage() {
  return <TeacherReportsView />;
}
