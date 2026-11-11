import { redirect } from "next/navigation";

/** Тусдаа тоглоом байхаа больсон — «Тоглож сурах»-ын нэг горим болсон. */
export default function Page() {
  redirect("/games/learn?preset=marathon");
}
