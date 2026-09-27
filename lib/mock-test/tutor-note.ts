/**
 * «Хувийн багш» (私教) — загвар шалгалтын асуулт бүрийн бүтэцтэй тайлбар.
 *
 * `mock_test_questions.tutor_note` (jsonb, 069 migration) баганы хэлбэр.
 * Энд агуулга ЗОХИОХГҮЙ — зөвхөн өгөгдлийн сангаас ирснийг шалгаж, хэлбэржүүлнэ.
 * Зөвхөн `why` заавал; бусад талбар байхгүй бол UI тэр хэсгээ харуулахгүй.
 */

export type TutorTranscriptLine = {
  /** Юу гэж хэлсэн (ханз). 男/女 гэх мэт ярьсан хүний угтвар байж болно. */
  zh: string;
  pinyin?: string;
  /** Монгол утга. */
  mn?: string;
};

export type TutorWord = {
  zh: string;
  pinyin: string;
  mn: string;
};

export type TutorNote = {
  /** Сонсгол: юу гэж хэлсэн, мөр мөрөөр. */
  transcript?: TutorTranscriptLine[];
  /** Хариултыг шийдсэн нэг өгүүлбэр/хэллэг (zh). */
  key?: string;
  /** Түүний утга (mn). */
  keyMn?: string;
  /** Зөв сонголт яагаад зөв бэ (mn). ЗААВАЛ. */
  why: string;
  /** Сонголт бүр яагаад буруу вэ — түлхүүр нь A/B/C… (mn). */
  wrong?: Record<string, string>;
  /** Асуултын урхи (mn). */
  trap?: string;
  /** Арга зүйн зөвлөгөө (mn). */
  tip?: string;
  /** 3–6 түлхүүр үг. */
  words?: TutorWord[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmptyCollection(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (isRecord(value)) return Object.keys(value).length === 0;
  return false;
}

/** Хоосон биш мөр бол trim-лээд буцаана, үгүй бол undefined. */
function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseTranscript(value: unknown): TutorTranscriptLine[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value)) return undefined;
  const lines: TutorTranscriptLine[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    const zh = optionalText(item.zh);
    if (!zh) return undefined;
    const line: TutorTranscriptLine = { zh };
    const pinyin = optionalText(item.pinyin);
    const mn = optionalText(item.mn);
    if (pinyin) line.pinyin = pinyin;
    if (mn) line.mn = mn;
    lines.push(line);
  }
  return lines.length > 0 ? lines : undefined;
}

function parseWrong(value: unknown): Record<string, string> | undefined {
  if (value == null) return undefined;
  if (!isRecord(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, text] of Object.entries(value)) {
    const k = key.trim();
    const t = optionalText(text);
    if (!k || !t) return undefined;
    out[k] = t;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseWords(value: unknown): TutorWord[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value)) return undefined;
  const words: TutorWord[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    const zh = optionalText(item.zh);
    if (!zh) return undefined;
    words.push({
      zh,
      pinyin: optionalText(item.pinyin) ?? "",
      mn: optionalText(item.mn) ?? "",
    });
  }
  return words.length > 0 ? words : undefined;
}

/**
 * Дурын утгыг (jsonb багана, JSON string, админы буулгасан объект) TutorNote
 * болгож шалгана. Хэлбэр буруу, эсвэл `why` байхгүй бол null.
 *
 * Хатуу дүрэм: сонголттой талбар БАЙГАА боловч буруу төрөлтэй бол бүхэлд нь
 * null — админы импорт дээр алдааг нуухгүйн тулд.
 */
export function parseTutorNote(input: unknown): TutorNote | null {
  let raw: unknown = input;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    try {
      raw = JSON.parse(text);
    } catch {
      return null;
    }
  }
  if (!isRecord(raw)) return null;

  const why = optionalText(raw.why);
  if (!why) return null;

  const note: TutorNote = { why };

  // Хоосон массив/объект = байхгүйтэй адил (унших асуултад transcript: [] гэх мэт).
  if (raw.transcript != null && !isEmptyCollection(raw.transcript)) {
    const transcript = parseTranscript(raw.transcript);
    if (!transcript) return null;
    note.transcript = transcript;
  }
  if (raw.key != null) {
    if (typeof raw.key !== "string") return null;
    const key = optionalText(raw.key);
    if (key) note.key = key;
  }
  if (raw.keyMn != null) {
    if (typeof raw.keyMn !== "string") return null;
    const keyMn = optionalText(raw.keyMn);
    if (keyMn) note.keyMn = keyMn;
  }
  if (raw.wrong != null && !isEmptyCollection(raw.wrong)) {
    const wrong = parseWrong(raw.wrong);
    if (!wrong) return null;
    note.wrong = wrong;
  }
  if (raw.trap != null) {
    if (typeof raw.trap !== "string") return null;
    const trap = optionalText(raw.trap);
    if (trap) note.trap = trap;
  }
  if (raw.tip != null) {
    if (typeof raw.tip !== "string") return null;
    const tip = optionalText(raw.tip);
    if (tip) note.tip = tip;
  }
  if (raw.words != null && !isEmptyCollection(raw.words)) {
    const words = parseWords(raw.words);
    if (!words) return null;
    note.words = words;
  }

  return note;
}

/** Тайлбарын дотор тухайн мөр «түлхүүр» мөр мөн үү (агуулж байгаагаар нь). */
export function isTutorKeyLine(line: TutorTranscriptLine, key: string | undefined): boolean {
  if (!key) return false;
  const k = key.trim();
  if (!k) return false;
  if (line.zh.includes(k)) return true;
  // Түлхүүр нь бүтэн өгүүлбэр, мөр нь түүний хэсэг байж болно.
  const body = line.zh.replace(/^(男|女)\s*[:：]\s*/, "").trim();
  return body.length >= 4 && k.includes(body);
}
