import Link from "next/link";
import { BRAND_NAME_EN, BRAND_NAME_MN } from "@/lib/brand";

type Props = {
  className?: string;
};

export function BrandLogo({ className }: Props) {
  return (
    <Link
      href="/"
      className={className ?? "text-sm sm:text-base"}
    >
      <span className="block font-semibold tracking-tight text-slate-900">
        {BRAND_NAME_MN}
      </span>
      <span className="block text-[10px] font-medium text-slate-500 sm:text-xs">
        {BRAND_NAME_EN}
      </span>
    </Link>
  );
}
