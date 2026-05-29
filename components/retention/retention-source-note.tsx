import type { RetentionSource } from "@/lib/retention/types";

type Props = {
  source: RetentionSource;
  label: string;
  fallbackWarning?: boolean;
};

export function RetentionSourceNote({
  source,
  label,
  fallbackWarning = false,
}: Props) {
  return (
    <p
      className={`text-xs ${
        fallbackWarning ? "text-amber-700" : "text-slate-500"
      }`}
    >
      {fallbackWarning
        ? "Account руу хадгалахад алдаа гарлаа — одоогоор энэ төхөөрөмж дээрх өгөгдөл харагдаж байна."
        : label}
      {!fallbackWarning && source === "account" ? " · Account" : null}
      {!fallbackWarning && source === "local" ? " · Local" : null}
    </p>
  );
}
