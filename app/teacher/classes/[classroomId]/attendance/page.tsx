import { AttendanceRegisterView } from "@/components/teacher/attendance-register";

export const metadata = {
  title: "Ирцийн бүртгэл — Багшийн хэсэг",
  description: "Нэг өдрийн ирцийг бүртгэж, сүүлийн 30 хоногийн дүнг харах.",
};

// Next.js 16: `params` is a Promise in a page component.
type Props = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassroomAttendancePage({ params }: Props) {
  const { classroomId } = await params;
  return <AttendanceRegisterView classroomId={classroomId} />;
}
