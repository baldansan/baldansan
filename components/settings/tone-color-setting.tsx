"use client";

import { MobileCard } from "@/components/mobile/mobile-card";
import { ToneHanzi, ToneLegend } from "@/components/hanzi/ToneHanzi";
import { setToneColors, useToneColors } from "@/lib/pinyin/tone-pref";

export function ToneColorSetting() {
  const on = useToneColors();
  return (
    <MobileCard padding="lg" className="mb-4">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[var(--app-text)]">Хөгийн өнгө</span>
          <span className="mt-1 block text-xs text-[var(--app-muted)]">
            Ханз болон pinyin-ийг хөгөөр нь өнгөлнө: 4 өнгө, хөггүй нь саарал.
          </span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-emerald-600"
          checked={on}
          onChange={(e) => setToneColors(e.target.checked)}
        />
      </label>
      <div className="mt-3 flex justify-center">
        <ToneHanzi word="你好吗" pinyin="nǐ hǎo ma" size="lg" />
      </div>
      <ToneLegend />
    </MobileCard>
  );
}
