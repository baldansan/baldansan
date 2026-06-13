"use client";

import { useState } from "react";
import SpeakButton from "@/components/lesson/SpeakButton";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import type { HskPackageCollocation } from "@/types/hsk-lesson-package";

type Props = {
  collocations: HskPackageCollocation[];
};

export function CollocationsSection({ collocations }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!collocations.length) return null;

  const openItem =
    openIndex != null ? collocations[openIndex] ?? null : null;

  return (
    <div className="bs-collocations">
      <div className="bs-label">
        <span className="bs-dot" />
        词语搭配 · Үг хослол
      </div>
      <ul className="bs-collocations-list">
        {collocations.map((item, index) => (
          <li key={`${item.zh}-${index}`}>
            <button
              type="button"
              className="bs-collocation-chip"
              onClick={() => setOpenIndex(index)}
            >
              <span className="bs-collocation-zh">{item.zh}</span>
              {item.mn ? (
                <span className="bs-collocation-mn-preview">
                  <MnGrammarTermText text={item.mn} />
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {openItem ? (
        <div
          className="bs-collocation-sheet-backdrop"
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="bs-collocation-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="bs-collocation-sheet-zh">{openItem.zh}</p>
            {openItem.mn ? (
              <p className="bs-collocation-sheet-mn">
                <MnGrammarTermText text={openItem.mn} />
              </p>
            ) : null}
            {openItem.usage_mn ? (
              <p className="bs-collocation-sheet-usage">
                <MnGrammarTermText text={openItem.usage_mn} />
              </p>
            ) : null}
            {openItem.example?.zh ? (
              <div className="bs-collocation-example">
                <p className="bs-collocation-example-label">
                  Ийм өгүүлбэрт ихэвчлэн хэрэглэнэ
                </p>
                <p className="bs-collocation-example-zh">{openItem.example.zh}</p>
                {openItem.example.pinyin ? (
                  <p className="bs-collocation-example-py">{openItem.example.pinyin}</p>
                ) : null}
                {openItem.example.mn ? (
                  <p className="bs-collocation-example-mn">
                    <MnGrammarTermText text={openItem.example.mn} />
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="bs-collocation-sheet-actions">
              <SpeakButton text={openItem.zh} large title="Хослолыг сонсох" />
              <button
                type="button"
                className="bs-navbtn"
                onClick={() => setOpenIndex(null)}
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
