import {
  formatMongoliaDateTime,
  formatMongoliaDateTimeWithLabel,
  MONGOLIA_TIME_LABEL,
  type MongoliaTimeFormat,
  toIsoDateTimeAttribute,
} from "@/lib/datetime/mongolia-time";

type Props = {
  value: string | number | Date | null | undefined;
  format?: MongoliaTimeFormat;
  /** When true, prefix with "Монгол цаг:" */
  labeled?: boolean;
  className?: string;
};

export function MongoliaTime({
  value,
  format = "datetime",
  labeled = true,
  className,
}: Props) {
  const text = labeled
    ? formatMongoliaDateTimeWithLabel(value, format)
    : formatMongoliaDateTime(value, format);

  if (!text) return null;

  return (
    <time
      dateTime={toIsoDateTimeAttribute(value)}
      className={className}
      title={MONGOLIA_TIME_LABEL}
    >
      {text}
    </time>
  );
}
