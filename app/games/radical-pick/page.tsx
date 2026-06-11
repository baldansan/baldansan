import { redirect } from "next/navigation";

export default function RadicalPickGameRedirect() {
  redirect("/games/hsk-vocab-quiz?types=radical-pick");
}
