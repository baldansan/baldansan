import type { SelectedLanguage } from "@/lib/language-track";

/** Bottom tab and letters screen title (replaces legacy «Ханз»). */
export function lettersTabLabel(_lang?: SelectedLanguage | null): string {
  return "Үсэг";
}

export function lettersPageTitle(lang: SelectedLanguage | null): string {
  return lettersTabLabel(lang);
}

export function lettersPageSubtitle(lang: SelectedLanguage | null): string {
  if (lang === "ko") return "Солонгос үг, үсэг";
  if (lang === "zh") return "Хятад үг, үсэг";
  return "Үг, үсэг";
}

export function lettersSearchPlaceholder(lang: SelectedLanguage | null): string {
  if (lang === "ko") return "Үг, утгаар хайх…";
  return "Үсэг, пиньинь, утгаар хайх…";
}

export function lettersEmptyMessage(lang: SelectedLanguage | null): string {
  if (lang === "ko") return "Үг олдсонгүй.";
  return "Үсэг олдсонгүй.";
}

export function lettersDetailLinkLabel(lang: SelectedLanguage | null): string {
  if (lang === "ko") return "Үг дэлгэрэнгүй";
  return "Үсэг дэлгэрэнгүй";
}

export function lettersLevelGroupLabel(
  level: string,
  lang: SelectedLanguage | null
): string {
  if (lang === "ko" && (level === "Other" || level.startsWith("HSK"))) {
    return "Солонгос";
  }
  return level;
}
