import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TrainingCenterBoard } from "@/components/admin/training-center-board";
import { getTrainingCenterOverview } from "@/lib/supabase/admin-training-center";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Сургалтын төв — Удирдлагын хэсэг",
};

type Props = {
  searchParams: Promise<{ org?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AdminTrainingCenterPage({ searchParams }: Props) {
  const organizationId = firstValue((await searchParams).org);
  const overview = await getTrainingCenterOverview({ organizationId });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Сургалтын төв"
        description="Төвийн бүх бүлгийг нэг дэлгэцэнд харьцуулав: багш, HSK түвшин, танхим эсвэл онлайн, сурагчийн тоо, курсын явц, дундаж үнэлгээ, идэвх."
      />
      <TrainingCenterBoard overview={overview} />
    </div>
  );
}
