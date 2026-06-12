import { ensureInitialWordSrs } from "@/lib/supabase/user-word-srs";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type UserSavedWordRow = {
  id: string;
  user_id: string;
  zh: string;
  pinyin: string | null;
  mn: string | null;
  source_video_id: string | null;
  hsk_word_id: number | null;
  created_at: string;
};

export type SaveWordFromBichlegResult = {
  ok: boolean;
  duplicate?: boolean;
  inCatalog?: boolean;
  linkedToSrs?: boolean;
  alreadyInSrs?: boolean;
  /** Grammatical particle — saved but not added to SRS. */
  isFunctionWord?: boolean;
  error?: string;
};

export type HskWordLookup = {
  id: number;
  is_function_word: boolean;
};

export type HskWordDisplay = {
  id: number;
  pinyin: string | null;
  meaning_mn: string | null;
  radical: string | null;
  is_function_word: boolean;
};

export type BichlegWordStatus = {
  saved: boolean;
  inCatalog: boolean;
  hskWordId: number | null;
  inSrs: boolean;
};

export async function lookupHskWordBySimplified(
  zh: string
): Promise<HskWordLookup | null> {
  if (!supabase || !hasSupabaseConfig) return null;
  const trimmed = zh.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("hsk_words")
    .select("id, is_function_word")
    .eq("simplified", trimmed)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as number,
    is_function_word: Boolean(data.is_function_word),
  };
}

export async function lookupHskWordIdBySimplified(
  zh: string
): Promise<number | null> {
  const row = await lookupHskWordBySimplified(zh);
  return row?.id ?? null;
}

export async function lookupHskWordDisplayBySimplified(
  zh: string
): Promise<HskWordDisplay | null> {
  if (!supabase || !hasSupabaseConfig) return null;
  const trimmed = zh.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("hsk_words")
    .select("id, pinyin, meaning_mn, radical, is_function_word")
    .eq("simplified", trimmed)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as number,
    pinyin: (data.pinyin as string | null) ?? null,
    meaning_mn: (data.meaning_mn as string | null) ?? null,
    radical: (data.radical as string | null) ?? null,
    is_function_word: Boolean(data.is_function_word),
  };
}

export async function saveWordFromBichleg(input: {
  zh: string;
  pinyin?: string;
  mn?: string;
  sourceVideoId: string;
}): Promise<SaveWordFromBichlegResult> {
  return persistUserSavedWord({
    zh: input.zh,
    pinyin: input.pinyin,
    mn: input.mn,
    sourceVideoId: input.sourceVideoId,
  });
}

export async function saveWordFromLesson(input: {
  zh: string;
  pinyin?: string;
  mn?: string;
}): Promise<SaveWordFromBichlegResult> {
  return persistUserSavedWord({
    zh: input.zh,
    pinyin: input.pinyin,
    mn: input.mn,
    sourceVideoId: null,
  });
}

export type SaveLessonWordsBatchResult = {
  ok: boolean;
  added: number;
  alreadyHad: number;
  error?: string;
};

export async function saveLessonWordsBatch(
  words: { zh: string; pinyin?: string; mn?: string }[]
): Promise<SaveLessonWordsBatchResult> {
  if (!words.length) {
    return { ok: true, added: 0, alreadyHad: 0 };
  }

  let added = 0;
  let alreadyHad = 0;
  let lastError: string | undefined;

  for (const word of words) {
    const result = await saveWordFromLesson(word);
    if (!result.ok) {
      lastError = result.error;
      continue;
    }
    if (result.duplicate || result.alreadyInSrs) {
      alreadyHad += 1;
    } else {
      added += 1;
    }
  }

  return {
    ok: added > 0 || alreadyHad > 0 || !lastError,
    added,
    alreadyHad,
    error: added === 0 && alreadyHad === 0 ? lastError : undefined,
  };
}

