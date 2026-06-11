/** Simplified forms marked is_function_word in hsk_words (exact match only). */
export const FUNCTION_WORD_SIMPLIFIED = [
  "的", "地", "得", "了", "着", "过", "吗", "呢", "吧", "啊", "呀", "哇", "啦", "嘛",
  "哦", "喔", "噢", "呗", "咯", "哟", "嘞", "哎", "唉", "嗯", "哼", "嘿", "喂", "呵",
  "嗨", "哈", "呜", "咦", "哒", "个", "们",
] as const;

export function isFunctionWordSimplified(zh: string): boolean {
  return (FUNCTION_WORD_SIMPLIFIED as readonly string[]).includes(zh.trim());
}
