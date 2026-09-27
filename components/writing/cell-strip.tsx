"use client";

/**
 * Дэвтрийн мөрийн нүднүүд: дагаж бичих нүд (дуусвал цайвар ногоон) +
 * санаж бичих нүд (дуусвал ногоон). Дуусаагүй нүд тасархай хүрээтэй.
 */
import type { WritingCharProgress, WritingList } from "@/lib/writing/types";

type Props = {
  ch: string;
  list: Pick<WritingList, "repsTrace" | "repsMemory">;
  progress: WritingCharProgress | undefined;
};

export function CellStrip({ ch, list, progress }: Props) {
  const traceDone = Math.min(progress?.traceDone ?? 0, list.repsTrace);
  const memoryDone = Math.min(progress?.memoryDone ?? 0, list.repsMemory);
  return (
    <div className="wn-cells" translate="no" aria-hidden>
      {Array.from({ length: list.repsTrace }, (_, i) => (
        <span key={`t${i}`} className={`wn-cell ${i < traceDone ? "is-trace" : ""}`}>
          {ch}
        </span>
      ))}
      <span className="wn-cell-sep" />
      {Array.from({ length: list.repsMemory }, (_, i) => (
        <span
          key={`m${i}`}
          className={`wn-cell ${i < memoryDone ? "is-memory" : "is-memory-todo"}`}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
