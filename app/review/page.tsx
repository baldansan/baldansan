import { ReviewMenuHubClient } from "@/components/review/review-menu-hub-client";
import { getHelzuiCourse } from "@/lib/helzui/load-course";
import { getHsk30Course } from "@/lib/hsk30-durem/load-course";
import { fetchMockTests } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Давтах — Бөөндөө Сурцгаая",
};

export default async function ReviewPage() {
  const [tests, helzui, hsk30] = await Promise.all([
    fetchMockTests(),
    Promise.resolve(getHelzuiCourse()),
    Promise.resolve(getHsk30Course()),
  ]);

  const hsk30PointCount = hsk30.levels.reduce(
    (sum, level) => sum + level.points.length,
    0
  );

  return (
    <ReviewMenuHubClient
      testCount={tests.length}
      helzuiModuleCount={helzui.modules.length}
      hsk30LevelCount={hsk30.levels.length}
      hsk30PointCount={hsk30PointCount}
    />
  );
}
