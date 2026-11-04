import { KidsPinyinClient } from "@/components/kids/kids-pinyin-client";
import { getPinyinChart } from "@/lib/pronunciation/data";
import { pinyinPathCells, type PinyinAudioMap } from "@/lib/kids/pinyin-path";

export const metadata = { title: "Дуудлагын суурь — хүүхдийн пиньинь | Бөөндөө Сурцгаая" };

/** Хүүхдийн пиньинь зам: эгшиг → гийгүүлэгч → 4 аялгуу → bo po mo fo дуу → сонсоод ол. */
export default async function KidsPinyinPage() {
  const chart = await getPinyinChart();
  const audio: PinyinAudioMap = {};
  for (const cell of pinyinPathCells()) {
    const c = chart.cells[cell];
    if (c) audio[cell] = c.tones as PinyinAudioMap[string];
  }
  return <KidsPinyinClient audio={audio} />;
}
