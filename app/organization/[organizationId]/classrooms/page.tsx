import { OrganizationClassroomsPageView } from "@/components/organization/organization-classrooms-page-view";

export const metadata = {
  title: "Organization classrooms — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationClassroomsPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationClassroomsPageView organizationId={organizationId} />;
}
