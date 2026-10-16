/** Ролийн ярианы сценар (content/talk-scenarios/*.json) */

export type TalkLevel = "HSK1" | "HSK2" | "HSK3";

export type TalkLine = {
  zh: string;
  pinyin: string;
  mn: string;
};

export type TalkOption = TalkLine & {
  /** Дараагийн node id; null → яриа дуусна */
  next: string | null;
  /** Сонголтын тайлбар (монгол) — заавал биш */
  tip_mn?: string;
};

export type TalkNode = {
  id: string;
  ai: TalkLine;
  /** Хоосон → төгсгөлийн node */
  options: TalkOption[];
};

export type TalkScenario = {
  id: string;
  emoji: string;
  level: TalkLevel;
  title_mn: string;
  title_zh: string;
  setting_mn: string;
  setting_zh: string;
  /** AI-ийн дүр (ж: 售货员 / худалдагч) */
  ai_role_zh: string;
  ai_role_mn: string;
  /** Хэрэглэгчийн дүр */
  user_role_mn: string;
  /** AI горимын system prompt-д нэмэх нөхцөл (хятадаар) */
  ai_context: string;
  start: string;
  nodes: TalkNode[];
  vocab: TalkLine[];
};

/** Нэг ярианы мессеж (UI + API) */
export type TalkMessage = {
  role: "ai" | "user";
  zh: string;
  pinyin?: string;
  mn?: string;
  /** AI зөөлөн засвар (хэрэглэгчийн өмнөх хариултад) */
  correction?: { zh: string; mn: string } | null;
};

/** /api/talk хариу */
export type TalkApiReply = {
  zh: string;
  pinyin: string;
  mn: string;
  correction?: { zh: string; mn: string } | null;
  /** AI яриаг дуусгасан гэж үзвэл true */
  done?: boolean;
};
