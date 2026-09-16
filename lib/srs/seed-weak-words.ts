"use client";

import { seedLocalNewWords } from "@/lib/srs/local-word-srs";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

/**
 * Алдсан үгсийг давталтын системд буцааж оруулах.
 * Загвар нь `lib/srs/seed-lesson-words.ts` — байгаа картыг ХӨНДӨХГҮЙ,
 * зөвхөн байхгүй үгэнд «шинэ карт, маргааш давтах» мөр нэмнэ.
 */

export type SeedWeakWordsResult = {
  added: number;
  already: number;
  /** Нөхцөл үг зэрэг SRS-д ордоггүй тул алгассан. */
  skipped: number;
  error: string | null;
};

const EMPTY: SeedWeakWordsResult = {
  added: 0,
  already: 0,
  skipped: 0,
  error: null,
};

const DAY_MS = 86_400_000;
const CHUNK = 200;

/** Маргааш давтагдахаар товлох цаг (шинэ карт). */
function tomorrowIso(now: Date = new Date()): string {
  return new Date(now.getTime() + DAY_MS).toISOString();
}

function chunked<T>(values: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size));
  }
  return out;
}

/** SRS-д орох эрхтэй (нөхцөл үг биш) үгсийн id-г шүүнэ. */
async function filterSrsEligible(wordIds: number[]): Promise<number[]> {
  if (!supabase || wordIds.length === 0) return [];
  const eligible: number[] = [];
  for (const chunk of chunked([...new Set(wordIds)])) {
    const { data, error } = await supabase
      .from("hsk_words")
      .select("id")
      .eq("is_function_word", false)
      .in("id", chunk);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as { id: number }[]) {
      if (row.id != null) eligible.push(row.id);
    }
  }
  return eligible;
}

async function enrolForUser(
  userId: string,
  wordIds: number[]
): Promise<{ added: number; already: number }> {
  if (!supabase || wordIds.length === 0) return { added: 0, already: 0 };

  const existing = new Set<number>();
  for (const chunk of chunked(wordIds)) {
    const { data, error } = await supabase
      .from("user_word_srs")
      .select("word_id")
      .eq("user_id", userId)
      .in("word_id", chunk);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) existing.add(row.word_id as number);
  }

  const fresh = wordIds.filter((id) => !existing.has(id));
  if (fresh.length === 0) {
    return { added: 0, already: existing.size };
  }

  const dueAt = tomorrowIso();
  const { error: insertError } = await supabase.from("user_word_srs").insert(
    fresh.map((wordId) => ({
      user_id: userId,
      word_id: wordId,
      reps: 0,
      ease: 2.5,
      interval_days: 0,
      due_at: dueAt,
      last_rating: null,
    }))
  );

  if (insertError) {
    // 23505 — зэрэг оролт: аль хэдийн орсон гэж үзнэ.
    if (insertError.code === "23505") {
      return { added: 0, already: wordIds.length };
    }
    throw new Error(insertError.message);
  }

  return { added: fresh.length, already: existing.size };
}

/**
 * «Алдсан үгсээ давталтад нэмэх» — хэрэглэгчийн дарсан үйлдэл.
 * Нэвтэрсэн бол user_word_srs, зочин бол локал санд маргааш due болгож нэмнэ.
 * Аль хэдийн давталтад байгаа үгийн хуваарийг өөрчлөхгүй.
 */
export async function seedWeakWordsIntoSrs(
  wordIds: number[]
): Promise<SeedWeakWordsResult> {
  const unique = [...new Set(wordIds)].filter((id) => Number.isInteger(id));
  if (unique.length === 0) return EMPTY;

  if (!hasSupabaseConfig || !supabase) {
    const local = seedLocalNewWords(unique, tomorrowIso());
    return { ...local, skipped: 0, error: null };
  }

  try {
    const eligible = await filterSrsEligible(unique);
    const skipped = unique.length - eligible.length;
    if (eligible.length === 0) {
      return { added: 0, already: 0, skipped, error: null };
    }

    const { userId } = await getAuthenticatedUserId().catch(() => ({
      userId: null,
    }));

    if (userId) {
      const result = await enrolForUser(userId, eligible);
      return { ...result, skipped, error: null };
    }

    const local = seedLocalNewWords(eligible, tomorrowIso());
    return { ...local, skipped, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Үг давталтад нэмэхэд алдаа гарлаа.";
    return { added: 0, already: 0, skipped: 0, error: message };
  }
}

type VocabularyLike = {
  chinese: string;
  mongolian: string;
  pinyin?: string;
};

/**
 * Quiz-ийн зөв хариулт хичээлийн үгийн сангийн аль үгийнх болохыг олно.
 * Хариулт нь ханз, монгол утга, пиньиний аль нь ч байж болно.
 */
export function findVocabularyChineseForAnswer(
  answer: string,
  vocabulary: VocabularyLike[]
): string | null {
  const norm = answer.trim();
  if (!norm) return null;
  const word = vocabulary.find(
    (w) =>
      w.chinese.trim() === norm ||
      w.mongolian.trim() === norm ||
      (w.pinyin?.trim() ?? "") === norm
  );
  const chinese = word?.chinese.trim();
  return chinese ? chinese : null;
}

/**
 * Fire-and-forget: хичээлийн quiz-д ҮГИЙН асуултыг буруу хариулбал тэр үгийг
 * давталтын системд маргааш эргэж ирэхээр товлоно.
 * Хэзээ ч алдаа шиднэ, суралцагчийн урсгалыг саатуулахгүй
 * (`lib/analytics/record-question-attempt.ts`-ийн загвар).
 */
export function resurfaceWrongQuizWord(input: {
  correctAnswer: string | null | undefined;
  vocabulary: VocabularyLike[] | null | undefined;
}): void {
  const answer = input.correctAnswer?.trim();
  if (!answer) return;
  const vocabulary = input.vocabulary ?? [];
  if (vocabulary.length === 0) return;

  const chinese = findVocabularyChineseForAnswer(answer, vocabulary);
  if (!chinese) return;

  void (async () => {
    try {
      if (!hasSupabaseConfig || !supabase) return;

      const { data, error } = await supabase
        .from("hsk_words")
        .select("id")
        .eq("simplified", chinese)
        .eq("is_function_word", false)
        .limit(1);
      if (error) return;

      const wordId = ((data ?? []) as { id: number }[])[0]?.id;
      if (wordId == null) return;

      const { userId } = await getAuthenticatedUserId().catch(() => ({
        userId: null,
      }));

      if (!userId) {
        seedLocalNewWords([wordId], tomorrowIso());
        return;
      }

      await enrolForUser(userId, [wordId]);
    } catch {
      // чимээгүй — давталтын товлолт суралцагчийн UX-д нөлөөлөхгүй
    }
  })();
}
