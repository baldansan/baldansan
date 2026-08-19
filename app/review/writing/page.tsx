import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { WritingReviewClient } from "@/components/review/writing-review-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Бичих давталт — Бөөндөө Сурцгаая",
};

export default function ReviewWritingPage() {
  return (
    <ReviewSubScreen>
      <WritingReviewClient />
    </ReviewSubScreen>
  );
}
