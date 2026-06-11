import { redirect } from "next/navigation";

export default function MeaningGameRedirect() {
  redirect("/games/hsk-vocab-quiz?types=meaning");
}
