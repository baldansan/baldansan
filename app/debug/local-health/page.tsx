import { LocalHealthClient } from "./local-health-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Local health — debug",
  robots: "noindex",
};

export default function LocalHealthPage() {
  return <LocalHealthClient />;
}
