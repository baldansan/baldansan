/**
 * The model behind the printable training-centre report.
 *
 * It is the class report one level up: every group compared, every teacher
 * compared, and the grade spread across the centre. All of it is a re-shaping
 * of `getTrainingCenterOverview` — nothing new is measured here, and anything
 * the overview could not compute stays `null` and prints «—».
 */

import {
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_BUCKETS,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
import type {
  TrainingCenterClassRow,
  TrainingCenterOverview,
  TrainingCenterTeacherRow,
  TrainingCenterTotals,
} from "@/lib/supabase/admin-training-center";
import {
  MISSING,
  dateText,
  deliveryModeText,
  mdRow,
  paragraph,
  percentText,
} from "@/lib/reports/format";

/**
 * Printed in the document itself, not only in the UI. A director reading a
 * teacher comparison on paper has to see this next to the numbers.
 */
export const TEACHER_COMPARISON_CAVEAT =
  "Багш хоорондын зөрүү нь заах чадварыг шууд хэмжихгүй. Бүлгийн хүний тоо, хичээлийн хуваарь, сурагчдын эхлэх түвшин, тэр ч байтугай бүлэг хэдэн сартай байгаа нь энэ тоонд адилхан нөлөөлнө. Эдгээр тоог багш үнэлэх шийдвэрийн үндэслэл болгож болохгүй — ярилцлага эхлүүлэх асуулт болгож ашиглана уу.";

export type CenterReport = {
  generatedAt: string;
  centerName: string;
  /** True when the report covers every organization, not one of them. */
  wholeCenter: boolean;
  organizationCount: number;
  unassignedClassroomCount: number;
  activityWindowDays: number;

  totals: TrainingCenterTotals;
  classes: TrainingCenterClassRow[];
  teachers: TrainingCenterTeacherRow[];
  /** Grade spread summed over the groups — see `distributionNote`. */
  distribution: { bucket: LearnerGradeBucket; count: number }[];
  distributionNote: string;

  /** Groups ordered best-scoring first; unrated groups last. */
  rankedClasses: TrainingCenterClassRow[];
  interpretation: string[];
  missingNotes: string[];
  warnings: string[];
};

function sumDistributions(
  rows: { distribution: { bucket: LearnerGradeBucket; count: number }[] }[]
): { bucket: LearnerGradeBucket; count: number }[] {
  const counts = new Map<LearnerGradeBucket, number>();
  for (const row of rows) {
    for (const entry of row.distribution) {
      counts.set(entry.bucket, (counts.get(entry.bucket) ?? 0) + entry.count);
    }
  }
  return LEARNER_GRADE_BUCKETS.map((bucket) => ({
    bucket,
    count: counts.get(bucket) ?? 0,
  }));
}

function bucketCount(
  distribution: { bucket: LearnerGradeBucket; count: number }[],
  buckets: LearnerGradeBucket[]
): number {
  return distribution
    .filter((entry) => buckets.includes(entry.bucket))
    .reduce((sum, entry) => sum + entry.count, 0);
}

function rankClasses(classes: TrainingCenterClassRow[]): TrainingCenterClassRow[] {
  return [...classes].sort((a, b) => {
    if (a.averageScore == null && b.averageScore == null) {
      return a.name.localeCompare(b.name, "mn");
    }
    if (a.averageScore == null) return 1;
    if (b.averageScore == null) return -1;
    return b.averageScore - a.averageScore;
  });
}

export function buildCenterReport(
  overview: TrainingCenterOverview,
  generatedAt: string = new Date().toISOString()
): CenterReport {
  const wholeCenter = overview.selectedOrganizationId == null;
  const centerName =
    overview.selectedOrganizationName ?? "Бүх байгууллага";

  const distribution = sumDistributions(overview.classes);

  const missingNotes: string[] = [];
  if (overview.totals.averageScore == null) {
    missingNotes.push(
      "Төвийн дундаж үнэлгээ «—» — үнэлэхэд хүрэлцэх дүнтэй сурагч алга."
    );
  }
  if (overview.totals.completionRate == null) {
    missingNotes.push(
      "Даалгаврын гүйцэтгэл «—» — оноосон даалгавар, эсвэл апп-д холбогдсон сурагч алга."
    );
  }
  if (overview.totals.activeShare == null) {
    missingNotes.push(
      `Идэвхтэй сурагчийн хувь «—» — сүүлийн ${overview.activityWindowDays} хоногийн хэрэглээ бүртгэгдээгүй байна.`
    );
  }
  if (overview.studyMinutesUnavailable) {
    missingNotes.push(
      "Суралцсан хугацаа огт уншигдаагүй тул бүлгүүдийн «дундаж цаг» багана «—» байна."
    );
  }
  if (overview.unknownOrganization) {
    missingNotes.push(
      "Хаягт заасан байгууллага олдсонгүй — тайлан бүх байгууллагыг хамруулсан."
    );
  }
  if (overview.unassignedClassroomCount > 0) {
    missingNotes.push(
      `${overview.unassignedClassroomCount} бүлэг ямар ч байгууллагад хамаараагүй байна — байгууллагаар шүүхэд эдгээр нь харагдахгүй.`
    );
  }

  const report: CenterReport = {
    generatedAt,
    centerName,
    wholeCenter,
    organizationCount: overview.organizations.length,
    unassignedClassroomCount: overview.unassignedClassroomCount,
    activityWindowDays: overview.activityWindowDays,
    totals: overview.totals,
    classes: overview.classes,
    teachers: overview.teachers,
    distribution,
    distributionNote:
      "Тархалт нь бүлэг бүрийн сурагчдын нийлбэр. Хоёр бүлэгт зэрэг суудаг сурагч хоёр удаа тоологдоно.",
    rankedClasses: rankClasses(overview.classes),
    interpretation: [],
    missingNotes,
    warnings: overview.warnings,
  };

  report.interpretation = buildCenterInterpretation(report);
  return report;
}

/**
 * The «what this means» paragraph for the centre.
 *
 * Same discipline as the class report: each sentence points at a figure in the
 * tables, and when the centre has too little data the paragraph says so rather
 * than producing a comforting summary of nothing.
 */
export function buildCenterInterpretation(report: CenterReport): string[] {
  const sentences: string[] = [];
  const totals = report.totals;

  if (totals.classroomCount === 0) {
    return [
      "Энэ шүүлтэд нэг ч бүлэг алга тул харьцуулах зүйл алга.",
    ];
  }

  sentences.push(
    `Тайлан ${totals.classroomCount} бүлэг, ${totals.teacherCount} багш, жагсаалтын ${totals.studentCount} сурагчийг хамарлаа.`
  );

  if (totals.linkedStudentCount < totals.studentCount) {
    sentences.push(
      `Эдгээрийн ${totals.linkedStudentCount} нь апп-д бүртгэлээ холбосон — үлдсэн ${totals.studentCount - totals.linkedStudentCount} сурагчийн талаар ямар ч хэмжилт алга.`
    );
  }

  if (totals.ratedStudentCount === 0) {
    sentences.push(
      "Нэг ч сурагч үнэлэгдэх хэмжээний дүн бүртгүүлээгүй тул төвийн түвшний талаар дүгнэлт гаргах боломжгүй.",
      "Эхлээд бүлгүүдэд даалгавар оноож, дүн бүртгэгдэж эхэлсний дараа энэ тайлан утга учиртай болно."
    );
    return sentences;
  }

  if (totals.averageScore != null) {
    sentences.push(
      `Үнэлэгдсэн ${totals.ratedStudentCount} сурагчийн дундаж ${totals.averageScore} оноо буюу ${LEARNER_GRADE_LABELS[totals.averageGrade]}.`
    );
  }

  if (totals.completionRate != null) {
    sentences.push(
      `Оноосон даалгаврын ${totals.completionRate}% гүйцэтгэгдсэн байна.`
    );
  }

  if (totals.activeShare != null && totals.activeStudentCount != null) {
    sentences.push(
      `Сүүлийн ${report.activityWindowDays} хоногт холбогдсон сурагчдын ${totals.activeShare}% буюу ${totals.activeStudentCount} нь идэвхтэй байжээ.`
    );
  }

  const rated = report.rankedClasses.filter((row) => row.averageScore != null);
  if (rated.length >= 2) {
    const best = rated[0];
    const worst = rated[rated.length - 1];
    const gap = (best.averageScore ?? 0) - (worst.averageScore ?? 0);
    sentences.push(
      `Үнэлэгдсэн ${rated.length} бүлгийн хамгийн өндөр нь «${best.name}» (${best.averageScore} оноо), хамгийн доод нь «${worst.name}» (${worst.averageScore} оноо) — зөрүү ${gap} оноо.`
    );
    if (gap >= 15) {
      sentences.push(
        "Ийм хэмжээний зөрүү нь ихэвчлэн бүлгүүд өөр үе шатанд явж байгаа, эсвэл сурагчдын эхлэх түвшин өөр байснаас үүсдэг тул шалтгааныг нь бүлэг тус бүрээр тодруулах хэрэгтэй."
      );
    }
  } else if (rated.length === 1) {
    sentences.push(
      `Ганц бүлэг л үнэлэгдсэн байна («${rated[0].name}») тул бүлэг хооронд харьцуулалт хийх боломжгүй.`
    );
  } else {
    sentences.push(
      "Нэг ч бүлэг бүхэлдээ үнэлэгдээгүй тул бүлэг хооронд харьцуулалт хийх боломжгүй."
    );
  }

  const weak = bucketCount(report.distribution, ["D", "F"]);
  const strong = bucketCount(report.distribution, ["A", "B"]);
  const unrated = bucketCount(report.distribution, ["unrated"]);
  sentences.push(
    `Бүлгүүдийн дүнг нийлүүлбэл ${strong} нь A эсвэл B, ${weak} нь D эсвэл F, ${unrated} нь үнэлэхэд эрт байна.`
  );

  if (unrated > strong + weak) {
    sentences.push(
      "Үнэлэгдээгүй сурагч үнэлэгдсэнээс олон байгаа тул дээрх дундаж тоонууд төвийн бодит дүр зургийг бүрэн илэрхийлэхгүй."
    );
  }

  const ratedTeachers = report.teachers.filter((row) => row.averageScore != null);
  if (ratedTeachers.length >= 2) {
    sentences.push(
      `Багш тус бүрийн дундаж ${ratedTeachers.length} багшид тооцогдсон. ${TEACHER_COMPARISON_CAVEAT}`
    );
  }

  return sentences;
}

export function centerInterpretationParagraph(report: CenterReport): string {
  return paragraph(report.interpretation);
}

function gradeCell(
  score: number | null,
  grade: LearnerGradeBucket
): string {
  if (score == null) return MISSING;
  return `${score} — ${LEARNER_GRADE_LABELS[grade]}`;
}

export function buildCenterReportMarkdown(report: CenterReport): string {
  const totals = report.totals;
  const lines: string[] = [
    `# Сургалтын төвийн тайлан — ${report.centerName}`,
    "",
    "Бөөндөө Сурцгаая — сургалтын бүртгэлээс автоматаар гаргав.",
    "",
    `- **Хамрах хүрээ:** ${report.wholeCenter ? "Бүх байгууллага" : report.centerName}`,
    `- **Тайлан гаргасан:** ${dateText(report.generatedAt)}`,
    `- **Идэвхийн хугацаа:** сүүлийн ${report.activityWindowDays} хоног`,
    "",
    "## Төвийн хураангуй",
    "",
    "| Үзүүлэлт | Утга |",
    "|---|---|",
    `| Бүлэг | ${totals.classroomCount} |`,
    `| Багш | ${totals.teacherCount} |`,
    `| Сурагч (жагсаалт) | ${totals.studentCount} |`,
    `| Апп-д холбогдсон сурагч | ${totals.linkedStudentCount} |`,
    `| Үнэлэгдсэн сурагч | ${totals.ratedStudentCount} |`,
    `| Дундаж үнэлгээ | ${gradeCell(totals.averageScore, totals.averageGrade)} |`,
    `| Даалгаврын гүйцэтгэл | ${percentText(totals.completionRate)} |`,
    `| Идэвхтэй сурагчийн хувь | ${percentText(totals.activeShare)} |`,
    "",
    "### Үнэлгээний тархалт",
    "",
    `${report.distributionNote}`,
    "",
    "| Үнэлгээ | Сурагч |",
    "|---|---|",
  ];

  for (const entry of report.distribution) {
    lines.push(mdRow([LEARNER_GRADE_LABELS[entry.bucket], entry.count]));
  }

  lines.push(
    "",
    "## Эдгээр тоо юу хэлж байна вэ",
    "",
    paragraph(report.interpretation),
    "",
    "## Бүлгүүдийн харьцуулалт",
    "",
    "| Бүлэг | Түвшин | Хэлбэр | Багш | Сурагч | Даалгавар | Гүйцэтгэл | Дундаж үнэлгээ | Үнэлэгдсэн |",
    "|---|---|---|---|---|---|---|---|---|"
  );

  for (const row of report.rankedClasses) {
    lines.push(
      mdRow([
        row.name,
        row.levelLabel ?? MISSING,
        deliveryModeText(row.deliveryMode),
        row.teacherLabel,
        `${row.studentCount} (${row.linkedStudentCount})`,
        row.assignmentCount,
        percentText(row.completionRate),
        gradeCell(row.averageScore, row.averageGrade),
        `${row.ratedStudentCount}/${row.linkedStudentCount}`,
      ])
    );
  }

  lines.push(
    "",
    "## Багш нарын харьцуулалт",
    "",
    TEACHER_COMPARISON_CAVEAT,
    "",
    "| Багш | Бүлэг | Сурагч | Үнэлэгдсэн | Дундаж үнэлгээ | Гүйцэтгэл |",
    "|---|---|---|---|---|---|"
  );

  for (const row of report.teachers) {
    lines.push(
      mdRow([
        row.teacherLabel,
        row.classes.length,
        row.studentCount,
        row.ratedStudentCount,
        gradeCell(row.averageScore, row.averageGrade),
        percentText(row.completionRate),
      ])
    );
  }

  const notes = [...report.missingNotes, ...report.warnings];
  if (notes.length > 0) {
    lines.push("", "## Хэмжигдээгүй зүйлс", "");
    for (const note of notes) {
      lines.push(`- ${note}`);
    }
  }

  lines.push(
    "",
    "## Тоонуудын эх сурвалж",
    "",
    "- Бүх тоо сургалтын өгөгдлийн сангаас уншигдсан. Хэмжигдээгүй зүйлийг «—» гэж тэмдэглэв, 0 гэж бичээгүй.",
    "- «Сурагч» баганын хаалтан доторх тоо нь апп-д бүртгэлээ холбосон сурагчдын тоо. Зөвхөн тэдний дүн хэмжигдэнэ.",
    "- Үнэлгээ нь бүлгийн хэмжилт дээр тооцогдоно: сүүлийн дасгал, даалгаврын гүйцэтгэл, сурсан үг.",
    ""
  );

  return lines.join("\n");
}
