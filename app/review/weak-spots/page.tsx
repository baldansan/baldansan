import { redirect } from "next/navigation";

/** «Миний сул тал» тусдаа хуудас байхаа больсон — алдаанууд хичээлээр бүлэглэгдэн «Миний алдаанууд»-д харагдана. */
export default function ReviewWeakSpotsPage() {
  redirect("/review/mistakes");
}
