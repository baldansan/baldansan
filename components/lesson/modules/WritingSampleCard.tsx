"use client";
// components/lesson/modules/WritingSampleCard.tsx

import type { HskPackageWritingSample } from "@/types/hsk-lesson-package";

type Props = {
  sample: HskPackageWritingSample;
  sectionTitle?: string;
};

export function WritingSampleCard({ sample, sectionTitle }: Props) {
  const title =
    sample.title_mn?.trim() ||
    sectionTitle?.trim() ||
    "写作 · Загвар эссе";

  return (
    <div className="bs-txt-writing">
      <div className="bs-label" style={{ margin: 0 }}>
        <span className="bs-dot" />
        {title}
      </div>
      <p className="bs-txt-writing-zh hanzi">{sample.zh}</p>
      {sample.pinyin ? (
        <p className="bs-txt-writing-py">{sample.pinyin}</p>
      ) : null}
      {sample.mn ? <p className="bs-txt-writing-mn">{sample.mn}</p> : null}
    </div>
  );
}
