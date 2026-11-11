/**
 * «Тоглож сурах» — нэг тоглоом, олон төрлийн асуулт (Quizlet-ийн «Learn» шиг).
 *
 * Хэрэглэгч ямар үгээр (миний үгс / HSK түвшин), ямар төрлийн асуултаар тоглохоо
 * сонгоно. Үг бүрийг ЗӨВ хариултал дахин асууна; буруу хариулсан үг хэсэг хугацааны
 * дараа өөр төрлөөр эргэж ирнэ. Энд зөвхөн цэвэр логик (I/O-гүй) байна.
 */
import type { HskWordRow } from "@/lib/supabase/hsk-words";

export type LearnMode =
  | "meaning" // ханз → монгол утга сонгох
  | "recall" // монгол утга → ханз сонгох
  | "pinyin" // ханз → пиньинь сонгох
  | "listen" // сонсоод → ханз сонгох
  | "dictation" // сонсоод → ханзаар угсрах
  | "cloze" // жишээ өгүүлбэрийн хоосон зай
  | "radical" // ханзны язгуур
  | "match"; // 5 хос холбох

export const LEARN_MODES: { id: LearnMode; icon: string; label: string; hint: string }[] = [
  { id: "meaning", icon: "🎯", label: "Утга сонгох", hint: "Ханз харж монгол утгыг ол" },
  { id: "recall", icon: "🀄", label: "Ханз сонгох", hint: "Монгол утга харж ханзыг ол" },
  { id: "pinyin", icon: "🔤", label: "Пиньинь", hint: "Ханзны зөв дуудлагыг сонго" },
  { id: "listen", icon: "🎧", label: "Сонсох", hint: "Сонсоод зөв үгийг сонго" },
  { id: "dictation", icon: "👂", label: "Диктант", hint: "Сонсоод ханзаар нь угсар" },
  { id: "match", icon: "🔗", label: "Холбох", hint: "5 үгийг утгатай нь хослуул" },
  { id: "cloze", icon: "✏️", label: "Өгүүлбэр нөхөх", hint: "Жишээ өгүүлбэрийн дутуу үг" },
  { id: "radical", icon: "🧩", label: "Ханз задлах", hint: "Ханзны язгуурыг ол" },
];

export type LearnSettings = {
  modes: LearnMode[];
  /** 0 = бүх үг (марафон). */
  size: number;
  /** Асуулт бүрийн секунд; 0 = цаггүй. */
  timer: number;
  autoAudio: boolean;
  showPinyin: boolean;
};

export const DEFAULT_LEARN_SETTINGS: LearnSettings = {
  modes: ["meaning", "recall", "pinyin", "listen", "dictation", "match"],
  size: 10,
  timer: 0,
  autoAudio: true,
  showPinyin: false,
};

/** Нүүр хуудасны бэлэн тохиргоонууд — тусдаа тоглоом биш, нэг тоглоомын горим. */
export const LEARN_PRESETS: Record<string, Partial<LearnSettings>> = {
  speed: { modes: ["meaning", "recall", "pinyin"], timer: 6, size: 20 },
  dictation: { modes: ["dictation", "listen"], timer: 0, size: 10 },
  marathon: { size: 0, timer: 0 },
  hanzi: { modes: ["radical", "recall", "dictation"], size: 10 },
};

const SETTINGS_KEY = "bs.games.learn.settings";

export function readLearnSettings(): LearnSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_LEARN_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<LearnSettings>;
    const valid = new Set(LEARN_MODES.map((m) => m.id));
    const modes = (parsed.modes ?? []).filter((m) => valid.has(m));
    return {
      ...DEFAULT_LEARN_SETTINGS,
      ...parsed,
      modes: modes.length > 0 ? modes : DEFAULT_LEARN_SETTINGS.modes,
    };
  } catch {
    return DEFAULT_LEARN_SETTINGS;
  }
}

