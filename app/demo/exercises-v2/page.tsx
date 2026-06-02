import { ExercisesV2DemoClient } from "./exercises-v2-demo-client";

export const metadata = {
  title: "Lesson v2 exercises demo — Бөөндөө Сурцгаая",
  description:
    "Interactive MakeSentence, ListeningQuestion, and VocabCard components driven by lesson v2 JSON.",
};

export default function ExercisesV2DemoPage() {
  return <ExercisesV2DemoClient />;
}
