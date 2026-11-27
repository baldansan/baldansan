/**
 * Олон хоног ороогүй хүнд явуулах сануулгын үгс — Балдангийн (Тэмээ багш) өнгөөр:
 * богино, тайван, анхаарлын тэмдэггүй, зэмлэхгүй (docs/baldan/BALDAN-CHARACTER.md).
 * Өдөр бүр өөр мөр гарна: ороогүй хоногийн тоо + хэрэглэгчийн id-аас сонгоно.
 */
const LINES = [
  "Би эндээ л байна. Таван минут байхад болно.",
  "Үгс чинь мартагдаж эхэлж байна. Одоо давтвал амархан.",
  "Яарах юм алга. Гэхдээ өнөөдөр нэг хичээл хийчих.",
  "Хятад хэл хүлээж чадна. Харин ой санамж хүлээдэггүй.",
  "Өнөөдөр гурван үг. Тэгээд л боллоо.",
  "Чи эхэлсэн. Үргэлжлүүлэх л үлдсэн.",
  "Тэмээ удаан явдаг ч зогсдоггүй. Чи ч бас.",
  "Завгүй байсныг ойлгож байна. Таван минут гаргачих.",
  "Давтах үгс чинь бэлэн байна. Ороод ир.",
  "Нэг ханз бичээд гарсан ч болно. Гол нь тасрахгүй байх.",
  "Өчигдрийн чамаас нэг үгээр илүү болъё.",
  "Хичээл чинь зогссон газраа хүлээж байна.",
] as const;

function hash(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) n = (n * 31 + text.charCodeAt(i)) >>> 0;
  return n;
}

export function inactiveReminderPayload(
  userId: string,
  daysInactive: number | null,
  dayOfYear: number
): { title: string; body: string; url: string } {
  const line = LINES[(hash(userId) + dayOfYear) % LINES.length]!;
  const title =
    daysInactive != null && daysInactive >= 3 ? `Тэмээ багш · ${daysInactive} хоног боллоо` : "Тэмээ багш";
  return { title, body: line, url: "/home" };
}
