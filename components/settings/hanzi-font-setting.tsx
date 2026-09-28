"use client";

import { useEffect, useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
import {
  DEFAULT_HANZI_FONT,
  HANZI_FONT_OPTIONS,
  getHanziFont,
  setHanziFont,
  type HanziFontId,
} from "@/lib/hanzi-font/hanzi-font-pref";

const PREVIEW_ZH = "我化尘埃飞扬";

export function HanziFontSetting() {
  const [selected, setSelected] = useState<HanziFontId>(DEFAULT_HANZI_FONT);

  useEffect(() => {
    setSelected(getHanziFont());
  }, []);

  function handleSelect(id: HanziFontId) {
    setSelected(id);
    setHanziFont(id);
  }

  return (
    <MobileCard padding="lg" className="mb-4">
      <h2 className="text-sm font-bold text-[var(--app-text)]">Ханзны фонт</h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        Хичээл, толь бичиг, хэлц үг зэрэгт харагдах ханзны бичгийн донж.
        Багш самбар дээр өөр донжоор бичдэг тул уншиж дасахад туслана.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {HANZI_FONT_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 text-sm ${
              selected === opt.id
                ? "border-emerald-300 bg-emerald-50"
                : "border-[var(--app-border)] bg-white"
            }`}
          >
            <input
              type="radio"
              name="hanzi-font"
              className="accent-emerald-600"
              checked={selected === opt.id}
              onChange={() => handleSelect(opt.id)}
            />
            <span
              className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-[var(--app-primary-light)] text-xl font-bold text-[var(--app-text)]"
              style={{ fontFamily: opt.fontFamily }}
              translate="no"
            >
              {PREVIEW_ZH.slice(0, 3)}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block ${
                  selected === opt.id
                    ? "font-semibold text-emerald-900"
                    : "text-[var(--app-text)]"
                }`}
              >
                {opt.labelMn}
              </span>
              <span className="block text-xs text-[var(--app-muted)]">
                {opt.descMn}
              </span>
            </span>
          </label>
        ))}
      </div>
    </MobileCard>
  );
}
