import { HanziMemorizeClient } from "@/components/review/hanzi-memorize-client";
import { ReviewSubScreen } from "@/components/review/review-sub-screen";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Шинэ үг цээжлэх — Бөөндөө Сурцгаая",
};

type PageProps = {
  searchParams: Promise<{ level?: string }>;
};

export default async function ReviewMemorizePage({ searchParams }: PageProps) {
  const { level } = await searchParams;

  return (
    <ReviewSubScreen>
      <HanziMemorizeClient restoreLevel={level} />
    </ReviewSubScreen>
  );
}
