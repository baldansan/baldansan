/**
 * Балдангийн (Тэмээ багш) хичээл доторх богино үгс.
 * Өнгө: docs/baldan/BALDAN-CHARACTER.md «Ярианы өнгө» — богино, тайван, анхаарлын тэмдэггүй, магтаж хөөрөхгүй.
 * Сонголт нь seed-ээр тогтмол (Math.random биш) — server/client render зөрөхгүй.
 */
const LINES = {
  lessonStart: ["За, эхэлье.", "Бэлэн үү. Явъя.", "Яарах юм алга. Эхэлье."],
  stageDone: ["Болж байна. Дараагийнх.", "Нэг нь дууслаа.", "Ингээд л явна.", "Тийм. Цааш нь."],
  correct: ["Болж байна.", "Тийм. Дараагийнх.", "Зөв.", "Мэдээж."],
  wrong: ["Зүгээр. Дахиад нэг.", "Энийг олон хүн андуурдаг.", "Алдах нь хэвийн."],
  streak: ["Дараалаад зөв. Муугүй.", "Ингээд яваад бай.", "Гар халж байна."],
  vocabWhy: ["Ингэж задалбал мартахгүй.", "Ханз бүр учиртай.", "Хэсгийг нь мэдвэл бүтнийг нь мэднэ."],
  vocabBreak: ["Найман үг боллоо. Амьсгаа ав.", "Түр зогсож болно. Би эндээ л байна."],
  textStart: ["Мөр мөрөөр нь унш. Яарах хэрэггүй.", "Доогуур зураастай үг — шинэ үг. Дарвал утга нь гарна."],
  lessonDone: ["Өнөөдрийнхөө хийлээ. Маргааш уулзъя.", "Дууслаа. Сайн амраарай.", "Нэг хичээл нэмэгдлээ. Болж байна."],
} as const;

export type BaldanMoment = keyof typeof LINES;

export function baldanLine(moment: BaldanMoment, seed: number | string = 0): string {
  const list = LINES[moment];
  let n = 0;
  if (typeof seed === "number") n = Math.abs(Math.trunc(seed));
  else for (let i = 0; i < seed.length; i += 1) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return list[n % list.length]!;
}
