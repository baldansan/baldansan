import { redirect } from "next/navigation";

/** Хуучин хаяг — одоо багшийн нүүр «Өнөөдөр». */
export default function TeacherDashboardPage() {
  redirect("/teacher/today");
}
