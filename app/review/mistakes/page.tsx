import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { MistakeBookClient } from "@/components/review/mistake-book-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Миний алдаанууд — Бөөндөө Сурцгаая",
};

export default function ReviewMistakesPage() {
  return (
    <ReviewSubScreen>
      <MistakeBookClient />
    </ReviewSubScreen>
  );
}
