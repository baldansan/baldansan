"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveContinueLearning } from "@/lib/learner-progress";

type Props = {
  lessonIds: string[];
};

export function Hsk5ContinueLearning({ lessonIds }: Props) {
  const [href, setHref] = useState("/lessons/1");
  const [label, setLabel] = useState("Start Lesson 1");

  useEffect(() => {
    async function load() {
      const target = await resolveContinueLearning(lessonIds);
      if (target) {
        setHref(target.href);
        setLabel(target.label);
      }
    }
    void load();
  }, [lessonIds]);

  return (
    <section className="rounded-2xl bg-emerald-600 p-5 text-white sm:p-6">
      <h2 className="text-lg font-semibold">Continue learning</h2>
      <p className="mt-2 text-sm text-emerald-50">
        Дараагийн хичээл рүү шууд орно.
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        {label}
      </Link>
    </section>
  );
}
