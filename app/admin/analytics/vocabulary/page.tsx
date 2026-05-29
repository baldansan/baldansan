import { VocabularyInsightsView } from "@/components/admin/vocabulary-insights-view";
import { getVocabularyInsightsOverview } from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vocabulary insights — Admin analytics",
};

type Props = {
  searchParams: Promise<{ lesson?: string }>;
};

export default async function AdminVocabularyInsightsPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const overview = await getVocabularyInsightsOverview();

  return (
    <VocabularyInsightsView
      overview={overview}
      initialLessonFilter={params.lesson}
    />
  );
}
