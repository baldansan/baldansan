import { temeePoseSrc, type TemeePose } from "@/lib/temee/poses";
import "./lesson-fresh.css";

/** Балдан (Тэмээ багш) жижиг зураг + нэг мөр үг. Бичвэрийг `baldanLine()`-аас авна. */
export function BaldanSay({
  pose,
  text,
  center = false,
}: {
  pose: TemeePose;
  text: string;
  center?: boolean;
}) {
  return (
    <div className="bs-baldan-row" style={center ? { justifyContent: "center" } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
      <img src={temeePoseSrc(pose, "sm")} alt="" className="bs-baldan-row-img" loading="lazy" decoding="async" draggable={false} />
      <p className="bs-baldan-say">{text}</p>
    </div>
  );
}
