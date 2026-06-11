import { redirect } from "next/navigation";

export default function WordRecallGameRedirect() {
  redirect("/games/hsk-vocab-quiz?types=word-recall");
}
