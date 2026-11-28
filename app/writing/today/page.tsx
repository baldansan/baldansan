import { HanziTodayClient } from "@/components/writing/hanzi-today-client";

export const metadata = {
  title: "Өнөөдөр бичих ханз — Бөөндөө Сурцгаая",
};

export default async function HanziTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ ch?: string }>;
}) {
  const { ch } = await searchParams;
  return <HanziTodayClient only={typeof ch === "string" ? ch : null} />;
}
