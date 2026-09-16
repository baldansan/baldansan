import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { WeakSpotsClient } from "@/components/review/weak-spots-client";
import { getHelzuiCourse } from "@/lib/helzui/load-course";
import { getHsk30Course } from "@/lib/hsk30-durem/load-course";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Миний сул тал — Бөөндөө Сурцгаая",
};

export default function ReviewWeakSpotsPage() {
  // Дүрмийн цэгийн нэрийг серверт бэлдэж өгнө — том JSON клиент рүү явахгүй.
  const hsk30LevelTitles: Record<string, string> = {};
  for (const level of getHsk30Course().levels) {
    hsk30LevelTitles[level.levelId] = level.title;
  }

  const helzuiModuleTitles: Record<string, string> = {};
  for (const helzuiModule of getHelzuiCourse().modules) {
    helzuiModuleTitles[helzuiModule.id] = helzuiModule.mnTitle;
  }

  return (
    <ReviewSubScreen>
      <WeakSpotsClient
        hsk30LevelTitles={hsk30LevelTitles}
        helzuiModuleTitles={helzuiModuleTitles}
      />
    </ReviewSubScreen>
  );
}
