import { redirect } from "next/navigation";

/** Хэрэглэгчид тусдаа «алдааны» хуудас харуулахаа больсон — «Давтах» нүүр рүү. */
export default function Page() {
  redirect("/review");
}
