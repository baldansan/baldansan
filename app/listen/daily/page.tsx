import { DailyListeningClient } from "@/components/listen/daily-listening-client";
import { fetchDailyListeningSet } from "@/lib/supabase/daily-listening-server";
import { fetchMockTestsCached } from "@/lib/supabase/mock-tests-server";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const dynamic = "force-dynamic";

export const metadata = { title: "Өнөөдрийн сонсгол — 10 асуулт" };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * /listen/daily?level=4&r=<salt>
 * level байхгүй бол HSK 3 (хамгийн олон хэрэглэгчтэй түвшин). Нүүрний карт
 * хэрэглэгчийн идэвхтэй түвшнийг дамжуулна.
 */
export default async function DailyListeningPage({ searchParams }: Props) {
  const sp = await searchParams;
  const levelRaw = Number(first(sp.level) ?? 3);
  const level = Number.isFinite(levelRaw) ? Math.min(6, Math.max(1, levelRaw)) : 3;
  const salt = (first(sp.r) ?? "").slice(0, 16);

  const set = await fetchDailyListeningSet({ level, salt });
  const tests = set ? await fetchMockTestsCached(level) : [];
  const testTitles: Record<string, string> = {};
  for (const t of tests) testTitles[t.id] = t.title;

  return (
    <DailyListeningClient
      level={level}
      dateKey={set?.dateKey ?? ""}
      salt={salt}
      questions={set?.questions ?? []}
      testCount={set?.testCount ?? 0}
      testTitles={testTitles}
    />
  );
}
