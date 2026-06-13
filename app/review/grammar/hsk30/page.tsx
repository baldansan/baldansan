import { Hsk30CoursePlayer } from "@/components/hsk30-durem/hsk30-course-player";
import "@/components/helzui/helzui-course.css";
import "@/components/lesson/modules/grammar-module.css";
import { getHsk30Course } from "@/lib/hsk30-durem/load-course";

export const metadata = {
  title: "HSK 3.0 дүрэм — Давтах",
};

export default function ReviewGrammarHsk30Page() {
  return <Hsk30CoursePlayer course={getHsk30Course()} />;
}
