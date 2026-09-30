import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { SentenceCardsClient } from "@/components/review/sentence-cards-client";

export const metadata = {
  title: "Өгүүлбэрийн карт — Бөөндөө Сурцгаая",
};

export default function ReviewSentencesPage() {
  return (
    <ReviewSubScreen>
      <SentenceCardsClient />
    </ReviewSubScreen>
  );
}
