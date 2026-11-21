import { Suspense } from "react";
import { TodayCheckClient } from "@/components/today/today-check-client";

export const metadata = {
  title: "Цээжилснээ шалгах | Бөөндөө Сурцгаая",
};

/** Оройн шалгалт / өчигдрийн хичээлийн шалгалт — хичээлийн үгсээр богино сорил. */
export default function TodayCheckPage() {
  return (
    <Suspense fallback={null}>
      <TodayCheckClient />
    </Suspense>
  );
}
