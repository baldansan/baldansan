"use client";

import { useRouter } from "next/navigation";
import LessonPlayer from "@/components/lesson/LessonPlayer";
import lesson01 from "@/data/lesson-01.json";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";

export function LessonPlayerDemoClient() {
  const router = useRouter();

  return (
    <LessonPlayer
      lesson={lesson01 as HskLessonPackage}
      onExit={() => router.push("/demo")}
    />
  );
}
