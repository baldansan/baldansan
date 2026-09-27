import { notFound } from "next/navigation";
import { LevelMap } from "@/components/games/level-map";
import { isLevelGame } from "@/lib/games/level-core";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Үе давах — Тоглоом",
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ unlock?: string }>;
};

/** «Үе давах» газрын зураг — зөвхөн arrange | match | translate | missing-word. */
export default async function GameLevelsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { unlock } = await searchParams;
  if (!isLevelGame(slug)) notFound();
  return <LevelMap game={slug} unlock={unlock === "1"} />;
}
