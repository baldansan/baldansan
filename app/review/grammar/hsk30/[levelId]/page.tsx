import { notFound } from "next/navigation";
import { Hsk30LevelView } from "@/components/hsk30-durem/hsk30-level-view";
import "@/components/helzui/helzui-course.css";
import { getHsk30Level } from "@/lib/hsk30-durem/load-course";

type Props = {
  params: Promise<{ levelId: string }>;
};

export async function generateStaticParams() {
  const { getHsk30Course } = await import("@/lib/hsk30-durem/load-course");
  return getHsk30Course().levels.map((level) => ({
    levelId: level.levelId,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { levelId } = await params;
  const level = getHsk30Level(levelId);
  if (!level) return { title: "Түвшин олдсонгүй" };
  return { title: `${level.title} — HSK 3.0 дүрэм` };
}

export default async function ReviewGrammarHsk30LevelPage({ params }: Props) {
  const { levelId } = await params;
  const level = getHsk30Level(levelId);
  if (!level) notFound();
  return <Hsk30LevelView level={level} />;
}
