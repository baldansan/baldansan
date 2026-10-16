import shop from "@/content/talk-scenarios/shop.json";
import restaurant from "@/content/talk-scenarios/restaurant.json";
import hospital from "@/content/talk-scenarios/hospital.json";
import office from "@/content/talk-scenarios/office.json";
import taxi from "@/content/talk-scenarios/taxi.json";
import dorm from "@/content/talk-scenarios/dorm.json";
import teacher from "@/content/talk-scenarios/teacher.json";
import type { TalkNode, TalkScenario } from "@/lib/talk/types";

/** Бүх сценар (дарааллаар: хялбараас хүнд рүү). */
export const TALK_SCENARIOS: TalkScenario[] = [
  shop,
  dorm,
  restaurant,
  taxi,
  hospital,
  office,
  teacher,
] as TalkScenario[];

export function getTalkScenario(id: string | null | undefined): TalkScenario | null {
  if (!id) return null;
  return TALK_SCENARIOS.find((s) => s.id === id) ?? null;
}

export function getTalkNode(scenario: TalkScenario, id: string): TalkNode | null {
  return scenario.nodes.find((n) => n.id === id) ?? null;
}

/** Хичээлийн түвшинд (ж: "HSK1", "hsk2", "HSK5") тохирох сценар санал болгоно. */
export function suggestScenarioForLevel(level: string | null | undefined): TalkScenario {
  const n = Number((level ?? "").replace(/\D/g, "")) || 1;
  const want = n <= 1 ? "HSK1" : n === 2 ? "HSK2" : "HSK3";
  const pool = TALK_SCENARIOS.filter((s) => s.level === want);
  const list = pool.length ? pool : TALK_SCENARIOS;
  // Өдөр бүр өөр сценар
  const day = Math.floor(Date.now() / 86_400_000);
  return list[day % list.length]!;
}

/** Хамгийн ойр сонголтыг (микрофоноор хэлсэн текстэд) олно. */
export function closestOptionIndex(options: { zh: string }[], heard: string): number {
  const cjk = (s: string) => (s.match(/[㐀-鿿]/g) ?? []).join("");
  const h = cjk(heard);
  if (!h) return -1;
  let best = -1;
  let bestScore = 0;
  options.forEach((o, i) => {
    const t = cjk(o.zh);
    if (!t) return;
    const set = new Set(t);
    let overlap = 0;
    for (const ch of h) if (set.has(ch)) overlap++;
    const score = overlap / Math.max(t.length, h.length);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 0.4 ? best : -1;
}
