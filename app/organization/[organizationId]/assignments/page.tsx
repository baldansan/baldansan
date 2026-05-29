import { OrganizationAssignmentsPageView } from "@/components/organization/organization-assignments-page-view";

export const metadata = {
  title: "Organization assignments — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationAssignmentsPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationAssignmentsPageView organizationId={organizationId} />;
}
