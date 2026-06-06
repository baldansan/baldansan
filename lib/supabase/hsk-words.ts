import {
  filterHskWordsByActiveLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type HskWordRow = {
  id?: number;
  simplified: string;
  traditional?: string | null;
  pinyin?: string | null;
  pinyin_numeric?: string | null;
  bopomofo?: string | null;
  pos?: string[];
  radical?: string | null;
  frequency?: number | null;
  hsk_level?: number | null;
  hsk_old?: string[];
  hsk_new?: string[];
  hsk_newest?: string[];
  classifiers?: string[];
  meanings_en?: string[];
  meaning_en?: string | null;
  meaning_mn?: string | null;
  example_zh?: string | null;
  example_pinyin?: string | null;
  example_mn?: string | null;
};

export async function fetchHskWordsByLevel(
  activeLevel: ActiveHskLevel
): Promise<{ data: HskWordRow[]; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { data: [], error: "Supabase тохиргоо байхгүй." };
  }

  const { data, error } = await supabase
    .from("hsk_words")
    .select(
      "id, simplified, traditional, pinyin, pinyin_numeric, bopomofo, pos, radical, frequency, hsk_level, hsk_old, hsk_new, hsk_newest, classifiers, meanings_en, meaning_en, meaning_mn, example_zh, example_pinyin, example_mn"
    )
    .order("frequency", { ascending: true, nullsFirst: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = (data ?? []) as HskWordRow[];
  return {
    data: filterHskWordsByActiveLevel(rows, activeLevel),
    error: null,
  };
}
