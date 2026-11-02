import { HomeAppView } from "@/components/mobile/home-app-view";
import { loadMobileHomeData } from "@/lib/mobile-home-data";
import { helzuiHomeSummary } from "@/lib/helzui/home-summary";

export const revalidate = 120;

export const metadata = {
  title: "Нүүр — Бөөндөө Сурцгаая",
  description: "Хятад хэл сурах апп — үргэлжлүүлэх, курс, хичээлийн зам.",
};

export default async function HomeAppPage() {
  const {
    catalog,
    defaultChipId,
    fazhanCatalog,
    fazhanDefaultChipId,
    yctCatalog,
    libraryPreview,
    bichlegSuggestion,
  } = await loadMobileHomeData();

  return (
    <HomeAppView
      catalog={catalog}
      defaultChipId={defaultChipId}
      fazhanCatalog={fazhanCatalog}
      fazhanDefaultChipId={fazhanDefaultChipId}
      yctCatalog={yctCatalog}
      libraryPreview={libraryPreview}
      helzuiSummary={helzuiHomeSummary()}
      bichlegSuggestion={bichlegSuggestion}
    />
  );
}
