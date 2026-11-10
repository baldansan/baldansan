"use client";

/**
 * Чадварын сүлжээ — клиент талын унших давхарга.
 * skills / user_skill_mastery хүснэгтээс HSK түвшин бүрийн чадварын зураглалыг бүрдүүлнэ.
 */

import { supabase, hasSupabaseConfig } from "@/lib/supabase/client";
import { readLocalStudiedWordIds } from "@/lib/srs/local-word-srs";

export type SkillKind = "grammar" | "skill" | "vocab_level";
export type SkillRow = {
  id: string;
  kind: SkillKind;
  hsk_level: number | null;
  name_mn: string;
  name_zh: string | null;
  desc_mn: string | null;
  sort: number;
};
export type MasteryRow = {
  skill_id: string;
  mastery: number;
  evidence_n: number;
  correct_n: number;
  last_at: string | null;
};
export type SkillStatus = "good" | "mid" | "weak" | "untested";
export type SkillMapItem = SkillRow & {
  mastery: number | null;
  evidence: number;
  status: SkillStatus;
  /** Хаашаа дарж сурах вэ */
  href: string;
  hrefLabel: string;
};
export type SkillMapGroup = { key: string; title: string; icon: string; items: SkillMapItem[] };
export type SkillMap = {
  level: number;
  groups: SkillMapGroup[];
  /** Түвшний нийт эзэмшил 0–100 (шалгагдаагүйг 0 гэж үзнэ) */
  overallPct: number;
  testedPct: number;
  counts: Record<SkillStatus, number>;
};

/** HSK түвшин бүрт шалгалтанд ордог ур чадварууд (真题 бүтцийн дагуу). */
export const LEVEL_SKILL_TAGS: Record<number, string[]> = {
  1: ["sk.listening.picture_judge", "sk.listening.picture_match", "sk.listening.picture_choice", "sk.listening.dialogue", "sk.reading.word_picture", "sk.reading.picture_match", "sk.reading.qa_match", "sk.reading.cloze"],
  2: ["sk.listening.picture_judge", "sk.listening.picture_match", "sk.listening.dialogue", "sk.reading.picture_match", "sk.reading.cloze", "sk.reading.judge", "sk.reading.qa_match"],
  3: ["sk.listening.picture_match", "sk.listening.judge", "sk.listening.dialogue", "sk.reading.match", "sk.reading.cloze", "sk.reading.comprehension", "sk.writing.order", "sk.writing.char"],
  4: ["sk.listening.judge", "sk.listening.dialogue", "sk.listening.passage", "sk.reading.cloze", "sk.reading.order", "sk.reading.comprehension", "sk.writing.order", "sk.writing.picture"],
  5: ["sk.listening.dialogue", "sk.listening.passage", "sk.reading.cloze", "sk.reading.match_statement", "sk.reading.comprehension", "sk.writing.order", "sk.writing.essay", "sk.writing.essay_picture"],
  6: ["sk.listening.short_news", "sk.listening.interview", "sk.listening.passage", "sk.reading.error", "sk.reading.cloze", "sk.reading.sentence_cloze", "sk.reading.comprehension", "sk.writing.summary"],
};

export function statusOf(mastery: number | null, evidence: number): SkillStatus {
  if (mastery == null || evidence < 2) return "untested";
  if (mastery >= 0.75) return "good";
  if (mastery >= 0.45) return "mid";
  return "weak";
}

function hrefFor(s: SkillRow, level: number): { href: string; hrefLabel: string } {
  if (s.kind === "grammar") {
    const pointId = s.id.slice(3); // gr.hsk4-p1 → hsk4-p1
    const lvl = pointId.split("-")[0];
    return { href: `/review/grammar/hsk30/${lvl}/${pointId}`, hrefLabel: "Дүрмийг үзэх + дасгал" };
  }
  if (s.kind === "vocab_level") return { href: `/review/memorize?level=${level}`, hrefLabel: "Үгээ цээжлэх" };
  const part = s.id.split(".")[1];
  return { href: `/test?level=${level}&skill=${encodeURIComponent(s.id)}`, hrefLabel: part === "writing" ? "Бичих дасгал" : "Шалгалтаар дасгалжих" };
}

