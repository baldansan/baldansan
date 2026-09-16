/**
 * «Сурах горим»-ын шууд эргэх холбоо.
 *
 * Суралцагч хариулсан даруйд ЮУ харуулахыг энд бүрдүүлнэ: зөв хариулт,
 * өөрийнх нь хариулт, тайлбар, ямар чадвар шалгаж байгаа, дараа нь юу хийх.
 *
 * ДҮРЭМ — энд агуулга ЗОХИОХГҮЙ:
 * • `explanation` нь зөвхөн өгөгдлийн сангийн `explanation_mn`-аас ирнэ.
 *   Байхгүй бол null — хуурамч тайлбар бичихгүй.
 * • `hint` нь асуултын ТӨРЛӨӨС гарах бодит зөвлөмж (жишээ нь «энэ бол
 *   сонсголын асуулт, аудиогоо дахин сонс») — асуултын агуулгын тухай
 *   таамаг биш.
 */

import { formatCorrectAnswer, formatMockTestAnswer } from "@/lib/mock-test/format-answer";
import { gradeQuestion } from "@/lib/mock-test/scoring";
import {
  skillTagCategory,
  skillTagLabelMn,
  type SkillTagCategory,
} from "@/lib/mock-test/skill-tag-labels";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";

export type PracticeTag = {
  tag: string;
  label: string;
  category: SkillTagCategory;
};

export type PracticeFeedback = {
  /** true / false, эсвэл null — компьютер дүгнэж чадахгүй (бичих даалгавар). */
  isCorrect: boolean | null;
  /** Зөв хариултын харагдах текст. */
  correctText: string;
  /** Суралцагчийн хариултын харагдах текст (хариулаагүй бол null). */
  yourText: string | null;
  /** Зөв хариултын түлхүүр (A/B/C… эсвэл √/×) — сонголтыг будахад. */
  correctKey: string | null;
  /** Өгөгдлийн сангаас ирсэн тайлбар. */
  explanation: string | null;
  /** Асуултын төрлөөс гарах зөвлөмж. */
  hint: string | null;
  tags: PracticeTag[];
  lessonId: string | null;
  /** Аудиогоо дахин сонсох санал болгох эсэх. */
  canReplayAudio: boolean;
};

const MANUAL_TYPES = new Set([
  "essay",
  "summary",
  "picture_sentence",
]);

/** Компьютер шалгаж чадахгүй, суралцагч өөрөө үнэлэх асуулт уу? */
export function isSelfGradedPracticeQuestion(
  question: MockTestQuestionRow
): boolean {
  return question.autograde === "manual" || MANUAL_TYPES.has(question.q_type);
}

function hintForQuestion(
  question: MockTestQuestionRow,
  isCorrect: boolean | null
): string | null {
  if (isCorrect === true) return null;

  if (isSelfGradedPracticeQuestion(question)) {
    return "Энэ даалгаврыг компьютер дүгнэхгүй. Дээрх жишиг хариутай өөрийнхөө бичсэнийг харьцуулж, өөрөө үнэлээрэй.";
  }

  if (question.skill === "listening") {
    return "Сонсголын асуулт. Аудиог дахин тоглуулж, зөв хариултын үгийг сонсоод ол — ингэж давтвал чих дасна.";
  }

  switch (question.q_type) {
    case "order":
      return "Үгийн дараалал: эхлээд өгүүлэгдэхүүн, дараа нь цаг/газар, дараа нь үйл үг гэж эрэмбэлж бод.";
    case "fill_word":
    case "fill_match":
      return "Цоорхойн өмнөх, хойдох үгийг хамтад нь унш — ямар үг таарахыг дүрэм нь заана.";
    case "error_find":
      return "Өгүүлбэр бүрийг үгийн дараалал, тийн ялгал, цагийн үгийн байрлалаар нь шалга.";
    case "judge":
      return "Өгүүлбэр дэх ГОЛ үгийг эх бичвэртэй үг үгээр нь тулгаж үз.";
    case "match":
      return "Түлхүүр үгийг нь ол: хоёр талд давхардаж байгаа үг, сэдэв ихэвчлэн хариултыг заана.";
    default:
      return "Эх бичвэрээс зөв хариултыг батлах хэсгийг олж, бусад сонголт яагаад таарахгүйг нь харьцуул.";
  }
}

export function buildPracticeFeedback(
  question: MockTestQuestionRow,
  userAnswer: string | null,
  selfGrade?: boolean | null
): PracticeFeedback {
  const selfGraded = isSelfGradedPracticeQuestion(question);
  const isCorrect = selfGraded
    ? (selfGrade ?? null)
    : gradeQuestion(question, userAnswer);

  const explanation = question.explanation_mn?.trim()
    ? question.explanation_mn.trim()
    : null;

  const tags = question.tags.map((tag) => ({
    tag,
    label: skillTagLabelMn(tag),
    category: skillTagCategory(tag),
  }));

  return {
    isCorrect,
    correctText: formatCorrectAnswer(question),
    yourText: userAnswer?.trim()
      ? formatMockTestAnswer(question, userAnswer)
      : null,
    correctKey: question.correct_answer?.trim() || null,
    explanation,
    hint: hintForQuestion(question, isCorrect),
    tags,
    lessonId: question.target_lesson_id,
    canReplayAudio: Boolean(question.audio_url),
  };
}
