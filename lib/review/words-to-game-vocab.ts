import type { GameVocabItem } from "@/lib/games/game-types";
import type { HskWord } from "@/lib/hsk";
import type { HskWordRow } from "@/lib/supabase/hsk-words";

export function hskWordRowToGameVocab(word: HskWordRow): GameVocabItem {
  return {
    id: String(word.id),
    chinese: word.simplified,
    pinyin: word.pinyin?.trim() ?? "",
    mongolian: word.meaning_mn?.trim() ?? word.simplified,
    hskLevel: String(word.hsk_level ?? ""),
    exampleChinese: word.example_zh?.trim() ?? "",
    exampleMongolian: word.example_mn?.trim() ?? "",
  };
}

export function hskWordToGameVocab(word: HskWord): GameVocabItem {
  return {
    id: String(word.id),
    chinese: word.simplified,
    pinyin: word.pinyin?.trim() ?? "",
    mongolian: word.meaning_mn?.trim() ?? word.simplified,
    hskLevel: String(word.hsk_level ?? ""),
    exampleChinese: word.example_zh?.trim() ?? "",
    exampleMongolian: word.example_mn?.trim() ?? "",
  };
}