export function writeLearnSettings(s: LearnSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Асуулт                                                               */
/* ------------------------------------------------------------------ */

export type LearnWord = HskWordRow & { id: number };

export type ChoiceQuestion = {
  type: "choice";
  mode: Exclude<LearnMode, "dictation" | "match">;
  word: LearnWord;
  /** Дээд талын жижиг заавар. */
  label: string;
  /** Том харуулах зүйл (ханз / утга / өгүүлбэр). listen үед null. */
  display: string | null;
  sub?: string | null;
  options: string[];
  correct: string;
  /** Сонголтууд ханз эсэх (том үсгээр харуулна). */
  hanziOptions: boolean;
  audio?: string;
};

export type DictationQuestion = {
  type: "dictation";
  mode: "dictation";
  word: LearnWord;
  /** Холилдсон ханзны товчнууд (зөв тэмдэгтүүд + төөрөгдүүлэгч). */
  tiles: string[];
  answer: string;
};

export type MatchQuestion = {
  type: "match";
  mode: "match";
  words: LearnWord[];
};

export type LearnQuestion = ChoiceQuestion | DictationQuestion | MatchQuestion;

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function meaningOf(w: HskWordRow): string {
  return (w.meaning_mn ?? w.meaning_en ?? "").trim();
}

/** Зөв хариулт + 3 өөр буруу сонголт (давхардалгүй). Хангалтгүй бол null. */
function pickOptions(
  correct: string,
  candidates: string[],
  count = 4
): string[] | null {
  const pool = [...new Set(candidates.map((c) => c.trim()).filter((c) => c && c !== correct))];
  if (pool.length < 2) return null;
  return shuffle([correct, ...shuffle(pool).slice(0, count - 1)]);
}

/** Энэ үгэнд тухайн төрлийн асуулт зохиож болох эсэх. */
export function modeFits(mode: LearnMode, w: LearnWord): boolean {
  const zh = w.simplified ?? "";
  switch (mode) {
    case "meaning":
    case "recall":
      return Boolean(meaningOf(w));
    case "pinyin":
      return Boolean(w.pinyin?.trim());
    case "listen":
    case "dictation":
      return zh.length > 0 && zh.length <= 4;
    case "cloze":
      return Boolean(w.example_zh && zh && w.example_zh.includes(zh) && w.example_zh.length > zh.length + 1);
    case "radical":
      return zh.length === 1 && Boolean(w.radical?.trim()) && w.radical !== zh;
    case "match":
      return Boolean(meaningOf(w));
  }
}

/**
 * Нэг үгэнд нэг асуулт зохионо. `pool` — төөрөгдүүлэгч сонголт авах бүх үг.
 * Зохиож чадахгүй (сонголт хүрэлцэхгүй) бол null — дуудагч өөр төрөл туршина.
 */
export function buildQuestion(
  mode: Exclude<LearnMode, "match">,
  word: LearnWord,
  pool: LearnWord[]
): ChoiceQuestion | DictationQuestion | null {
  if (!modeFits(mode, word)) return null;
  const zh = word.simplified ?? "";
  const others = pool.filter((p) => p.id !== word.id);
  // Ижил урттай үгс илүү «төөрөгдүүлдэг» тул эхэлж авна.
  const sameLen = others.filter((p) => (p.simplified ?? "").length === zh.length);
  const hanziCandidates = [...sameLen, ...others].map((p) => p.simplified ?? "");

  if (mode === "meaning") {
    const correct = meaningOf(word);
    const options = pickOptions(correct, others.map(meaningOf));
    if (!options) return null;
    return {
      type: "choice",
      mode,
      word,
      label: "Энэ үгийн утга аль нь вэ?",
      display: zh,
      sub: word.pinyin ?? null,
      options,
      correct,
      hanziOptions: false,
      audio: zh,
    };
  }
  if (mode === "recall") {
    const options = pickOptions(zh, hanziCandidates);
    if (!options) return null;
    return {
      type: "choice",
      mode,
      word,
      label: "Аль ханз вэ?",
      display: meaningOf(word),
      options,
      correct: zh,
      hanziOptions: true,
    };
  }
  if (mode === "pinyin") {
    const correct = (word.pinyin ?? "").trim();
    const options = pickOptions(
      correct,
      [...sameLen, ...others].map((p) => p.pinyin ?? "")
    );
    if (!options) return null;
    return {
      type: "choice",
      mode,
      word,
      label: "Зөв дуудлага аль нь вэ?",
      display: zh,
      sub: meaningOf(word) || null,
      options,
      correct,
      hanziOptions: false,
    };
  }
  if (mode === "listen") {
    const options = pickOptions(zh, hanziCandidates);
    if (!options) return null;
    return {
      type: "choice",
      mode,
      word,
      label: "Сонсоод зөв үгийг сонго",
      display: null,
      options,
      correct: zh,
      hanziOptions: true,
      audio: zh,
    };
  }
  if (mode === "cloze") {
    const options = pickOptions(zh, hanziCandidates);
    if (!options) return null;
    return {
      type: "choice",
      mode,
      word,
      label: "Хоосон зайд аль үг орох вэ?",
      display: (word.example_zh ?? "").replace(zh, "＿＿"),
      sub: word.example_mn ?? null,
      options,
      correct: zh,
      hanziOptions: true,
    };
  }
  if (mode === "radical") {
    const correct = (word.radical ?? "").trim();
    const options = pickOptions(
      correct,
      pool.map((p) => p.radical ?? "")
    );
    if (!options) return null;
    return {
      type: "choice",
      mode,
      word,
      label: "Энэ ханзны язгуур (үндсэн хэсэг) аль нь вэ?",
      display: zh,
      sub: meaningOf(word) || null,
      options,
      correct,
      hanziOptions: true,
    };
  }
  // dictation
  const chars = [...zh];
  const distractors = shuffle(
    [...new Set(others.flatMap((p) => [...(p.simplified ?? "")]))].filter(
      (c) => !chars.includes(c)
    )
  ).slice(0, Math.max(3, 6 - chars.length));
  return {
    type: "dictation",
    mode: "dictation",
    word,
    tiles: shuffle([...chars, ...distractors]),
    answer: zh,
  };
}

/* ------------------------------------------------------------------ */
/* Сесс: үг бүрийг зөв хариултал                                        */
/* ------------------------------------------------------------------ */

export type LearnState = {
  /** Одоо асуух дараалал (үгийн id). */
  queue: number[];
  /** Үг тус бүр хэдэн удаа асуугдсан — төрлийг ээлжлүүлэхэд. */
  asked: Record<number, number>;
  mastered: number[];
  /** Эхний оролдлогоор алдсан үгс. */
  missed: number[];
  total: number;
};

export function startLearn(words: LearnWord[], size: number): LearnState {
  const picked = size > 0 ? shuffle(words).slice(0, size) : shuffle(words);
  return {
    queue: picked.map((w) => w.id),
    asked: {},
    mastered: [],
    missed: [],
    total: picked.length,
  };
}

/** Хариултын дараах төлөв. Буруу бол үг 3 асуултын дараа эргэж ирнэ. */
export function answerLearn(state: LearnState, wordId: number, correct: boolean): LearnState {
  const rest = state.queue.filter((id) => id !== wordId);
  const asked = { ...state.asked, [wordId]: (state.asked[wordId] ?? 0) + 1 };
  if (correct) {
    return { ...state, queue: rest, asked, mastered: [...state.mastered, wordId] };
  }
  const at = Math.min(3, rest.length);
  const queue = [...rest.slice(0, at), wordId, ...rest.slice(at)];
  return {
    ...state,
    queue,
    asked,
    missed: state.missed.includes(wordId) ? state.missed : [...state.missed, wordId],
  };
}

/**
 * Дараагийн асуулт. Холбох (match) идэвхтэй бол 6 асуулт тутамд, дараалалд 5-аас
 * дээш үг үлдсэн үед нэг холбох үе оруулна.
 */
export function nextQuestion(
  state: LearnState,
  byId: Map<number, LearnWord>,
  pool: LearnWord[],
  settings: LearnSettings,
  questionNo: number
): LearnQuestion | null {
  const head = byId.get(state.queue[0]);
  if (!head) return null;

  const single = settings.modes.filter((m): m is Exclude<LearnMode, "match"> => m !== "match");
  if (
    settings.modes.includes("match") &&
    state.queue.length >= 5 &&
    (single.length === 0 || questionNo % 6 === 5)
  ) {
    const words = state.queue
      .slice(0, 5)
      .map((id) => byId.get(id))
      .filter((w): w is LearnWord => Boolean(w && modeFits("match", w)));
    if (words.length === 5) return { type: "match", mode: "match", words };
  }

  // Үг дахин асуугдах бүрт өөр төрлөөр: (асуугдсан тоо + дугаар) -аар эргүүлнэ.
  const order = single.length > 0 ? single : (["meaning", "recall"] as const);
  const start = ((state.asked[head.id] ?? 0) + questionNo) % order.length;
  for (let i = 0; i < order.length; i += 1) {
    const q = buildQuestion(order[(start + i) % order.length], head, pool);
    if (q) return q;
  }
  // Сонгосон төрлүүд энэ үгэнд тохирохгүй бол үндсэн хоёр төрлөөр нөхнө.
  return buildQuestion("meaning", head, pool) ?? buildQuestion("recall", head, pool);
}
