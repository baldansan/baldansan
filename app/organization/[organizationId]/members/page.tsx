import { OrganizationMembersView } from "@/components/organization/organization-members-view";

export const metadata = {
  title: "Organization members — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationMembersPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationMembersView organizationId={organizationId} />;
}
