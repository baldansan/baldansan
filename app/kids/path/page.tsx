import { KidPathClient } from "@/components/kids/kid-path-client";
import { KID_PATH_DAYS } from "@/lib/kids/path";

export const metadata = { title: "Хүүхдийн 7 хоног — Бөөндөө Сурцгаая" };

type Props = { searchParams: Promise<{ day?: string; medal?: string }> };

/** /kids/path — «Хүүхдийн 7 хоног»: наалтын самбар + 7 өдрийн карт (?day=N дэлгэнэ, ?medal=1 медаль). */
export default async function KidPathPage({ searchParams }: Props) {
  const sp = await searchParams;
  const n = Number.parseInt(sp.day ?? "", 10);
  const day = Number.isFinite(n) && n >= 1 && n <= KID_PATH_DAYS ? n : null;
  return <KidPathClient initialDay={day} medal={sp.medal === "1"} />;
}
