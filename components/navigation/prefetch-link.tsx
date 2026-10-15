"use client";

import Link from "next/link";
import { useCallback, useState, type ComponentProps } from "react";

type LinkProps = ComponentProps<typeof Link>;

type Props = LinkProps & {
  /**
   * true бол дэлгэцэнд орж ирмэгц шууд бүтэн prefetch (loading boundary хүртэл
   * биш, хуудсыг бүхэлд нь). Цөөн, чухал холбоосуудад л (Үргэлжлүүлэх г.м).
   */
  eager?: boolean;
};

/**
 * Prefetch-тэй холбоос — суралцагчийн гол карт/товчнуудад.
 *
 * Next.js <Link> анхдагчаар дэлгэцэнд орж ирэхэд хэсэгчлэн (loading.tsx хүртэл)
 * prefetch хийдэг. Хэрэглэгч hover / хуруугаа хүргэх / focus хийх мөчид
 * «зорьж байна» гэж үзээд БҮТЭН prefetch (prefetch={true}) руу шилжүүлнэ —
 * дарахад хуудас бэлэн болсон байна. Dynamic route-уудад л хэрэгтэй (static
 * route аль хэдийн бүтнээрээ татагдсан).
 */
export function PrefetchLink({
  eager = false,
  prefetch,
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...rest
}: Props) {
  const [intent, setIntent] = useState(false);

  const warm = useCallback(() => {
    setIntent((prev) => (prev ? prev : true));
  }, []);

  const resolvedPrefetch: LinkProps["prefetch"] =
    prefetch === false ? false : eager || intent ? true : (prefetch ?? null);

  return (
    <Link
      {...rest}
      prefetch={resolvedPrefetch}
      onMouseEnter={(event) => {
        warm();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        warm();
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
    />
  );
}