const GROUPS: { key: string; title: string; icon: string; match: (s: SkillRow) => boolean }[] = [
  { key: "vocab", title: "Үгийн сан", icon: "📚", match: (s) => s.kind === "vocab_level" },
  { key: "grammar", title: "Дүрэм", icon: "🧩", match: (s) => s.kind === "grammar" },
  { key: "listening", title: "Сонсгол", icon: "👂", match: (s) => s.id.startsWith("sk.listening.") },
  { key: "reading", title: "Уншлага", icon: "📖", match: (s) => s.id.startsWith("sk.reading.") },
  { key: "writing", title: "Бичих", icon: "✍️", match: (s) => s.id.startsWith("sk.writing.") },
];

let skillsCache: Promise<SkillRow[]> | null = null;
export function loadSkills(): Promise<SkillRow[]> {
  if (!supabase || !hasSupabaseConfig) return Promise.resolve([]);
  if (!skillsCache) {
    const client = supabase;
    skillsCache = (async () => {
      const { data, error } = await client.from("skills").select("id,kind,hsk_level,name_mn,name_zh,desc_mn,sort").order("sort");
      if (error) {
        skillsCache = null;
        return [];
      }
      return (data ?? []) as SkillRow[];
    })();
  }
  return skillsCache;
}

/** Эзэмшлийг дахин тооцоод (RPC) уншина. Зочин бол local SRS-ээс зөвхөн үгийн санг тооцно. */
export async function loadMastery(userId: string | null, recompute = true): Promise<Map<string, MasteryRow>> {
  const map = new Map<string, MasteryRow>();
  if (!supabase || !hasSupabaseConfig || !userId) return map;
  if (recompute) {
    await supabase.rpc("compute_user_skill_mastery", { p_user: userId }).then(() => undefined, () => undefined);
  }
  const { data } = await supabase
    .from("user_skill_mastery")
    .select("skill_id,mastery,evidence_n,correct_n,last_at")
    .eq("user_id", userId);
  for (const r of (data ?? []) as MasteryRow[]) map.set(r.skill_id, { ...r, mastery: Number(r.mastery) });
  return map;
}

export function buildSkillMap(level: number, skills: SkillRow[], mastery: Map<string, MasteryRow>, guest: boolean): SkillMap {
  const tags = new Set(LEVEL_SKILL_TAGS[level] ?? []);
  const relevant = skills.filter(
    (s) => (s.kind === "grammar" && s.hsk_level === level) || (s.kind === "vocab_level" && s.hsk_level === level) || (s.kind === "skill" && tags.has(s.id))
  );
  const items: SkillMapItem[] = relevant.map((s) => {
    let m = mastery.get(s.id);
    // Зочин: үгийн санг төхөөрөмжийн SRS-ээс
    if (!m && guest && s.kind === "vocab_level") {
      const studied = readLocalStudiedWordIds().length;
      if (studied > 0) m = { skill_id: s.id, mastery: Math.min(1, studied / 600), evidence_n: studied, correct_n: studied, last_at: null };
    }
    const mv = m ? m.mastery : null;
    const ev = m?.evidence_n ?? 0;
    return { ...s, mastery: mv, evidence: ev, status: statusOf(mv, ev), ...hrefFor(s, level) };
  });
  const groups = GROUPS.map((g) => ({ key: g.key, title: g.title, icon: g.icon, items: items.filter(g.match) })).filter((g) => g.items.length > 0);
  const counts: Record<SkillStatus, number> = { good: 0, mid: 0, weak: 0, untested: 0 };
  for (const it of items) counts[it.status] += 1;
  const overall = items.length ? items.reduce((s, it) => s + (it.mastery ?? 0), 0) / items.length : 0;
  const tested = items.filter((i) => i.status !== "untested");
  const testedAvg = tested.length ? tested.reduce((s, it) => s + (it.mastery ?? 0), 0) / tested.length : 0;
  return { level, groups, overallPct: Math.round(overall * 100), testedPct: Math.round(testedAvg * 100), counts };
}
