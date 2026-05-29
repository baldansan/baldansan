import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** App home — marketing landing moved to /demo if needed. */
export default function RootPage() {
  redirect("/home");
}
