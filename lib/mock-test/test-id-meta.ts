/**
 * 真题 ID-ээс мета гаргана: H41329 → HSK4, 2013 он, №29; H11555B → 2015 он, №55 B хувилбар; H40000 → 样卷 (загвар).
 * Бүх энэ шалгалт нь одоогийн 6 түвшний HSK (2.0 бүтэц). HSK 3.0 (9 түвшин)-ийн 真题 хараахан нийтлэгдээгүй.
 */
export type TestIdMeta = {
  level: number;
  year: number | null;
  serial: number | null;
  variant: string | null;
  isSample: boolean;
  standard: "HSK 2.0";
  /** Жишээ: «Жинхэнэ шалгалт · №1329» — оныг хэрэглэгчид харуулахгүй (хуучин гэж бодуулдаг). */
  label: string;
};

export function describeTestId(id: string): TestIdMeta | null {
  const m = /^H(\d)(\d{2})(\d{2})([A-Z]?)$/.exec(id.trim().toUpperCase());
  if (!m) return null;
  const level = Number(m[1]);
  const yy = Number(m[2]);
  const serial = Number(m[3]);
  const variant = m[4] || null;
  const isSample = yy === 0 && serial === 0;
  const year = isSample ? null : 2000 + yy;
  const label = isSample
    ? "Албан загвар шалгалт (样卷)"
    : `Жинхэнэ шалгалт · №${m[2]}${m[3]}${variant ? ` ${variant}` : ""}`;
  return { level, year, serial: isSample ? null : serial, variant, isSample, standard: "HSK 2.0", label };
}

/** Хэрэглэгчид харуулах шалгалтын нэр: оныг хэзээ ч харуулахгүй. */
export function displayTestTitle(id: string, title?: string | null): string {
  const meta = describeTestId(id);
  if (meta) return `HSK ${meta.level} · ${meta.label}`;
  const cleaned = (title ?? "")
    .replace(/(19|20)\d{2}\s*(оны|онд|он|年)?/g, "")
    .replace(/\s*·\s*·\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s·–-]+|[\s·–-]+$/g, "");
  return cleaned || id;
}
