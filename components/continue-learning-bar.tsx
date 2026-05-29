"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveContinueLearning } from "@/lib/learner-progress";
import { hasAnyProgress } from "@/lib/progress";

type Props = {
  lessonIds?: string[];
};

export function ContinueLearningBar({ lessonIds = ["1", "2", "3"] }: Props) {
  const [visible, setVisible] = useState(false);
  const [href, setHref] = useState("/courses/hsk5");
  const [label, setLabel] = useState("Continue");

  useEffect(() => {
    if (!hasAnyProgress()) {
      setVisible(false);
      return;
    }

    async function load() {
      const target = await resolveContinueLearning(lessonIds);
      if (target) {
        setHref(target.href);
        setLabel(target.label);
        setVisible(true);
      }
    }

    void load();
  }, [lessonIds]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 px-4 md:hidden">
      <Link
        href={href}
        className="mx-auto flex max-w-md items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-emerald-500"
      >
        <span>{label}</span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
