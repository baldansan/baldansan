import { OrganizationDashboardPageView } from "@/components/organization/organization-dashboard-page-view";

export const metadata = {
  title: "Пилотын бэлэн байдал — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationPilotReadinessPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationDashboardPageView organizationId={organizationId} />;
}
