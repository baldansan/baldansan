import { ReviewSrsClient } from "@/components/review/review-srs-client";
import { ReviewSubScreen } from "@/components/review/review-sub-screen";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Өнөөдрийн давталт — Бөөндөө Сурцгаая",
};

export default function ReviewDailyPage() {
  return (
    <ReviewSubScreen>
      <ReviewSrsClient embedded />
    </ReviewSubScreen>
  );
}
