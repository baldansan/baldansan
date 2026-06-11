import { HanziMemorizeClient } from "@/components/review/hanzi-memorize-client";
import { ReviewSubScreen } from "@/components/review/review-sub-screen";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Шинэ үг цээжлэх — Бөөндөө Сурцгаая",
};

export default function ReviewMemorizePage() {
  return (
    <ReviewSubScreen>
      <HanziMemorizeClient />
    </ReviewSubScreen>
  );
}
