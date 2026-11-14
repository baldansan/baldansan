import {
  resolveTemeeEmojiVariant,
  TEMEE_EMOJI_CONFIG,
  type TemeeEmojiVariant,
} from "@/lib/temee/emoji-icons";
import type { TemeeAssetKey } from "@/lib/temee/assets";
import { temeePoseSrc } from "@/lib/temee/poses";

type Props = {
  variant: TemeeEmojiVariant | TemeeAssetKey;
  className?: string;
  width?: number;
  height?: number;
  /** Override emoji size relative to circle (0–1). */
  emojiScale?: number;
};

export function TemeeEmojiIcon({
  variant,
  className,
  width = 86,
  height,
  emojiScale = 0.46,
}: Props) {
  const resolved = resolveTemeeEmojiVariant(variant);
  const config = TEMEE_EMOJI_CONFIG[resolved];
  const h = height ?? width;
  void emojiScale; // хуучин эможи хэмжээний тохиргоо — зурагт хэрэггүй, API-г эвдэхгүйн тулд үлдээв

  return (
    <span
      className={`bs-tm-emoji-icon ${className ?? ""}`.trim()}
      style={{
        width,
        height: h,
        background: config.gradient,
        boxShadow: config.shadow,
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={temeePoseSrc(config.pose, Math.max(width, h) > 110 ? "lg" : "sm")}
        alt=""
        className="bs-tm-emoji-icon-img"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
