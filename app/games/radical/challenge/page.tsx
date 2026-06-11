import { redirect } from "next/navigation";

export default function RadicalChallengeRedirect() {
  redirect("/games/radical?mode=challenge");
}
