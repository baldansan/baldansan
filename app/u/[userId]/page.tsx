import { PublicProfileView } from "@/components/social/public-profile-view";

export const metadata = {
  title: "Профайл — Бөөндөө Сурцгаая",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <PublicProfileView targetUserId={userId} />;
}
