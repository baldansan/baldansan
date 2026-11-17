import Link from "next/link";
import { IntroContent } from "@/components/intro/intro-content";

export const metadata = {
  title: "Танилцуулга",
  description: "Бөөндөө Сурцгаая аппаар хятад хэлийг хэрхэн сурах вэ — зурагтай товч тайлбар.",
};

export default function TaniltsPage() {
  return (
    <main className="bs-intro-page">
      <IntroContent />
      <Link href="/home" className="bs-intro-start bs-intro-start--page">
        Эхэлье!
      </Link>
    </main>
  );
}
