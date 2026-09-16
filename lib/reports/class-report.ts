/**
 * The model behind the printable class report.
 *
 * The view renders this; it computes nothing of its own. Everything here comes
 * from `getClassroomProgressAnalytics` / `getClassroomStudentProgress` and the
 * shared grading in `lib/learner-grade`. Where a figure cannot be measured the
 * field is `null` and the view prints «—» with the reason next to it.
 */

import {
  computeClassLearnerScore,
  gradeFromScore,
  summarizeGrades,
  type LearnerGradeBucket,
  type LearnerScore,
} from "@/lib/learner-grade";
import type {
  ClassroomProgressAnalytics,
  StudentProgressRow,
} from "@/lib/teacher/analytics-types";
import {
  MISSING,
  dateText,
  deliveryModeText,
  levelLabelFrom,
  mdRow,
  paragraph,
  percentText,
  periodText,
} from "@/lib/reports/format";
import { LEARNER_GRADE_LABELS } from "@/lib/learner-grade";

/**
 * Class facts the teacher analytics layer does not carry: `Classroom` in
 * `lib/classroom/types` has no delivery mode, schedule or course id even though
 * the `classrooms` row does (migration 054). Read separately, see
 * `lib/reports/class-report-data.ts`.
 */
export type ClassReportMeta = {
  deliveryMode: string | null;
  scheduleNote: string | null;
  courseId: string | null;
  teacherLabel: string | null;
  /** Why a header field is «—». Printed under the header. */
  notes: string[];
};

export const EMPTY_CLASS_REPORT_META: ClassReportMeta = {
  deliveryMode: null,
  scheduleNote: null,
  courseId: null,
  teacherLabel: null,
  notes: [],
};

export type ClassReportStudent = {
  rowId: string;
  name: string;
  /** False for a roster row with no account behind it — nothing is measured. */
  linked: boolean;
  status: string;
  score: LearnerScore;
  grade: LearnerGradeBucket;
  assignmentsAssigned: number;
  assignmentsCompleted: number;
  /** Null when nothing was assigned — a 0% there would be a fabricated figure. */
  completionRate: number | null;
  bestQuizPercent: number | null;
  learnedWords: number | null;
  lastRecordAt: string | null;
};

