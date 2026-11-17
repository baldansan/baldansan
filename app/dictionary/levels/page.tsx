import type { Metadata } from "next";
import { Suspense } from "react";
import { LevelWordsClient } from "@/components/dictionary/level-words-client";

export const metadata: Metadata = {
  title: "HSK түвшний үгс — Бөөндөө Сурцгаая",
  description: "HSK 1–6 түвшний бүх үгийг нэг дор үзэж, цээжлэх үгээ зүрхээр тэмдэглэ.",
};

export default function DictionaryLevelsPage() {
  return (
    <Suspense fallback={null}>
      <LevelWordsClient />
    </Suspense>
  );
}
