/**
 * Шалгалтын ID-ээс мета гаргана.
 * H41329 → HSK4 (2.0 бүтэц), 2013 он, №29; H11555B → 2015 он, №55 B хувилбар; H40000 → 样卷 (загвар).
 * M32601 → HSK 3.0 (шинэ бүтэц), HSK 3, 2026 оны 全真模拟 №1; M72603 → HSK 7–9 №3.
 */
export type TestIdMeta = {
  level: number;
  year: number | null;
  serial: number | null;
  variant: string | null;
  isSample: boolean;
  standard: "HSK 2.0" | "HSK 3.0";
  /** Жишээ: «Жинхэнэ шалгалт · №1329» — оныг хэрэглэгчид харуулахгүй (хуучин гэж бодуулдаг). */
  label: string;
};

/** HSK 3.0 (шинэ бүтэц) шалгалт мөн үү — ID «M…» (全真模拟) эсвэл «N…» (өөрсдийн загвар). */
export function isHsk30TestId(id: string): boolean {
  return /^(M\d{5}[A-Z]?|N\d-\d+)$/i.test(id.trim());
}

export function describeTestId(id: string): TestIdMeta | null {
  const m30 = /^M(\d)(\d{2})(\d{2})([A-Z]?)$/.exec(id.trim().toUpperCase());
  if (m30) {
    const level = Number(m30[1]);
    const serial = Number(m30[3]);
    return {
      level,
      year: 2000 + Number(m30[2]),
      serial,
      variant: m30[4] || null,
      isSample: false,
      standard: "HSK 3.0",
      label: `HSK 3.0 загвар шалгалт · №${serial}`,
    };
  }
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
  if (meta) return `HSK ${meta.level >= 7 ? "7–9" : meta.level} · ${meta.label}`;
  const cleaned = (title ?? "")
    .replace(/(19|20)\d{2}\s*(оны|онд|он|年)?/g, "")
    .replace(/\s*·\s*·\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s·–-]+|[\s·–-]+$/g, "");
  return cleaned || id;
}
