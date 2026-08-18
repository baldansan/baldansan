import type { Metadata } from "next";
import { DictionaryClient } from "@/components/dictionary/dictionary-client";

export const metadata: Metadata = {
  title: "Толь бичиг — Бөөндөө Сурцгаая",
  description:
    "Ханз, пиньинь, монгол утгаар хайдаг HSK толь бичиг — дуудлагатай.",
};

export default function DictionaryPage() {
  return <DictionaryClient />;
}
