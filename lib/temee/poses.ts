/**
 * Тэмээ багшийн зургууд (v2) — нэг загвар, тунгалаг дэвсгэр.
 * `sm` (192px) — дугуй дүрс, жижиг хэрэглээнд; `lg` (512px) — том зураг.
 */
export type TemeePose =
  | "wave"
  | "teach"
  | "think"
  | "thumbsup"
  | "point"
  | "celebrate"
  | "encourage"
  | "wow"
  | "sleep"
  | "read"
  | "listen"
  | "write"
  | "welcome"
  | "lost"
  | "offline"
  | "empty"
  | "relax"
  | "play"
  | "goal"
  | "trophy";

export function temeePoseSrc(pose: TemeePose, size: "sm" | "lg" = "sm"): string {
  return `/temee/v2/${pose}${size === "sm" ? "-sm" : ""}.webp`;
}
