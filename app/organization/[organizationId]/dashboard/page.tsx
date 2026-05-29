import { OrganizationDashboardPageView } from "@/components/organization/organization-dashboard-page-view";

export const metadata = {
  title: "Pilot dashboard — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationPilotDashboardPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationDashboardPageView organizationId={organizationId} />;
}
