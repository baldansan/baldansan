import { redirect } from "next/navigation";

/** Хуучин «Ном сонгох» хуудас — одоо бүх ном «Ном» таб (/nom) дээр. */
export default function BooksPage() {
  redirect("/nom");
}
