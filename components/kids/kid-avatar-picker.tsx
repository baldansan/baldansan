"use client";

import { KID_AVATARS } from "@/lib/kids/types";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

type Props = {
  value: string;
  onChange: (avatar: string) => void;
  compact?: boolean;
};

/** ~12 emoji avatar-аас сонгох тор. */
export function KidAvatarPicker({ value, onChange, compact = false }: Props) {
  const locale = useUiLocale();
  return (
    <fieldset>
      <legend className="text-sm font-medium text-[var(--app-text)]">{tr(locale, "Avatar сонгох")}</legend>
      <div className={`mt-1 grid gap-1.5 ${compact ? "grid-cols-12" : "grid-cols-6"}`}>
        {KID_AVATARS.map((emoji) => {
          const active = emoji === value;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              aria-pressed={active}
              aria-label={emoji}
              className={`flex aspect-square items-center justify-center rounded-xl ${
                compact ? "text-xl" : "text-2xl"
              } ${
                active
                  ? "bg-emerald-100 ring-2 ring-emerald-500"
                  : "bg-slate-50 ring-1 ring-slate-200 active:bg-slate-100"
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
