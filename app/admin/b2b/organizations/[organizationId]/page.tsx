import { AdminB2BOrganizationDetail } from "@/components/admin/b2b/admin-b2b-organization-detail";

export const metadata = {
  title: "Байгууллагын дэлгэрэнгүй — B2B",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function AdminB2BOrganizationDetailPage({ params }: Props) {
  const { organizationId } = await params;
  return <AdminB2BOrganizationDetail organizationId={organizationId} />;
}
