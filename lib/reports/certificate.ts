/**
 * What counts as «курс дүүргэсэн», and the check that decides it.
 *
 * A certificate is only worth anything if it can be refused. The rule is
 * therefore fixed here, printed on the certificate itself, and evaluated
 * against rows in the database — never against a judgement call. If any part
 * of the evidence cannot be read, the check comes back "unknown" and the
 * certificate is withheld; it is never issued on an assumption.
 *
 * This is a course-completion record kept by a private learning app. It is not
 * an accreditation, it carries no registry number, and it says nothing about
 * an official HSK examination.
 */

import { gradeFromScore, type LearnerGradeBucket } from "@/lib/learner-grade";

/** Share of the course's published lessons that must be finished. */
export const CERTIFICATE_LESSON_SHARE_REQUIRED = 80;
/** Fewest quiz sittings on the course that count as evidence of learning. */
export const CERTIFICATE_MIN_QUIZ_ATTEMPTS = 3;
/** Lowest mean quiz result that still counts as a pass. */
export const CERTIFICATE_MIN_QUIZ_AVERAGE = 60;

/** Weights of the course mark. Printed next to the grade. */
export const CERTIFICATE_QUIZ_WEIGHT = 0.6;
export const CERTIFICATE_LESSON_WEIGHT = 0.4;

export const CERTIFICATE_CRITERION_TEXT = [
  "Сурагчийн нэр бүртгэлд байх.",
  "Курст нийтлэгдсэн хичээл бүртгэгдсэн байх.",
  `Нийтлэгдсэн хичээлийн дор хаяж ${CERTIFICATE_LESSON_SHARE_REQUIRED}%-ийг «дууссан» төлөвт хүргэсэн байх.`,
  `Тухайн курсын хичээлүүдийн дасгалыг дор хаяж ${CERTIFICATE_MIN_QUIZ_ATTEMPTS} удаа өгсөн, дундаж нь ${CERTIFICATE_MIN_QUIZ_AVERAGE}%-аас доошгүй байх.`,
];

export const CERTIFICATE_SCORE_TEXT = `Дүн = дасгалын дундаж × ${CERTIFICATE_QUIZ_WEIGHT} + хичээл дуусгалт × ${CERTIFICATE_LESSON_WEIGHT}.`;

/**
 * What the certificate is, in the certificate's own words. Printed on every
 * copy so nobody can mistake it for something official.
 */
export const CERTIFICATE_DISCLAIMER =
  "Энэ бол «Бөөндөө Сурцгаая» аппын сургалтын бүртгэлээс гаргасан курс дүүргэлтийн бичиг. Энэ нь улсын болон олон улсын шалгалтын гэрчилгээ биш, HSK-ийн албан ёсны түвшин баталгаажуулсан бичиг биш, ямар нэг магадлан итгэмжлэлийн үнэлгээ илэрхийлэхгүй.";

export type CertificateInput = {
  /** Name as it is recorded; a certificate is never printed with an id. */
  studentName: string | null;
  /** Published lessons in the course. Null when the lesson list is unreadable. */
  courseLessonCount: number | null;
  /** Lessons in this course marked completed. Null when progress is unreadable. */
  completedLessonCount: number | null;
  /** Quiz sittings on this course's lessons. Null when unreadable. */
  quizAttemptCount: number | null;
  /** Mean of those sittings, 0–100. Null when there are none. */
  quizAveragePercent: number | null;
};

export type CertificateRequirementStatus = "met" | "unmet" | "unknown";

export type CertificateRequirement = {
  key: "name" | "course_lessons" | "lesson_share" | "quiz";
  /** The rule. */
  label: string;
  status: CertificateRequirementStatus;
  /** What the data actually shows. */
  detail: string;
};

export type CertificateEvaluation = {
  eligible: boolean;
  requirements: CertificateRequirement[];
  /** Completed share of the published lessons, 0–100. Null when unknown. */
  lessonSharePercent: number | null;
  /** Course mark, 0–100. Null when either input is missing. */
  courseScore: number | null;
  grade: LearnerGradeBucket;
  /** One line per unmet or unknown rule, for the refusal notice. */
  blockers: string[];
};

