/**
 * Tone-insensitive pinyin sort key — mirrors public.hsk_pinyin_sort_key() in Postgres.
 */
const TONE_FROM =
  "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ";
const TONE_TO = "aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu";

export function toPinyinSortKey(pinyin: string | null | undefined): string {
  const raw = (pinyin ?? "").trim();
  if (!raw) return "";
  let out = "";
  for (const ch of raw) {
    const idx = TONE_FROM.indexOf(ch);
    out += idx >= 0 ? TONE_TO[idx]! : ch;
  }
  return out.toLowerCase();
}
