import { OrganizationSetupWizardView } from "@/components/organization/organization-setup-wizard-view";

export const metadata = {
  title: "Organization setup wizard — Бөөндөө Сурцгаая",
  description: "Guided B2B pilot onboarding for schools and training centers.",
};

type Props = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationSetupPage({ params }: Props) {
  const { organizationId } = await params;
  return <OrganizationSetupWizardView organizationId={organizationId} />;
}
