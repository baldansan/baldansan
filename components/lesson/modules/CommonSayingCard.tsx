"use client";
// components/lesson/modules/CommonSayingCard.tsx
// 俗语 — texts.json commonSaying (WritingSampleCard-ийн загвараар).

import type { HskCommonSaying } from "@/types/hsk-lesson-package";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";

export function CommonSayingCard({ saying }: { saying: HskCommonSaying }) {
  return (
    <div className="bs-txt-writing">
      <div translate="no" className="bs-label" style={{ margin: 0 }}>
        <span className="bs-dot" />
        💬 Үг хэллэг (俗语)
      </div>
      <p className="bs-txt-writing-zh hanzi">{saying.zh}</p>
      {saying.pinyin ? <p className="bs-txt-writing-py">{saying.pinyin}</p> : null}
      {saying.en ? <p className="bs-txt-writing-py">{saying.en}</p> : null}
      {saying.meaning_mn ? (
        <p className="bs-txt-writing-mn">
          <MnGrammarTermText text={saying.meaning_mn} />
        </p>
      ) : null}
      {saying.usage_mn ? (
        <p className="bs-txt-writing-mn">
          <MnGrammarTermText text={saying.usage_mn} />
        </p>
      ) : null}
      {saying.example ? (
        <div className="bs-txt-saying-ex">
          <p className="bs-txt-saying-ex-zh hanzi">{saying.example.zh}</p>
          {saying.example.pinyin ? (
            <p className="bs-txt-writing-py">{saying.example.pinyin}</p>
          ) : null}
          {saying.example.mn ? (
            <p className="bs-txt-writing-mn">{saying.example.mn}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
