export type SentenceStructureQuizItem = {
  id: string;
  question: string;
  options: string[];
  answer: string;
};

export const CHINESE_SENTENCE_STRUCTURE_INTRO = {
  title: "Хятад өгүүлбэрийн бүтэц",
  bullets: [
    "主语 (эзэн) — үйлдэгч: «хэн / юу»",
    "谓语 (өгүүлэхүүн) — үйл үг: «яадаг вэ»",
    "宾语 (тусагдахуун) — үйлийн зорилт: «юуг»",
    "定语 (тодотгол) — нэр үгийг тодотгоно, нэр үгийн ӨМНӨ ордог (ихэвчлэн 的-тэй)",
    "状语 (байц) — үйл үгийг тодотгоно (хэзээ / хаана / яаж), үйл үгийн ӨМНӨ ордог",
    "Үндсэн дараалал: 主语 + 状语 + 谓语 + 宾语",
    "Тодотголтой нэр: 定语 + 的 + нэр үг",
  ],
};

export const CHINESE_SENTENCE_STRUCTURE_QUIZ: SentenceStructureQuizItem[] = [
  {
    id: "q1",
    question: "«妻子的微笑» дотор «妻子的» ямар гишүүн вэ?",
    options: ["定语 тодотгол", "谓语"],
    answer: "定语 тодотгол",
  },
  {
    id: "q2",
    question: "Үндсэн зөв дараалал аль нь вэ?",
    options: ["主语 + 谓语 + 宾语", "宾语 + 谓语 + 主语"],
    answer: "主语 + 谓语 + 宾语",
  },
  {
    id: "q3",
    question: "«昨天» (өчигдөр) гэх цаг заасан үг үйл үгийн хаана орох вэ?",
    options: ["өмнө", "хойно"],
    answer: "өмнө",
  },
];

export const SENTENCE_STRUCTURE_GATE_KEY = "buunduu-chinese-sentence-structure-passed";

export function hasPassedSentenceStructureGate(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SENTENCE_STRUCTURE_GATE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSentenceStructureGatePassed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SENTENCE_STRUCTURE_GATE_KEY, "1");
  } catch {
    // ignore
  }
}

export const SVO_ABBREVIATION_HINT =
  "S+V+O (эзэн + үйл үг + тусагдахуун)";
