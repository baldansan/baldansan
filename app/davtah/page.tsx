import { redirect } from "next/navigation";

/** Alias route — bottom nav uses /review */
export default function DavtahPage() {
  redirect("/review");
}
