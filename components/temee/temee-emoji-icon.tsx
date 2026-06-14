import {
  resolveTemeeEmojiVariant,
  TEMEE_EMOJI_CONFIG,
  type TemeeEmojiVariant,
} from "@/lib/temee/emoji-icons";
import type { TemeeAssetKey } from "@/lib/temee/assets";

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
  const fontSize = Math.round(Math.min(width, h) * emojiScale);

  return (
    <span
      className={`bs-tm-emoji-icon ${className ?? ""}`.trim()}
      style={{
        width,
        height: h,
        background: config.gradient,
        boxShadow: config.shadow,
        fontSize,
      }}
      aria-hidden
    >
      {config.emoji}
    </span>
  );
}
