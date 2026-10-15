import { ClassQuizPlayer } from "@/components/student/class-quiz-player";

export const metadata = {
  title: "Хурдан сорил — Бөөндөө Сурцгаая",
};

type Props = {
  params: Promise<{ quizId: string }>;
};

export default async function ClassQuizPage({ params }: Props) {
  const { quizId } = await params;
  return <ClassQuizPlayer quizId={quizId} />;
}