export async function userHasWordSrsEntry(
  userId: string,
  wordId: number
): Promise<boolean> {
  if (!supabase || !hasSupabaseConfig) return false;

  const { data, error } = await supabase
    .from("user_word_srs")
    .select("id")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function getBichlegWordStatus(
  zh: string
): Promise<BichlegWordStatus> {
  const empty: BichlegWordStatus = {
    saved: false,
    inCatalog: false,
    hskWordId: null,
    inSrs: false,
  };

  if (!supabase || !hasSupabaseConfig) return empty;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return empty;

  const hskWordId = await lookupHskWordIdBySimplified(zh);

  const { data: saved } = await supabase
    .from("user_saved_words")
    .select("id, hsk_word_id")
    .eq("user_id", userId)
    .eq("zh", zh.trim())
    .maybeSingle();

  const linkedId =
    (saved?.hsk_word_id as number | null | undefined) ?? hskWordId;
  const inSrs =
    linkedId != null ? await userHasWordSrsEntry(userId, linkedId) : false;

  return {
    saved: Boolean(saved),
    inCatalog: hskWordId != null,
    hskWordId,
    inSrs,
  };
}

async function persistUserSavedWord(input: {
  zh: string;
  pinyin?: string;
  mn?: string;
  sourceVideoId?: string | null;
}): Promise<SaveWordFromBichlegResult> {
  if (!supabase || !hasSupabaseConfig) {
    return { ok: false, error: "Supabase тохируулагдаагүй." };
  }

  const { userId } = await getAuthenticatedUserId();
  if (!userId) {
    return { ok: false, error: "Нэвтрээгүй хэрэглэгч." };
  }

  const zh = input.zh.trim();
  const hskLookup = await lookupHskWordBySimplified(zh);
  const hskWordId = hskLookup?.id ?? null;
  const isFunctionWord = hskLookup?.is_function_word ?? false;
  const inCatalog = hskWordId != null;

  if (
    hskWordId != null &&
    !isFunctionWord &&
    (await userHasWordSrsEntry(userId, hskWordId))
  ) {
    const { error: upsertSavedError } = await supabase
      .from("user_saved_words")
      .upsert(
        {
          user_id: userId,
          zh,
          pinyin: input.pinyin ?? null,
          mn: input.mn ?? null,
          source_video_id: input.sourceVideoId ?? null,
          hsk_word_id: hskWordId,
        },
        { onConflict: "user_id,zh" }
      );

    if (upsertSavedError) {
      return { ok: false, error: upsertSavedError.message };
    }

    return {
      ok: true,
      duplicate: true,
      inCatalog: true,
      linkedToSrs: true,
      alreadyInSrs: true,
    };
  }

  const { error: insertError } = await supabase.from("user_saved_words").insert({
    user_id: userId,
    zh,
    pinyin: input.pinyin ?? null,
    mn: input.mn ?? null,
    source_video_id: input.sourceVideoId ?? null,
    hsk_word_id: hskWordId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      if (hskWordId != null) {
        await supabase
          .from("user_saved_words")
          .update({ hsk_word_id: hskWordId })
          .eq("user_id", userId)
          .eq("zh", zh)
          .is("hsk_word_id", null);

        if (isFunctionWord) {
          return {
            ok: true,
            duplicate: true,
            inCatalog: true,
            isFunctionWord: true,
            linkedToSrs: false,
          };
        }

        const { created } = await ensureInitialWordSrs(userId, hskWordId);
        return {
          ok: true,
          duplicate: true,
          inCatalog: true,
          linkedToSrs: created || (await userHasWordSrsEntry(userId, hskWordId)),
        };
      }
      return { ok: true, duplicate: true, inCatalog: false };
    }
    return { ok: false, error: insertError.message };
  }

  let linkedToSrs = false;
  if (hskWordId != null && !isFunctionWord) {
    const { created, error: srsError } = await ensureInitialWordSrs(
      userId,
      hskWordId
    );
    if (srsError) {
      return { ok: false, error: srsError };
    }
    linkedToSrs = created;
  }

  return {
    ok: true,
    inCatalog,
    linkedToSrs,
    isFunctionWord: isFunctionWord || undefined,
  };
}

export async function deleteUserSavedWord(
  savedWordId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase || !hasSupabaseConfig) {
    return { ok: false, error: "Supabase тохируулагдаагүй." };
  }

  const { userId } = await getAuthenticatedUserId();
  if (!userId) {
    return { ok: false, error: "Нэвтрээгүй хэрэглэгч." };
  }

  const { error } = await supabase
    .from("user_saved_words")
    .delete()
    .eq("id", savedWordId)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function fetchBichlegHskWordIds(
  userId: string
): Promise<Set<number>> {
  const ids = new Set<number>();
  if (!supabase || !hasSupabaseConfig) return ids;

  const { data, error } = await supabase
    .from("user_saved_words")
    .select("hsk_word_id")
    .eq("user_id", userId)
    .not("source_video_id", "is", null)
    .not("hsk_word_id", "is", null);

  if (error || !data) return ids;
  for (const row of data) {
    const id = row.hsk_word_id as number | null;
    if (id != null) ids.add(id);
  }
  return ids;
}

export async function fetchOrphanSavedWords(
  userId: string
): Promise<UserSavedWordRow[]> {
  if (!supabase || !hasSupabaseConfig) return [];

  const { data, error } = await supabase
    .from("user_saved_words")
    .select("*")
    .eq("user_id", userId)
    .is("hsk_word_id", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as UserSavedWordRow[];
}
