"use client";

import { useEffect, useState } from "react";
import {
  WordTapSheet,
  type WordTapAnchorRect,
  type WordTapPayload,
} from "@/components/lesson/word-tap-sheet";

const CJK = /[㐀-鿿]/;

function segment(text: string): string[] {
  try {
    const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
    if (!Seg) return [text];
    return [...new Seg("zh", { granularity: "word" }).segment(text)].map((s) => s.segment);
  } catch {
    return [text];
  }
}

/**
 * Хятад бичвэрийн үг бүр дээр дарж утгыг нь харж, «Миний үгс»-д (цээжлэх) нэмэх боломжтой болгоно.
 * Үгээр хуваах нь хөтөч дээр хийгдэнэ (сервер/хөтчийн зөрүүгээс сэргийлж mount-ийн дараа).
 */
export function TapZh({ text }: { text: string }) {
  const [parts, setParts] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<WordTapPayload | null>(null);
  const [anchor, setAnchor] = useState<WordTapAnchorRect | null>(null);

  useEffect(() => {
    setParts(segment(text));
  }, [text]);

  if (!parts) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        CJK.test(part) ? (
          <span
            key={i}
            role="button"
            tabIndex={0}
            className="bs-tap-zh"
            onClick={(event) => {
              const r = event.currentTarget.getBoundingClientRect();
              setAnchor({
                top: r.top,
                left: r.left,
                bottom: r.bottom,
                right: r.right,
                width: r.width,
                height: r.height,
              });
              setPicked({ zh: part });
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
      {picked && anchor ? (
        <WordTapSheet
          word={picked}
          anchor={anchor}
          onClose={() => {
            setPicked(null);
            setAnchor(null);
          }}
        />
      ) : null}
    </>
  );
}
