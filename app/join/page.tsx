import { JoinClassClient } from "@/app/join/join-class-client";

export const metadata = { title: "Ангид орох — Бөөндөө Сурцгаая" };

type Props = { searchParams: Promise<{ code?: string }> };

export default async function JoinPage({ searchParams }: Props) {
  const { code } = await searchParams;
  return <JoinClassClient initialCode={code ?? ""} />;
}
