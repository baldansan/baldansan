import { redirect } from "next/navigation";

/** Админы нүүр = багшийн «Өнөөдөр». Хуучин контентын самбар → /admin/overview. */
export default function AdminHomePage() {
  redirect("/teacher/today");
}
