import { OrganizationDashboardView } from "@/components/organization/organization-dashboard-view";

export const metadata = {
  title: "Organization dashboard — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationDashboardPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationDashboardView organizationId={organizationId} />;
}
