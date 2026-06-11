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
  error?: string;
};

export type BichlegWordStatus = {
  saved: boolean;
  inCatalog: boolean;
  hskWordId: number | null;
  inSrs: boolean;
};

export async function lookupHskWordIdBySimplified(
  zh: string
): Promise<number | null> {
  if (!supabase || !hasSupabaseConfig) return null;
  const trimmed = zh.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("hsk_words")
    .select("id")
    .eq("simplified", trimmed)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.id as number;
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

export async function saveWordFromBichleg(input: {
  zh: string;
  pinyin?: string;
  mn?: string;
  sourceVideoId: string;
}): Promise<SaveWordFromBichlegResult> {
  if (!supabase || !hasSupabaseConfig) {
    return { ok: false, error: "Supabase тохируулагдаагүй." };
  }

  const { userId } = await getAuthenticatedUserId();
  if (!userId) {
    return { ok: false, error: "Нэвтрээгүй хэрэглэгч." };
  }

  const zh = input.zh.trim();
  const hskWordId = await lookupHskWordIdBySimplified(zh);
  const inCatalog = hskWordId != null;

  if (hskWordId != null && (await userHasWordSrsEntry(userId, hskWordId))) {
    const { error: upsertSavedError } = await supabase
      .from("user_saved_words")
      .upsert(
        {
          user_id: userId,
          zh,
          pinyin: input.pinyin ?? null,
          mn: input.mn ?? null,
          source_video_id: input.sourceVideoId,
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
    source_video_id: input.sourceVideoId,
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
  if (hskWordId != null) {
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