export type ClassReport = {
  generatedAt: string;
  classroomName: string;
  levelLabel: string | null;
  deliveryLabel: string;
  scheduleNote: string | null;
  teacherLabel: string | null;
  periodLabel: string;
  headerNotes: string[];

  studentCount: number;
  linkedStudentCount: number;
  assignmentCount: number;
  completionRate: number | null;
  averageQuizPercent: number | null;
  averageScore: number | null;
  averageGrade: LearnerGradeBucket;
  ratedStudentCount: number;
  distribution: { bucket: LearnerGradeBucket; count: number }[];

  students: ClassReportStudent[];
  /** Sentences for the «Эдгээр тоо юу хэлж байна вэ» paragraph. */
  interpretation: string[];
  /** Why a summary figure is «—». */
  missingNotes: string[];
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function bucketCount(
  distribution: { bucket: LearnerGradeBucket; count: number }[],
  buckets: LearnerGradeBucket[]
): number {
  return distribution
    .filter((entry) => buckets.includes(entry.bucket))
    .reduce((sum, entry) => sum + entry.count, 0);
}

export function buildClassReport(
  analytics: ClassroomProgressAnalytics,
  rows: StudentProgressRow[],
  meta: ClassReportMeta = EMPTY_CLASS_REPORT_META,
  generatedAt: string = new Date().toISOString()
): ClassReport {
  const classroom = analytics.classroom;
  const assignmentCount = analytics.assignmentsCount;

  const students: ClassReportStudent[] = rows.map((row) => {
    const linked = Boolean(row.studentUserId);
    const completionRate =
      row.assignmentsAssigned > 0 && linked ? row.completionRate : null;

    const score = computeClassLearnerScore({
      quizPercent: row.latestQuizPercentage,
      completionRate: completionRate ?? 0,
      assignmentsAssigned: linked ? row.assignmentsAssigned : 0,
      assignmentsCompleted: row.assignmentsCompleted,
      learnedWords: row.learnedWordsCount,
    });

    return {
      rowId: row.studentRowId,
      name: row.displayName,
      linked,
      status: row.status,
      score,
      grade: score.grade,
      assignmentsAssigned: row.assignmentsAssigned,
      assignmentsCompleted: row.assignmentsCompleted,
      completionRate,
      bestQuizPercent: row.latestQuizPercentage,
      learnedWords: row.learnedWordsCount,
      lastRecordAt: row.lastActivityAt,
    };
  });

  const linkedStudentCount = students.filter((student) => student.linked).length;
  const ratedScores = students
    .map((student) => student.score.total)
    .filter((total): total is number => total != null);
  const averageScore = mean(ratedScores);
  const distribution = summarizeGrades(students.map((student) => student.grade));

  const completionRate =
    assignmentCount > 0 && linkedStudentCount > 0 ? analytics.completionRate : null;

  const missingNotes: string[] = [];
  if (assignmentCount === 0) {
    missingNotes.push(
      "Гүйцэтгэлийн хувь «—» — энэ ангид даалгавар оноогоогүй тул хувааж тооцох зүйл алга."
    );
  } else if (linkedStudentCount === 0) {
    missingNotes.push(
      "Гүйцэтгэлийн хувь «—» — жагсаалтын сурагчдын хэн нь ч апп-д холбогдоогүй тул дүн бүртгэгдэхгүй."
    );
  }
  if (analytics.averageQuizPercentage == null) {
    missingNotes.push(
      "Дасгалын дундаж «—» — дуусгасан даалгаврын дасгалын оноо бүртгэгдээгүй байна."
    );
  }
  if (averageScore == null) {
    missingNotes.push(
      "Дундаж үнэлгээ «—» — үнэлэхэд хүрэлцэх өгөгдөлтэй сурагч алга."
    );
  }
  if (students.some((student) => student.learnedWords == null && student.linked)) {
    missingNotes.push(
      "Зарим сурагчийн сурсан үгийн тоо «—» — багшийн эрхээр тэр мөрийг унших боломжгүй байна."
    );
  }

  const report: ClassReport = {
    generatedAt,
    classroomName: classroom.name,
    levelLabel: levelLabelFrom(meta.courseId, classroom.level),
    deliveryLabel: deliveryModeText(meta.deliveryMode),
    scheduleNote: meta.scheduleNote,
    teacherLabel: meta.teacherLabel,
    periodLabel: periodText(classroom.createdAt ?? null, generatedAt),
    headerNotes: meta.notes,

    studentCount: analytics.totalStudents,
    linkedStudentCount,
    assignmentCount,
    completionRate,
    averageQuizPercent: analytics.averageQuizPercentage,
    averageScore,
    averageGrade: averageScore == null ? "unrated" : gradeFromScore(averageScore),
    ratedStudentCount: ratedScores.length,
    distribution,

    students,
    interpretation: [],
    missingNotes,
  };

  report.interpretation = buildClassInterpretation(report);
  return report;
}

/**
 * The «what this means» paragraph.
 *
 * Every sentence names a figure that is actually in the table above it. When
 * the numbers do not support a conclusion the paragraph says that instead of
 * reaching for one — a report that praises a class it cannot measure is worse
 * than no report.
 */
export function buildClassInterpretation(report: ClassReport): string[] {
  const sentences: string[] = [];

  if (report.studentCount === 0) {
    return [
      "Энэ ангид бүртгэлтэй сурагч алга тул дүгнэх зүйл алга. Сурагч нэмсний дараа тайлан утга учиртай болно.",
    ];
  }

  if (report.linkedStudentCount === 0) {
    sentences.push(
      `Жагсаалтад ${report.studentCount} сурагч байгаа боловч хэн нь ч апп-д бүртгэлээ холбоогүй байна.`,
      "Тиймээс энэ тайланд ямар ч хэмжилт байхгүй — доорх хүснэгтийн бүх багана «—» байгаа нь сурагчид муу сурч байна гэсэн үг биш, огт хэмжигдээгүй гэсэн үг."
    );
    return sentences;
  }

  if (report.assignmentCount === 0) {
    sentences.push(
      `Ангид ${report.linkedStudentCount} сурагч холбогдсон ч одоогоор нэг ч даалгавар оноогоогүй байна.`,
      "Гүйцэтгэл, дасгалын дундаж, үнэлгээ гэсэн үзүүлэлтүүд даалгаврын дүн дээр тооцогддог тул энэ тайлан сурагчдын ахицын талаар дүгнэлт гаргахгүй."
    );
    return sentences;
  }

  if (report.ratedStudentCount === 0) {
    sentences.push(
      `${report.linkedStudentCount} холбогдсон сурагчийн нэг нь ч үнэлэгдэх хэмжээний дүн бүртгүүлээгүй байна.`,
      `Оноосон ${report.assignmentCount} даалгаврын хариу ирээгүй тул энэ тайлангаас ангийн түвшний талаар дүгнэлт гаргах боломжгүй.`
    );
    return sentences;
  }

  sentences.push(
    `Үнэлгээ нийт ${report.studentCount} сурагчийн дундаас ${report.ratedStudentCount} сурагчид тооцогдсон.`
  );
  if (report.ratedStudentCount < report.studentCount) {
    sentences.push(
      `Үлдсэн ${report.studentCount - report.ratedStudentCount} сурагчийн талаар энэ тайлан юу ч хэлэхгүй — тэдний мөрөнд хэмжилт алга.`
    );
  }

  if (report.averageScore != null) {
    sentences.push(
      `Үнэлэгдсэн сурагчдын дундаж ${report.averageScore} оноо буюу ${LEARNER_GRADE_LABELS[report.averageGrade]}.`
    );
  }

  if (report.completionRate != null) {
    const rate = report.completionRate;
    const context =
      rate >= 80
        ? "оноосон ажлын дийлэнх нь хийгдсэн байна"
        : rate >= 50
          ? "оноосон ажлын талаас илүү нь хийгдсэн ч дутуу үлдсэн хэсэг бий"
          : "оноосон ажлын талаас олонх нь хийгдээгүй үлдсэн байна";
    sentences.push(
      `Оноосон ${report.assignmentCount} даалгаврын ${rate}% гүйцэтгэгдсэн — ${context}.`
    );
  }

  if (report.averageQuizPercent != null) {
    sentences.push(
      `Дуусгасан даалгаврын дасгалын дундаж ${report.averageQuizPercent}%.`
    );
  }

  const strong = bucketCount(report.distribution, ["A", "B"]);
  const weak = bucketCount(report.distribution, ["D", "F"]);
  if (strong > 0 || weak > 0) {
    sentences.push(
      `Үнэлэгдсэн ${report.ratedStudentCount} сурагчийн ${strong} нь A эсвэл B, ${weak} нь D эсвэл F үнэлгээтэй байна.`
    );
  }

  const idle = report.students.filter(
    (student) => student.linked && student.assignmentsCompleted === 0
  );
  if (idle.length > 0) {
    const named = idle.slice(0, 5).map((student) => student.name).join(", ");
    sentences.push(
      idle.length <= 5
        ? `Нэг ч даалгавар дуусгаагүй сурагч: ${named}.`
        : `Нэг ч даалгавар дуусгаагүй ${idle.length} сурагч байна, тухайлбал: ${named}.`
    );
  }

  if (report.ratedStudentCount < 3) {
    sentences.push(
      "Үнэлэгдсэн сурагчийн тоо цөөн тул дээрх дундаж тоонууд нэг хоёр сурагчийн дүнгээс хэт хамаарна — ангийн ерөнхий чанарын нотолгоо болгож болохгүй."
    );
  }

  return sentences;
}

/** «Эдгээр тоо юу хэлж байна вэ» as one paragraph. */
export function classInterpretationParagraph(report: ClassReport): string {
  return paragraph(report.interpretation);
}

export function buildClassReportMarkdown(report: ClassReport): string {
  const lines: string[] = [
    `# Ангийн тайлан — ${report.classroomName}`,
    "",
    "Бөөндөө Сурцгаая — сургалтын бүртгэлээс автоматаар гаргав.",
    "",
    `- **Түвшин:** ${report.levelLabel ?? MISSING}`,
    `- **Хичээллэх хэлбэр:** ${report.deliveryLabel}`,
    `- **Хуваарь:** ${report.scheduleNote ?? MISSING}`,
    `- **Багш:** ${report.teacherLabel ?? MISSING}`,
    `- **Хамрах хугацаа:** ${report.periodLabel}`,
    `- **Тайлан гаргасан:** ${dateText(report.generatedAt)}`,
    "",
    "## Ангийн хураангуй",
    "",
    "| Үзүүлэлт | Утга |",
    "|---|---|",
    `| Сурагчийн тоо | ${report.studentCount} (апп-д холбогдсон ${report.linkedStudentCount}) |`,
    `| Оноосон даалгавар | ${report.assignmentCount} |`,
    `| Даалгаврын гүйцэтгэл | ${percentText(report.completionRate)} |`,
    `| Дасгалын дундаж | ${percentText(report.averageQuizPercent)} |`,
    `| Дундаж үнэлгээ | ${
      report.averageScore == null
        ? MISSING
        : `${report.averageScore} оноо — ${LEARNER_GRADE_LABELS[report.averageGrade]}`
    } |`,
    `| Үнэлэгдсэн сурагч | ${report.ratedStudentCount} / ${report.studentCount} |`,
    "",
    "### Үнэлгээний тархалт",
    "",
    "| Үнэлгээ | Сурагч |",
    "|---|---|",
  ];

  for (const entry of report.distribution) {
    lines.push(`| ${LEARNER_GRADE_LABELS[entry.bucket]} | ${entry.count} |`);
  }

  lines.push(
    "",
    "## Эдгээр тоо юу хэлж байна вэ",
    "",
    paragraph(report.interpretation),
    "",
    "## Сурагч бүрээр",
    "",
    "| Сурагч | Үнэлгээ | Оноо | Гүйцэтгэл | Дасгалын дээд оноо | Сурсан үг | Сүүлийн бүртгэл |",
    "|---|---|---|---|---|---|---|"
  );

  for (const student of report.students) {
    lines.push(
      mdRow([
        student.name,
        LEARNER_GRADE_LABELS[student.grade],
        student.score.total == null ? MISSING : String(student.score.total),
        student.completionRate == null
          ? MISSING
          : `${student.assignmentsCompleted}/${student.assignmentsAssigned} (${student.completionRate}%)`,
        percentText(student.bestQuizPercent),
        student.learnedWords == null ? MISSING : String(student.learnedWords),
        dateText(student.lastRecordAt),
      ])
    );
  }

  if (report.missingNotes.length > 0 || report.headerNotes.length > 0) {
    lines.push("", "## Хэмжигдээгүй зүйлс", "");
    for (const note of [...report.headerNotes, ...report.missingNotes]) {
      lines.push(`- ${note}`);
    }
  }

  lines.push(
    "",
    "## Тоонуудын эх сурвалж",
    "",
    "- Бүх тоо сургалтын өгөгдлийн сангаас уншигдсан. Хэмжигдээгүй зүйлийг «—» гэж тэмдэглэв, 0 гэж бичээгүй.",
    "- «Дасгалын дээд оноо» гэдэг нь тухайн сурагчийн даалгаврын дүнгээс хамгийн өндөр нь.",
    "- «Сүүлийн бүртгэл» нь даалгаврын дүн бүртгэгдсэн хамгийн сүүлийн огноо — апп ашигласан бүх үйлдлийг хамрахгүй.",
    "- Үнэлгээ нь ангийн хэмжилт дээр тооцогдоно: сүүлийн дасгал, даалгаврын гүйцэтгэл, сурсан үг. Хэмжилт дутуу сурагч «Үнэлэхэд эрт» гэж үлдэнэ.",
    ""
  );

  return lines.join("\n");
}
