import { TodayReviewClient } from "@/components/review/today-review-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Өнөөдрийн давталт — Бөөндөө Сурцгаая",
  description: "Spaced repetition review — vocabulary, sentences, and listening.",
};

export default function TodayReviewPage() {
  return <TodayReviewClient />;
}
