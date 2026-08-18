import { redirect } from "next/navigation";

/** Merged into the unified vocab quiz — kept as a redirect for old links. */
export default function LegacyGameRedirect() {
  redirect("/games/hsk-vocab-quiz?types=word-recall");
}
