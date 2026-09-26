import { redirect } from "next/navigation";

/** «Хичээл» = эхлээд ном сонгоно. Хуучин курсын жагсаалт /courses/all. */
export default function CoursesPage() {
  redirect("/books");
}
