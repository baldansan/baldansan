import { HandwritingCourseClient } from "@/components/hanzi/handwriting-course-client";

export const metadata = {
  title: "Бичих сургалт · 写字练习 — Бөөндөө Сурцгаая",
  description:
    "HSK 3.0 стандартын гараар бичиж сурах ёстой 1200 ханзыг дагаж + санаж бичиж сурна.",
};

export default function HandwritingCoursePage() {
  return <HandwritingCourseClient />;
}
