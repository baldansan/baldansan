import { HomeAppView } from "@/components/mobile/home-app-view";
import { loadMobileHomeData } from "@/lib/mobile-home-data";

export const revalidate = 120;

export const metadata = {
  title: "Нүүр — Бөөндөө Сурцгаая",
  description: "Хятад хэл сурах апп — үргэлжлүүлэх, курс, хичээлийн зам.",
};

export default async function HomeAppPage() {
  const { catalog, defaultChipId } = await loadMobileHomeData();

  return (
    <HomeAppView catalog={catalog} defaultChipId={defaultChipId} />
  );
}
