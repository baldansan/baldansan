/**
 * Курсын цувралын нэр — HSK бус сурах бичгийн курсууд (发展汉语 г.м.) дээр
 * "HSK4 · 1-р хичээл" гэхийн оронд номын нэрийг харуулна.
 *
 * courseId → { label (хичээлийн толгой/badge), title (курсын хуудас), subtitle, hskLevel }.
 */
export type CourseSeriesMeta = {
  label: string;
  title: string;
  subtitle: string;
  /** Ойролцоо HSK түвшин — үгийн сан, тоглоомын mapping-д. */
  hskLevel: number;
};

const FAZHAN_SERIES: Record<string, CourseSeriesMeta> = {
  "fazhan-chuji1": {
    label: "发展汉语 初级 I",
    title: "发展汉语 · Анхан шат I",
    subtitle: "Developing Chinese 初级综合 I — ≈ HSK1–2, 30 хичээл",
    hskLevel: 2,
  },
  "fazhan-chuji2": {
    label: "发展汉语 初级 II",
    title: "发展汉语 · Анхан шат II",
    subtitle: "Developing Chinese 初级综合 II — ≈ HSK3, 25 хичээл",
    hskLevel: 3,
  },
  "fazhan-zhongji1": {
    label: "发展汉语 中级 I",
    title: "发展汉语 · Дунд шат I",
    subtitle: "Developing Chinese 中级综合 I — ≈ HSK4, 15 хичээл",
    hskLevel: 4,
  },
  "fazhan-zhongji2": {
    label: "发展汉语 中级 II",
    title: "发展汉语 · Дунд шат II",
    subtitle: "Developing Chinese 中级综合 II — ≈ HSK5, 15 хичээл",
    hskLevel: 5,
  },
  "fazhan-gaoji1": {
    label: "发展汉语 高级 I",
    title: "发展汉语 · Ахисан шат I",
    subtitle: "Developing Chinese 高级综合 I — ≈ HSK6, 15 хичээл",
    hskLevel: 6,
  },
  "fazhan-gaoji2": {
    label: "发展汉语 高级 II",
    title: "发展汉语 · Ахисан шат II",
    subtitle: "Developing Chinese 高级综合 II — ≈ HSK6, 15 хичээл",
    hskLevel: 6,
  },
};

export const FAZHAN_COURSE_IDS = Object.keys(FAZHAN_SERIES);

export function courseSeriesMeta(courseId: string | null | undefined): CourseSeriesMeta | null {
  const key = String(courseId ?? "").trim().toLowerCase();
  if (!key) return null;
  return FAZHAN_SERIES[key] ?? null;
}

/** "发展汉语 中级 I" гэх мэт; HSK курс бол null (тэнд HSKn хэвээр). */
export function courseSeriesLabel(courseId: string | null | undefined): string | null {
  return courseSeriesMeta(courseId)?.label ?? null;
}
