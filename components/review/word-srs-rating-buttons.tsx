"use client";

import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { WordSrsRating } from "@/lib/srs/word-srs-types";

type Props = {
  disabled?: boolean;
  onRate: (rating: WordSrsRating) => void;
};

export function WordSrsRatingButtons({ disabled, onRate }: Props) {
  const locale = useUiLocale();
  return (
    <div className="bs-srs-rating-row">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("forgot")}
        className="bs-srs-rating-btn bs-srs-rating-forgot"
      >
        {tr(locale, "Мэдэхгүй")}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("hard")}
        className="bs-srs-rating-btn bs-srs-rating-hard"
      >
        {tr(locale, "Эргэлзэж байна")}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("known")}
        className="bs-srs-rating-btn bs-srs-rating-known"
      >
        {tr(locale, "Мэднэ")}
      </button>
    </div>
  );
}
