import { RoomView } from "@/components/social/room-view";

export const metadata = {
  title: "Чат өрөө — Бөөндөө Сурцгаая",
};

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomView roomId={roomId} />;
}
