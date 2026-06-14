import Link from "next/link";
import { notFound } from "next/navigation";
import { Hsk30PointView } from "@/components/hsk30-durem/hsk30-point-view";
import "@/components/hsk30-durem/hsk30-point.css";
import "@/components/helzui/helzui-course.css";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";
import { getHsk30Point, hsk30LevelHref } from "@/lib/hsk30-durem/load-course";

type Props = {
  params: Promise<{ levelId: string; pointId: string }>;
};

export async function generateStaticParams() {
  const { getHsk30Course } = await import("@/lib/hsk30-durem/load-course");
  const params: Array<{ levelId: string; pointId: string }> = [];
  for (const level of getHsk30Course().levels) {
    for (const point of level.points) {
      params.push({ levelId: level.levelId, pointId: point.id });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props) {
  const { levelId, pointId } = await params;
  const result = getHsk30Point(levelId, pointId);
  if (!result) return { title: "Дүрэм олдсонгүй" };
  return {
    title: `${result.point.zh} — ${result.level.title}`,
  };
}

export default async function ReviewGrammarHsk30PointPage({ params }: Props) {
  const { levelId, pointId } = await params;
  const result = getHsk30Point(levelId, pointId);
  if (!result) notFound();

  const { level, point } = result;
  const index = level.points.findIndex((p) => p.id === pointId);
  const prevPointId = index > 0 ? level.points[index - 1]?.id : null;
  const nextPointId =
    index >= 0 && index < level.points.length - 1
      ? level.points[index + 1]?.id
      : null;

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_REVIEW}>
      <Link
        href={hsk30LevelHref(levelId)}
        className="mb-3 inline-flex text-xs font-bold text-[#1FB85A]"
      >
        ← {level.title}
      </Link>
      <Hsk30PointView
        levelId={levelId}
        levelTitle={level.title}
        point={point}
        pointIndex={index}
        prevPointId={prevPointId}
        nextPointId={nextPointId}
      />
    </MobileAppShell>
  );
}
