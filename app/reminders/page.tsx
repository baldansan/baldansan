import { redirect } from "next/navigation";

/** Сануулга одоо Профайл дээрх ганц мөр тохиргоо. */
export default function RemindersPage() {
  redirect("/profile#reminder");
}