function sharePercent(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

export function evaluateCertificate(
  input: CertificateInput
): CertificateEvaluation {
  const requirements: CertificateRequirement[] = [];

  const name = input.studentName?.trim() || null;
  requirements.push({
    key: "name",
    label: CERTIFICATE_CRITERION_TEXT[0],
    status: name ? "met" : "unmet",
    detail: name
      ? name
      : "Бүртгэлд сурагчийн нэр алга — нэргүй бичиг олгох боломжгүй.",
  });

  const lessonCount = input.courseLessonCount;
  requirements.push({
    key: "course_lessons",
    label: CERTIFICATE_CRITERION_TEXT[1],
    status:
      lessonCount == null ? "unknown" : lessonCount > 0 ? "met" : "unmet",
    detail:
      lessonCount == null
        ? "Курсын хичээлийн жагсаалт уншигдсангүй."
        : lessonCount > 0
          ? `Нийтлэгдсэн ${lessonCount} хичээл.`
          : "Энэ курст нийтлэгдсэн хичээл алга — дүүргэх зүйл алга.",
  });

  const completed = input.completedLessonCount;
  const lessonSharePercent =
    lessonCount == null || lessonCount <= 0 || completed == null
      ? null
      : sharePercent(Math.min(completed, lessonCount), lessonCount);

  requirements.push({
    key: "lesson_share",
    label: CERTIFICATE_CRITERION_TEXT[2],
    status:
      lessonSharePercent == null
        ? "unknown"
        : lessonSharePercent >= CERTIFICATE_LESSON_SHARE_REQUIRED
          ? "met"
          : "unmet",
    detail:
      completed == null
        ? "Сурагчийн хичээлийн ахиц уншигдсангүй."
        : lessonSharePercent == null
          ? "Хичээлийн тоо тодорхойгүй тул хувь тооцох боломжгүй."
          : `${lessonCount} хичээлийн ${completed} нь дууссан (${lessonSharePercent}%).`,
  });

  const attempts = input.quizAttemptCount;
  const quizAverage = input.quizAveragePercent;
  let quizStatus: CertificateRequirementStatus;
  let quizDetail: string;
  if (attempts == null) {
    quizStatus = "unknown";
    quizDetail = "Дасгалын оноо уншигдсангүй.";
  } else if (attempts < CERTIFICATE_MIN_QUIZ_ATTEMPTS) {
    quizStatus = "unmet";
    quizDetail = `Энэ курсын дасгалыг ${attempts} удаа өгсөн — шаардлага ${CERTIFICATE_MIN_QUIZ_ATTEMPTS}.`;
  } else if (quizAverage == null) {
    quizStatus = "unknown";
    quizDetail = "Дасгалын дундаж тооцогдохгүй байна.";
  } else if (quizAverage < CERTIFICATE_MIN_QUIZ_AVERAGE) {
    quizStatus = "unmet";
    quizDetail = `${attempts} дасгалын дундаж ${quizAverage}% — шаардлага ${CERTIFICATE_MIN_QUIZ_AVERAGE}%.`;
  } else {
    quizStatus = "met";
    quizDetail = `${attempts} дасгалын дундаж ${quizAverage}%.`;
  }

  requirements.push({
    key: "quiz",
    label: CERTIFICATE_CRITERION_TEXT[3],
    status: quizStatus,
    detail: quizDetail,
  });

  const courseScore =
    lessonSharePercent == null || quizAverage == null
      ? null
      : Math.round(
          quizAverage * CERTIFICATE_QUIZ_WEIGHT +
            lessonSharePercent * CERTIFICATE_LESSON_WEIGHT
        );

  const blockers = requirements
    .filter((requirement) => requirement.status !== "met")
    .map((requirement) => requirement.detail);

  return {
    eligible: blockers.length === 0 && courseScore != null,
    requirements,
    lessonSharePercent,
    courseScore,
    grade: courseScore == null ? "unrated" : gradeFromScore(courseScore),
    blockers,
  };
}
