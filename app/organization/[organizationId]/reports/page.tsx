import { OrganizationReportsView } from "@/components/organization/organization-reports-view";

export const metadata = {
  title: "Organization reports — Бөөндөө Сурцгаая",
  description: "School admin reporting, class metrics, and export.",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationReportsPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationReportsView organizationId={organizationId} />;
}
