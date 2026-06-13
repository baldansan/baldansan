import { HelzuiCoursePlayer } from "@/components/helzui/helzui-course-player";
import "@/components/helzui/helzui-course.css";
import { HELZUI_REVIEW_BASE, getHelzuiCourse } from "@/lib/helzui/load-course";

export const metadata = {
  title: "Өгүүлбэрийн бүтэц — Давтах",
};

export default function ReviewGrammarStructurePage() {
  const course = getHelzuiCourse();
  return (
    <HelzuiCoursePlayer
      course={course}
      modulesBase={HELZUI_REVIEW_BASE}
      backHref="/review"
      heroTitle="Өгүүлбэрийн бүтэц"
      heroBadge="Давтах · 9 модуль"
    />
  );
}
