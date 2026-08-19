import { DictationGameClient } from "@/components/games/dictation-game-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Диктант — сонсоод бич | Бөөндөө Сурцгаая",
};

export default function DictationGamePage() {
  return <DictationGameClient />;
}
