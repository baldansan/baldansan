"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

/**
 * Андуурч болзошгүй ханзнууд — нэг дуу заагч хэсэгтэй, өөр язгууртай
 * гэр бүл (清·请·情·晴). Өгөгдөл: public/data/hsk_confusables.json
 * (scripts/build_confusables.py-ээр үүсдэг), зөвхөн панел нээгдэхэд татна.
 */

type ConfusableEntry = {
  c: string;
  p: string;
  m: string;
  r: string;
  rm: string;
};

type ConfusableFamily = {
  /** Хуваалцдаг (дуу заагч) хэсэг */
  k: string;
  km: string;
  list: ConfusableEntry[];
};

type ConfusableMap = Record<string, ConfusableFamily>;

let cache: Promise<ConfusableMap> | null = null;

function loadConfusables(): Promise<ConfusableMap> {
  if (!cache) {
    cache = fetch("/data/hsk_confusables.json")
      .then((res) => (res.ok ? (res.json() as Promise<ConfusableMap>) : {}))
      .catch(() => ({}) as ConfusableMap);
  }
  return cache;
}

type Props = {
  /** Үг эсвэл ганц ханз — ханз бүрийн гэр бүлийг харуулна */
  text: string;
  className?: string;
};

export function ConfusableChars({ text, className }: Props) {
  const locale = useUiLocale();
  const [families, setFamilies] = useState<
    { char: string; family: ConfusableFamily }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    void loadConfusables().then((map) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const result: { char: string; family: ConfusableFamily }[] = [];
      for (const char of text) {
        if (seen.has(char)) continue;
        seen.add(char);
        const family = map[char];
        if (family && family.list.length > 0) {
          result.push({ char, family });
        }
      }
      setFamilies(result);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (families.length === 0) return null;

  return (
    <div className={className}>
      {families.map(({ char, family }) => (
        <div
          key={char}
          className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-3"
        >
          <p className="text-xs font-bold text-amber-800">
            ⚠️ {char} — {tr(locale, "андуурч болзошгүй ханзнууд")}
            <span className="ml-1 font-semibold text-amber-600">
              ({tr(locale, "адил")} {family.k}
              {family.km ? ` «${family.km}»` : ""}, {tr(locale, "өөр язгуур")})
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {family.list.map((entry) => (
              <Link
                key={entry.c}
                href={`/dictionary?q=${encodeURIComponent(entry.c)}`}
                className="inline-flex items-baseline gap-1.5 rounded-xl bg-white px-2.5 py-1.5 ring-1 ring-amber-200"
              >
                <span className="text-lg font-bold text-[var(--app-text,#0f172a)]">
                  {entry.c}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {entry.p}
                </span>
                {entry.r ? (
                  <span className="text-[10px] font-semibold text-amber-700">
                    {entry.r}
                    {entry.rm ? ` ${entry.rm}` : ""}
                  </span>
                ) : null}
                <span className="max-w-[9rem] truncate text-[11px] text-slate-500">
                  {entry.m}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
