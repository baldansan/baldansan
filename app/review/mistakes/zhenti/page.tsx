import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { ZhentiMistakesClient } from "@/components/review/zhenti-mistakes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Жинхэнэ шалгалтын алдаа — Бөөндөө Сурцгаая",
};

export default function ZhentiMistakesPage() {
  return (
    <ReviewSubScreen>
      <ZhentiMistakesClient />
    </ReviewSubScreen>
  );
}
