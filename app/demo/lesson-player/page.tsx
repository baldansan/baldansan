import { LessonPlayerDemoClient } from "./lesson-player-demo-client";

export const metadata = {
  title: "Lesson player demo — Бөөндөө Сурцгаая",
  description:
    "Schema-driven HSK lesson player (phase 1) using local lesson-01.json — safe test route only.",
};

export default function LessonPlayerDemoPage() {
  return <LessonPlayerDemoClient />;
}
