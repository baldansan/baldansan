import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { LessonHandwritingClient } from "@/components/hanzi/lesson-handwriting-client";

export const metadata = {
  title: "Хөх хотынхонд — Бөөндөө Сурцгаая",
  description:
    "HSK 3-ын хичээл бүрийн өмнө шинэ үг, ханзыг зурлагаар нь бичиж бэлдэх дасгал.",
};

export default function HuhHotPage() {
  return (
    <ReviewSubScreen>
      <LessonHandwritingClient />
    </ReviewSubScreen>
  );
}
