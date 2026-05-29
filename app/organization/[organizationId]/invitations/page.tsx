import { OrganizationInvitationsView } from "@/components/invitations/organization-invitations-view";

export const metadata = {
  title: "Organization invitations",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationInvitationsPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationInvitationsView organizationId={organizationId} />;
}
