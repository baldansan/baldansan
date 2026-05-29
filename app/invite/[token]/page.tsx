import { InviteAcceptView } from "@/components/organization/invite-accept-view";

export const metadata = {
  title: "Accept invitation — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InviteAcceptPage({ params }: Props) {
  const { token } = await params;
  return <InviteAcceptView token={token} />;
}
