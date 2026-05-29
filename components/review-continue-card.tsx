"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveContinueLearning } from "@/lib/learner-progress";

type Props = {
  lessonIds: string[];
};

export function ReviewContinueCard({ lessonIds }: Props) {
  const [href, setHref] = useState("/courses/hsk5");
  const [label, setLabel] = useState("Суралцаж эхлэх");

  useEffect(() => {
    void resolveContinueLearning(lessonIds).then((t) => {
      if (t) {
        setHref(t.href);
        setLabel(t.label);
      }
    });
  }, [lessonIds]);

  return (
    <section className="rounded-2xl bg-emerald-600 p-5 text-white sm:p-6">
      <h2 className="text-lg font-semibold">Үргэлжлүүлэх</h2>
      <Link
        href={href}
        className="mt-3 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        {label}
      </Link>
    </section>
  );
}
