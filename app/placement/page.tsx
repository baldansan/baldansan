import { PlacementClient } from "@/components/placement/placement-client";
import { fetchPlacementPool } from "@/lib/supabase/placement-server";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const dynamic = "force-dynamic";

export const metadata = { title: "Түвшин тогтоох шалгалт — 30 асуулт, 20 минут" };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** /placement?start=3&r=<salt> — HSK 1–6 дасан зохицох түвшин тогтоох шалгалт. */
export default async function PlacementPage({ searchParams }: Props) {
  const sp = await searchParams;
  const startRaw = Number(first(sp.start) ?? 3);
  const startLevel = Number.isFinite(startRaw) ? Math.min(6, Math.max(1, Math.round(startRaw))) : 3;
  const salt = (first(sp.r) ?? new Date().toISOString().slice(0, 10)).slice(0, 16);
  const pool = await fetchPlacementPool(salt);
  return <PlacementClient salt={salt} byLevel={pool?.byLevel ?? {}} startLevel={startLevel} />;
}
