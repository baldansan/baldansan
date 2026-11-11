/**
 * «Тоглож сурах»-ын үгийн эх үүсвэр. «Миний үгс» = давтах дараалал + бичлэгээс
 * хадгалсан + хичээлээс нэмсэн + HSK жагсаалтаас сурч буй үгс — бүгд НЭГ дор,
 * үг бүр хаанаас ирснээ жижиг тэмдгээр харуулна.
 */
import type { ActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
import type { LearnWord } from "@/lib/games/learn-session";

const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, meaning_en, meaning_mn, example_zh, example_pinyin, example_mn";

export type WordOrigin = "video" | "lesson" | "hsk";

export const WORD_ORIGIN_META: Record<WordOrigin, { icon: string; label: string }> = {
  video: { icon: "▶️", label: "Бичлэгээс" },
  lesson: { icon: "📖", label: "Сурах бичгээс" },
  hsk: { icon: "🀄", label: "HSK үгсээс" },
};

export type MyWord = LearnWord & {
  origin: WordOrigin;
  /** Өнөөдөр давтах ёстой (эсвэл хугацаа нь өнгөрсөн). */
  due: boolean;
};

export type MyWordsResult = { loggedIn: boolean; words: MyWord[] };

/** Хэрэглэгчийн сурч буй БҮХ үг, эх үүсвэртэй нь. Нэвтрээгүй бол хоосон. */
export async function loadMyWords(): Promise<MyWordsResult> {
  if (!hasSupabaseConfig || !supabase) return { loggedIn: false, words: [] };
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { loggedIn: false, words: [] };

  const [srsRes, savedRes] = await Promise.all([
    supabase
      .from("user_word_srs")
      .select("hsk_word_id, due_at")
      .eq("user_id", userId)
      .limit(3000),
    supabase
      .from("user_saved_words")
      .select("hsk_word_id, source_video_id")
      .eq("user_id", userId)
      .not("hsk_word_id", "is", null)
      .limit(3000),
  ]);

  const origin = new Map<number, WordOrigin>();
  const due = new Set<number>();
  const now = Date.now();
  for (const row of (srsRes.data ?? []) as { hsk_word_id: number | null; due_at: string | null }[]) {
    if (row.hsk_word_id == null) continue;
    origin.set(row.hsk_word_id, "hsk");
    if (!row.due_at || new Date(row.due_at).getTime() <= now) due.add(row.hsk_word_id);
  }
  for (const row of (savedRes.data ?? []) as {
    hsk_word_id: number | null;
    source_video_id: string | null;
  }[]) {
    if (row.hsk_word_id == null) continue;
    // Бичлэгээс хадгалсан нь хамгийн тодорхой эх үүсвэр тул түүнийг эрхэмлэнэ.
    if (row.source_video_id) origin.set(row.hsk_word_id, "video");
    else if (origin.get(row.hsk_word_id) !== "video") origin.set(row.hsk_word_id, "lesson");
  }

  const ids = [...origin.keys()];
  if (ids.length === 0) return { loggedIn: true, words: [] };
  const rows: LearnWord[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await supabase
      .from("hsk_words")
      .select(WORD_SELECT)
      .in("id", ids.slice(i, i + 300));
    for (const w of (data ?? []) as unknown as LearnWord[]) if (w.id != null) rows.push(w);
  }
  const words: MyWord[] = rows.map((w) => ({
    ...w,
    origin: origin.get(w.id) ?? "hsk",
    due: due.has(w.id),
  }));
  // Давтах ёстой нь эхэндээ.
  words.sort((a, b) => Number(b.due) - Number(a.due));
  return { loggedIn: true, words };
}

/** HSK түвшний үгс (санамсаргүй 120 хүртэл) — төөрөгдүүлэгч сонголт, зочны тоглолтод. */
export async function loadLevelWords(level: ActiveHskLevel): Promise<LearnWord[]> {
  const { data } = await fetchHskWordsByLevel(level, { limit: 160 });
  return (data ?? []).filter((w): w is LearnWord => w.id != null);
}
