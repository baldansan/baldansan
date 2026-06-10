import type { WordSrsRating } from "@/lib/srs/word-srs-types";

type Props = {
  disabled?: boolean;
  onRate: (rating: WordSrsRating) => void;
};

export function WordSrsRatingButtons({ disabled, onRate }: Props) {
  return (
    <div className="bs-srs-rating-row">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("forgot")}
        className="bs-srs-rating-btn bs-srs-rating-forgot"
      >
        Мартсан
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("hard")}
        className="bs-srs-rating-btn bs-srs-rating-hard"
      >
        Эргэлзсэн
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("known")}
        className="bs-srs-rating-btn bs-srs-rating-known"
      >
        Мэдсэн
      </button>
    </div>
  );
}
