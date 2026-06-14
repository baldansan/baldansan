import { HelzuiCoursePlayer } from "@/components/helzui/helzui-course-player";
import "@/components/helzui/helzui-course.css";
import { getHelzuiCourse } from "@/lib/helzui/load-course";

export const metadata = {
  title: "Хэлзүйн суурь — Заавал сурах",
  description: "Хятад өгүүлбэрийн бүтцийг алгоритмаар задлах статик курс.",
};

export default function HelzuiSuuriCoursePage() {
  const course = getHelzuiCourse();
  return <HelzuiCoursePlayer course={course} />;
}
