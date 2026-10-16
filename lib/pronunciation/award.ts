import { awardPoints } from "@/lib/points/award";
import { pronunciationPoints } from "@/lib/pronunciation/score";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Дуудлагын оноо — «game» эх сурвалж (SQL өөрчлөлт шаардахгүй, дээд 30).
 * ref_id = speak:<текст>:<өдөр> → нэг текстэд өдөрт нэг л удаа оноо.
 * Буцаах: өгөхөөр илгээсэн оноо (0 бол 80%-аас доош).
 */
export function awardPronunciationPoints(targetText: string, percent: number): number {
  const pts = pronunciationPoints(percent);
  if (pts <= 0) return 0;
  const key = targetText.replace(/\s+/g, "").slice(0, 40);
  awardPoints("game", `speak:${key}:${todayKey()}`, pts, {
    kind: "pronunciation",
    label: `🎤 ${targetText.slice(0, 20)}`,
    percent,
  });
  return pts;
}

/**
 * Ролийн яриа дуусгасны оноо — сценар бүрд өдөрт нэг удаа.
 * 10 суурь + алхам бүрд 2 (дээд 30).
 */
export function awardTalkPoints(scenarioId: string, steps: number): number {
  const pts = Math.min(30, 10 + Math.max(0, steps) * 2);
  awardPoints("game", `talk:${scenarioId}:${todayKey()}`, pts, {
    kind: "talk",
    label: `💬 ${scenarioId}`,
    steps,
  });
  return pts;
}
