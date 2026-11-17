import { supabase } from "@/lib/supabase/client";

/**
 * Чатын санал асуулга (105 SQL). Асуулга нь энгийн мессеж: бие нь POLL_PREFIX + JSON.
 * Санал chat_poll_votes хүснэгтэд (нэг хүн нэг асуулгад нэг санал, сольж болно).
 */
export const POLL_PREFIX = "📊POLL:";

export type ChatPoll = { question: string; options: string[] };
export type PollTally = { counts: number[]; total: number; mine: number | null };

export function buildPollBody(question: string, options: string[]): string {
  return POLL_PREFIX + JSON.stringify({ q: question.trim(), o: options.map((o) => o.trim()).filter(Boolean) });
}

export function parsePoll(body: string): ChatPoll | null {
  if (!body.startsWith(POLL_PREFIX)) return null;
  try {
    const raw = JSON.parse(body.slice(POLL_PREFIX.length)) as { q?: unknown; o?: unknown };
    const options = Array.isArray(raw.o) ? raw.o.map((x) => String(x)).filter(Boolean).slice(0, 10) : [];
    const question = typeof raw.q === "string" ? raw.q : "";
    if (!question || options.length < 2) return null;
    return { question, options };
  } catch {
    return null;
  }
}

/** Өгөгдсөн асуулгуудын саналын тоо. Хүснэгт байхгүй (105 ажиллаагүй) бол хоосон. */
export async function fetchPollTallies(
  messageIds: number[],
  userId: string,
  optionCounts: Record<number, number>
): Promise<Record<number, PollTally>> {
  const out: Record<number, PollTally> = {};
  for (const id of messageIds) {
    out[id] = { counts: new Array(optionCounts[id] ?? 0).fill(0), total: 0, mine: null };
  }
  if (!supabase || messageIds.length === 0) return out;
  try {
    const { data, error } = await supabase
      .from("chat_poll_votes")
      .select("message_id, user_id, option_idx")
      .in("message_id", messageIds)
      .limit(5000);
    if (error || !data) return out;
    for (const row of data) {
      const t = out[Number(row.message_id)];
      const idx = Number(row.option_idx);
      if (!t || idx < 0 || idx >= t.counts.length) continue;
      t.counts[idx] += 1;
      t.total += 1;
      if (row.user_id === userId) t.mine = idx;
    }
  } catch {
    /* хүснэгт байхгүй үед чимээгүй */
  }
  return out;
}

export async function votePoll(messageId: number, userId: string, optionIdx: number): Promise<string | null> {
  if (!supabase) return "Тохиргоо дутуу.";
  try {
    const { error } = await supabase
      .from("chat_poll_votes")
      .upsert({ message_id: messageId, user_id: userId, option_idx: optionIdx }, { onConflict: "message_id,user_id" });
    return error ? "Санал өгч чадсангүй." : null;
  } catch {
    return "Санал өгч чадсангүй.";
  }
}
