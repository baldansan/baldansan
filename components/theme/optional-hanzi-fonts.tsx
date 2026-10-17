"use client";

import { Ma_Shan_Zheng, Noto_Serif_SC } from "next/font/google";
import { useEffect } from "react";

/**
 * Тохиргооны «Сурах бичиг» / «Гар бичлэг» ханзны фонтууд.
 * app/layout.tsx-д биш, зөвхөн сурагч сонгосон үед (hanzi-font-loader) энэ
 * модуль динамикаар ачаалагдана — next/font-ийн @font-face CSS нь ч энэ
 * chunk-тай хамт ирнэ. buunduu-theme.css дахь --bs-zh нь
 * var(--font-noto-serif-sc, 'Noto Serif SC') гэх мэт fallback-тай тул
 * хувьсагчийг <html> дээр класс болгон тавихад л хангалттай.
 */
const notoSerifSc = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  preload: false,
});

/** Гар бичлэг/самбар дээрх бичлэгтэй төстэй донж — нарийн зураастай (马善政楷书). */
const maShanZheng = Ma_Shan_Zheng({
  variable: "--font-zh-brush",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

export default function OptionalHanziFonts() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(notoSerifSc.variable, maShanZheng.variable);
    return () => {
      root.classList.remove(notoSerifSc.variable, maShanZheng.variable);
    };
  }, []);
  return null;
}
