import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import type { TemeeAssetKey } from "@/lib/temee/assets";
import type { TemeeEmojiVariant } from "@/lib/temee/emoji-icons";

type Props = {
  variant: TemeeEmojiVariant | TemeeAssetKey;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

/** @deprecated Use TemeeEmojiIcon — renders emoji circle instead of PNG. */
export function TemeeImage({
  variant,
  className,
  width = 86,
  height = 86,
}: Props) {
  return (
    <TemeeEmojiIcon
      variant={variant}
      className={className}
      width={width}
      height={height}
    />
  );
}
