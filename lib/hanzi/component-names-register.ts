/**
 * Нөөц нэрийн толиудыг СТАТИКААР бүртгэнэ (sync хэрэглээ: radical тоглоомууд,
 * серверийн API). Энэ файлыг импортолсон модулийн bundle-д JSON орно —
 * хичээл/давтлагын хуудсууд үүнийг импортлохгүй, component-names-lazy-гаар
 * хэрэгтэй үедээ татна.
 */
import partNamesMn from "@/public/data/component_meanings_mn.json";
import charGloss from "@/public/data/hsk_char_gloss.json";
import { registerComponentNames } from "@/lib/hanzi/component-names-lazy";

registerComponentNames(
  partNamesMn as unknown as Record<string, { mn?: string }>,
  charGloss as unknown as Record<string, { mn?: string }>
);
