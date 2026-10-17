"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

export type LibraryPreviewItem = {
  id: string;
  title: string;
  titlePinyin: string;
  cover: string;
  level: number;
};

type Props = {
  items: LibraryPreviewItem[];
};

/** Нүүр хуудсан дээрх "Уншлагын сан" тойм мөр — эхний хэдэн зурагт номыг харуулж, /library руу чиглүүлнэ. */
export function LibraryPreviewRow({ items }: Props) {
  const locale = useUiLocale();
  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <p className="bs-tm-sec">📚 {tr(locale, "Уншлагын сан")}</p>
        <Link href="/library" className="text-[11px] font-bold text-emerald-600">
          {tr(locale, "Бүгдийг харах")} →
        </Link>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/library/books/${item.id}`}
            className="flex w-[104px] shrink-0 flex-col gap-1 rounded-[14px] bg-white p-1.5 shadow-sm ring-1 ring-slate-100 active:bg-slate-50"
          >
            <span
              className="block w-full overflow-hidden rounded-[10px] bg-slate-100"
              style={{ aspectRatio: "3 / 4" }}
            >
              {item.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- small preview thumbnail
                <img
                  src={item.cover}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </span>
            <span className="truncate text-[11px] font-bold leading-tight text-[var(--app-text)]">
              {item.title}
            </span>
            <span className="truncate text-[9px] leading-tight text-[var(--app-muted)]">
              {item.titlePinyin}
            </span>
          </Link>
        ))}
        <Link
          href="/library"
          className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] bg-emerald-50 p-1.5 text-center ring-1 ring-emerald-100 active:bg-emerald-100"
        >
          <span className="text-xl">📚</span>
          <span className="text-[10px] font-bold text-emerald-700">
            {tr(locale, "Бүгдийг харах")}
          </span>
        </Link>
      </div>
    </div>
  );
}
