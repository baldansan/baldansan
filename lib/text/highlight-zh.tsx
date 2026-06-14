import type { ReactNode } from "react";

const ZH_SEGMENT = /([一-鿿，。？！…、]+)/g;

/** Wrap Chinese segments in `.zh` spans (prototype hl()). */
export function highlightZh(text: string): ReactNode {
  const parts = text.split(ZH_SEGMENT).filter((part) => part.length > 0);
  return parts.map((part, index) =>
    /[一-鿿]/.test(part) ? (
      <span className="zh" key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}
