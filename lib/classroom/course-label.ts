/** Курсын ID-г багшид ойлгомжтой номын нэр болгоно (DB дэх title нь заримдаа зүгээр ID байдаг). */

const FAZHAN_LEVEL: Record<string, string> = {
  chuji: "Анхан шат (初级)",
  zhongji: "Дунд шат (中级)",
  gaoji: "Ахисан шат (高级)",
};

export function prettyCourseTitle(courseId: string, title?: string | null): string {
  const id = courseId.toLowerCase();
  let m = id.match(/^hsk(\d)$/);
  if (m) return `HSK ${m[1]}`;
  m = id.match(/^yct-?(\d)$/);
  if (m) return `YCT ${m[1]}`;
  m = id.match(/^fazhan-([a-z]+)(\d)$/);
  if (m) return `Fazhan · ${FAZHAN_LEVEL[m[1]] ?? m[1]} ${m[2]}`;
  return title?.trim() || courseId;
}

export type CourseShelf = { key: string; label: string; hint: string; order: number };

export function courseShelf(courseId: string): CourseShelf {
  const id = courseId.toLowerCase();
  if (/^hsk\d/.test(id))
    return { key: "hsk", label: "HSK — стандарт курс", hint: "HSK 1–6, том хүн болон ахлах ангийнханд", order: 0 };
  if (/^yct/.test(id))
    return { key: "yct", label: "YCT — хүүхдийн курс", hint: "Бага ангийн сурагчдад зориулсан", order: 1 };
  if (/^fazhan/.test(id))
    return { key: "fazhan", label: "Fazhan (发展汉语)", hint: "Их сургуулийн бэлтгэлийн сурах бичиг", order: 2 };
  return { key: "other", label: "Нэмэлт хичээлүүд", hint: "Дүрэм, хэлц, суурь мэдлэг", order: 3 };
}

/** Номын эрэмбэ: HSK1…6, YCT1…6, Fazhan анхан→ахисан. */
export function courseSortKey(courseId: string): string {
  const id = courseId.toLowerCase();
  const level = id.includes("chuji") ? "1" : id.includes("zhongji") ? "2" : id.includes("gaoji") ? "3" : "0";
  return `${courseShelf(courseId).order}-${level}-${id}`;
}
