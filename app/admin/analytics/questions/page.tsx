import { QuestionInsightsView } from "@/components/admin/question-insights-view";
import { getQuestionInsightsOverview } from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Question insights — Admin analytics",
};

type Props = {
  searchParams: Promise<{ lesson?: string }>;
};

export default async function AdminQuestionInsightsPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const overview = await getQuestionInsightsOverview();

  return (
    <QuestionInsightsView
      overview={overview}
      initialLessonFilter={params.lesson}
    />
  );
}
