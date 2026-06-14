import Image from "next/image";
import { TEMEE_ASSETS, type TemeeAssetKey } from "@/lib/temee/assets";

type Props = {
  variant: TemeeAssetKey;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function TemeeImage({
  variant,
  alt = "Тэмээ багш",
  className,
  width = 86,
  height = 86,
  priority = false,
}: Props) {
  return (
    <Image
      src={TEMEE_ASSETS[variant]}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
