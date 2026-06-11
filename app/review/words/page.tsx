import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { WordSrsWordsClient } from "@/components/review/word-srs-words-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Миний үгс — Бөөндөө Сурцгаая",
};

export default function ReviewWordsPage() {
  return (
    <ReviewSubScreen>
      <WordSrsWordsClient />
    </ReviewSubScreen>
  );
}
