import { ActivityDetailLoader } from "@/components/admin/activity-detail-loader";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ activityId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { activityId } = await params;
  return { title: `Activity ${activityId} — Admin` };
}

export default async function AdminActivityDetailPage({ params }: Props) {
  const { activityId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Activity detail
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Before/after snapshots and field-level diff preview.
        </p>
      </section>
      <ActivityDetailLoader activityId={activityId} />
    </div>
  );
}
