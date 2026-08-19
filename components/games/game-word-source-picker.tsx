"use client";

import {
  GAME_WORD_SOURCE_OPTIONS,
  type GameWordSource,
} from "@/lib/games/game-word-pool";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  value: GameWordSource;
  onChange: (source: GameWordSource) => void;
  isLoggedIn: boolean;
  poolNote?: string | null;
};

export function GameWordSourcePicker({
  value,
  onChange,
  isLoggedIn,
  poolNote,
}: Props) {
  const locale = useUiLocale();
  return (
    <div className="bs-game-source">
      <h2 className="bs-mem-step-title">{tr(locale, "Юугаар тоглох вэ?")}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {GAME_WORD_SOURCE_OPTIONS.map((opt) => {
          const disabled = opt.requiresAuth && !isLoggedIn;
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`bs-game-source-opt${active ? " bs-game-source-opt--on" : ""}${disabled ? " bs-game-source-opt--off" : ""}`}
            >
              <span className="bs-game-source-emoji" aria-hidden>
                {opt.emoji}
              </span>
              <span className="bs-game-source-body">
                <span className="bs-game-source-title">
                  {tr(locale, opt.title)}
                </span>
                <span className="bs-game-source-desc">
                  {tr(locale, disabled ? "Нэвтэрсний дараа идэвхжинэ" : opt.desc)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {poolNote ? (
        <p className="mt-3 text-xs font-semibold text-amber-700">
          {tr(locale, poolNote)}
        </p>
      ) : null}
    </div>
  );
}
