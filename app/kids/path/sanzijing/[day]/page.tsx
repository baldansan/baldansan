import { notFound } from "next/navigation";
import { KidSanzijingClient, type KidSanzijingLine } from "@/components/kids/kid-sanzijing-client";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { SANZIJING_DAY_LINES, SANZIJING_TOTAL_LINES, sanzijingLineId } from "@/lib/kids/path";
import { getMengxue } from "@/lib/library/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ day: string }> };

export async function generateMetadata({ params }: Props) {
  const { day } = await params;
  return { title: `三字经 · ${day}-р өдөр — Бөөндөө Сурцгаая` };
}

/** /kids/path/sanzijing/[day] — өдрийн 3–4 мөр том үсгээр, пиньинь, дуу, хэллэг, «Дагаж хэл». */
export default async function KidSanzijingPage({ params }: Props) {
  const { day: raw } = await params;
  const day = Number.parseInt(raw, 10);
  const range = SANZIJING_DAY_LINES[day];
  if (!range) notFound();

  const mengxue = await getMengxue();
  const work = mengxue.works.find((w) => w.id === "sanzijing");
  if (!work) notFound();
  const byId = new Map<string, KidSanzijingLine>();
  for (const s of work.sections ?? []) {
    for (const l of s.lines) byId.set(l.id, { id: l.id, zh: l.zh, pinyin: l.pinyin, phrases: l.phrases ?? [] });
  }
  const pick = (from: number, to: number): KidSanzijingLine[] => {
    const out: KidSanzijingLine[] = [];
    for (let n = from; n <= to; n += 1) {
      const l = byId.get(sanzijingLineId(n));
      if (l) out.push({ ...l, n });
    }
    return out;
  };
  const lines = pick(range[0], range[1]);
  if (lines.length === 0) notFound();
  // 7-р өдөр: «бүгдийг уншъя» — 1–20
  const all = day === 7 ? pick(1, SANZIJING_TOTAL_LINES) : [];

  return (
    <MobileAppShell activeTab="home" mainClassName={SHELL_MAIN_NARROW}>
      <KidSanzijingClient day={day} lines={lines} allLines={all} attribution={mengxue.attribution} />
    </MobileAppShell>
  );
}
