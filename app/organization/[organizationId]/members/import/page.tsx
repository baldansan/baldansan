import { OrganizationMembersImportView } from "@/components/organization/organization-members-import-view";

export const metadata = {
  title: "Bulk import — Organization members",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationMembersImportPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationMembersImportView organizationId={organizationId} />;
}
