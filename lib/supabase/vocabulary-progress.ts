import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type VocabularyProgressStatus = "learned" | "learning";

export type UserVocabularyProgressRow = {
  user_id: string;
  vocabulary_word_id: number;
  status: string;
  learned_at: string | null;
  updated_at: string;
};

export type VocabularyProgressResult<T> = {
  data: T | null;
  error: string | null;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function notConfigured<T>(): VocabularyProgressResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function toErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export function isLearnedVocabularyStatus(status: string): boolean {
  return status === "learned";
}

export function normalizeVocabularyWordDbId(
  value: number | string | undefined | null
): number | null {
  if (value == null) {
    return null;
  }
  const id = typeof value === "number" ? value : Number(value);
  return Number.isFinite(id) ? id : null;
}

export async function lookupVocabularyWordDbId(
  lessonId: string,
  chinese: string
): Promise<number | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("chinese", chinese)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeVocabularyWordDbId(data.id as number | string);
}

export async function getUserVocabularyProgress(
  userId: string
): Promise<VocabularyProgressResult<UserVocabularyProgressRow[]>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase
    .from("user_vocabulary_progress")
    .select(
      "user_id, vocabulary_word_id, status, learned_at, updated_at"
    )
    .eq("user_id", userId)
    .order("vocabulary_word_id", { ascending: true });

  return {
    data: (data as UserVocabularyProgressRow[] | null) ?? [],
    error: toErrorMessage(error),
  };
}

export async function getUserVocabularyProgressByLesson(
  userId: string,
  lessonId: string
): Promise<VocabularyProgressResult<UserVocabularyProgressRow[]>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase
    .from("user_vocabulary_progress")
    .select(
      `
      user_id,
      vocabulary_word_id,
      status,
      learned_at,
      updated_at,
      vocabulary_words!inner (
        lesson_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("vocabulary_words.lesson_id", lessonId);

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  const rows = (data ?? []).map((row) => {
    const { vocabulary_words: _words, ...rest } = row as UserVocabularyProgressRow & {
      vocabulary_words?: unknown;
    };
    return rest as UserVocabularyProgressRow;
  });

  return { data: rows, error: null };
}

export async function markSupabaseWordLearned(
  userId: string,
  vocabularyWordId: number
): Promise<VocabularyProgressResult<UserVocabularyProgressRow>> {
  if (!supabase) {
    return notConfigured();
  }

  const wordId = normalizeVocabularyWordDbId(vocabularyWordId);
  if (wordId == null) {
    return { data: null, error: "Invalid vocabulary_word_id" };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_vocabulary_progress")
    .upsert(
      {
        user_id: userId,
        vocabulary_word_id: wordId,
        status: "learned",
        learned_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,vocabulary_word_id" }
    )
    .select(
      "user_id, vocabulary_word_id, status, learned_at, updated_at"
    )
    .single();

  return {
    data: data as UserVocabularyProgressRow | null,
    error: toErrorMessage(error),
  };
}

export async function unmarkSupabaseWordLearned(
  userId: string,
  vocabularyWordId: number
): Promise<VocabularyProgressResult<null>> {
  if (!supabase) {
    return notConfigured();
  }

  const wordId = normalizeVocabularyWordDbId(vocabularyWordId);
  if (wordId == null) {
    return { data: null, error: "Invalid vocabulary_word_id" };
  }

  const { error } = await supabase
    .from("user_vocabulary_progress")
    .delete()
    .eq("user_id", userId)
    .eq("vocabulary_word_id", wordId);

  return {
    data: null,
    error: toErrorMessage(error),
  };
}

export async function toggleSupabaseWordLearned(
  userId: string,
  vocabularyWordId: number,
  learned: boolean
): Promise<VocabularyProgressResult<UserVocabularyProgressRow | null>> {
  if (learned) {
    const result = await markSupabaseWordLearned(userId, vocabularyWordId);
    return { data: result.data, error: result.error };
  }

  const result = await unmarkSupabaseWordLearned(userId, vocabularyWordId);
  return { data: null, error: result.error };
}

export { hasSupabaseConfig };
