import { redirect } from "next/navigation";

export default function ExampleClozeGameRedirect() {
  redirect("/games/hsk-vocab-quiz?types=example-cloze");
}
