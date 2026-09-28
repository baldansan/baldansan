"use client";

/**
 * Ханзны фонт сонголт (Тохиргоо хуудас).
 * Зөвхөн харагдацын тохиргоо — контент өөрчлөгдөхгүй, зөвхөн CSS хувьсагч
 * (--bs-zh) солигдоно. Эх сурвалж: localStorage → "sans" (өгөгдмөл).
 *
 * Тавихдаа <html data-hanzi-font="..."> attribute болгож бичдэг тул
 * app/buunduu-theme.css дэх сонголтууд (:root[data-hanzi-font="serif"] гэх мэт)
 * шууд хэрэгжинэ — дахин ачаалах шаардлагагүй.
 */

export const HANZI_FONT_STORAGE_KEY = "buunduu-hanzi-font-v1";

export type HanziFontId = "sans" | "serif" | "brush";

export const DEFAULT_HANZI_FONT: HanziFontId = "sans";

export const HANZI_FONT_OPTIONS: {
  id: HanziFontId;
  labelMn: string;
  descMn: string;
  fontFamily: string;
}[] = [
  {
    id: "sans",
    labelMn: "Энгийн",
    descMn: "Аппын өгөгдмөл, тод хэвлэмэл донж",
    fontFamily: "var(--font-noto-sc, 'Noto Sans SC'), sans-serif",
  },
  {
    id: "serif",
    labelMn: "Сурах бичиг",
    descMn: "Ном, сурах бичигт хэвлэдэг сонгодог донж",
    fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC'), serif",
  },
  {
    id: "brush",
    labelMn: "Гар бичлэг",
    descMn: "Багш самбар дээр бичдэгтэй төстэй донж",
    fontFamily: "var(--font-zh-brush, 'Zhi Mang Xing'), cursive",
  },
];

export function isHanziFontId(v: unknown): v is HanziFontId {
  return v === "sans" || v === "serif" || v === "brush";
}

export function getHanziFont(): HanziFontId {
  if (typeof window === "undefined") return DEFAULT_HANZI_FONT;
  try {
    const v = localStorage.getItem(HANZI_FONT_STORAGE_KEY);
    return isHanziFontId(v) ? v : DEFAULT_HANZI_FONT;
  } catch {
    return DEFAULT_HANZI_FONT;
  }
}

/** Сонголтыг хадгалаад <html> дээр шууд хэрэгжүүлнэ (reload шаардлагагүй). */
export function setHanziFont(font: HanziFontId): void {
  try {
    localStorage.setItem(HANZI_FONT_STORAGE_KEY, font);
  } catch {
    // ignore
  }
  applyHanziFontToDocument(font);
}

export function applyHanziFontToDocument(font: HanziFontId): void {
  if (typeof document === "undefined") return;
  if (font === DEFAULT_HANZI_FONT) {
    document.documentElement.removeAttribute("data-hanzi-font");
  } else {
    document.documentElement.setAttribute("data-hanzi-font", font);
  }
}
