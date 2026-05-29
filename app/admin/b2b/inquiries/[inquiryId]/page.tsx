import { AdminB2BInquiryDetail } from "@/components/admin/b2b/admin-b2b-inquiry-detail";

export const metadata = {
  title: "Inquiry detail — Admin B2B",
};

type Props = {
  params: Promise<{ inquiryId: string }>;
};

export default async function AdminB2BInquiryDetailPage({ params }: Props) {
  const { inquiryId } = await params;
  return <AdminB2BInquiryDetail inquiryId={inquiryId} />;
}
