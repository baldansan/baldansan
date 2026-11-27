/**
 * «Тэмээ багшийн хичээл» — номд байхгүй, багш ангид амаар заадаг хэсгийг
 * дэлгэц дэлгэцээр заах давхарга. Нэг дэлгэц = нэг санаа.
 *
 * Агуулга нь repo дотор `content/temee-lessons/<lessonId>.json` файлд байна
 * (өгөгдлийн сан биш) — тиймээс SQL, импорт шаардахгүй, git-ээр хянагдана.
 * Стандарт: docs/temee-lesson/STANDARD.md
 *
 * ГОЛ ДҮРЭМ: дасгал, сорилын асуулт бүр `taught` талбартаа аль дэлгэцэд
 * заагдсанаа заавал бичнэ. `npm run temee:check` үүнийг шалгана.
 */
import type { TemeePose } from "@/lib/temee/poses";

/**
 * Дууны эх сурвалж (богино бичлэг):
 *  - "syl:ma1"   → /open/audio-cmn/syllables/cmn-ma1.mp3 (хүний бичлэг, repo дотор)
 *  - "word:老师" → audio-cmn үгийн бичлэг (CDN)
 *  - "file:x.mp3"→ /temee-lesson/<lessonId>/x.mp3 (энэ хичээлд зориулж хийсэн)
 */
export type TemeeAudioRef = string;

export type TemeeAudio = {
  /** Товчин дээрх бичвэр (пиньинь эсвэл ханз). */
  label: string;
  /** Дараалан тоглох бичлэгүүд. */
  src: TemeeAudioRef[];
  /** Дагаж хэлэхийг сануулах эсэх. */
  repeat?: boolean;
};

export type TemeeVisual =
  | { kind: "hanzi"; zh: string; py?: string; mn?: string; note?: string }
  | {
      kind: "syllable";
      py: string;
      parts: { t: string; label: string }[];
    }
  | { kind: "tone"; tone: 1 | 2 | 3 | 4; cue: string }
  | { kind: "tones4"; items: { tone: 1 | 2 | 3 | 4; py: string; mn: string }[] }
  | {
      kind: "compose";
      parts: { zh: string; mn: string }[];
      result: { zh: string; py?: string; mn: string };
    }
  | { kind: "columns"; cols: { head: string; sub?: string; items: string[] }[] }
  | {
      kind: "dialog";
      lines: { who: string; zh: string; py: string; mn: string }[];
    }
  | { kind: "image"; src: string; alt: string }
  | { kind: "pose"; pose: TemeePose }
  | { kind: "grid"; items: { label: string; sub?: string; src?: TemeeAudioRef[] }[] }
  | {
      kind: "pair";
      a: { label: string; hint: string; src: TemeeAudioRef[] };
      b: { label: string; hint: string; src: TemeeAudioRef[] };
    }
  | { kind: "blend"; items: { a: string; b: string; result: string; src: TemeeAudioRef[] }[] }
  | { kind: "strokes"; items: { glyph: string; name: string; dir: string }[] }
  | { kind: "order"; items: { zh: string; steps: string[]; rule: string }[] };

export type TemeeCheck = {
  q: string;
  /** Сонсоод хариулах асуулт бол. */
  audio?: TemeeAudio;
  options: string[];
  /** Зөв сонголтын индекс (0-ээс). */
  answer: number;
  /** Буруу хариулахад Балдан хэлэх нэг мөр. */
  wrong?: string;
};

export type TemeeScreen = {
  id: string;
  title: string;
  /** Нөхцөл байдлын зураг (/temee-lesson/<lessonId>/img/…). Дүрслэлийн дээр гарна. */
  image?: string;
  visual?: TemeeVisual;
  /** Балдангийн богино өгүүлбэрүүд (2–4). */
  say: string[];
  pose?: TemeePose;
  audio?: TemeeAudio[];
  check?: TemeeCheck;
  /** Хэд хэдэн жижиг шалгалт дараалсан бол. */
  checks?: TemeeCheck[];
};

export type TemeePart = { id: string; title: string; screens: TemeeScreen[] };

export type TemeeSection = {
  /** Замд харагдах нэр. */
  label: string;
  hint: string;
  minutes: number;
  parts: TemeePart[];
};

export type TemeePracticeItem = {
  id: string;
  /** Нөхцөл байдлын тайлбар (зураг байхгүй үед ч ойлгогдоно). */
  scene?: string;
  image?: string;
  q: string;
  audio?: TemeeAudio;
  options: string[];
  answer: number;
  explain: string;
  /** Аль дэлгэцэд заасан (дэлгэцийн id-ууд). ЗААВАЛ. */
  taught: string[];
};

export type TemeeQuizItem = {
  id: string;
  question: string;
  /** Сонсох асуулт бол нэг бичлэг (file:/syl:/word:). */
  audio?: TemeeAudioRef;
  options: string[];
  /** Зөв хариултын бичвэр (options-д яг байх ёстой). */
  answer: string;
  explanation: string;
  /** Аль дэлгэцэд заасан. ЗААВАЛ. */
  taught: string[];
};

export type TemeeLesson = {
  lessonId: string;
  version: number;
  /** 1-р үеийн богино оршил (хуучин урт оршлыг орлоно). */
  intro_mn: string;
  warmup_mn?: string;
  /** Үгийн картад үлдээх үгс (ханзаар). Байхгүй бол бүгд. */
  vocabKeep?: string[];
  /** Хуучин «Дүрэм» үеийг нуух эсэх (шинэ үе орлож байгаа бол). */
  replacesGrammar?: boolean;
  teach: TemeeSection;
  /** Авианы дасгал зэрэг нэмэлт үе (Эх бичвэрийн дараа). */
  sounds?: TemeeSection;
  practice?: TemeePracticeItem[];
  quiz?: TemeeQuizItem[];
};

/** Клиентэд багцгүйгээр хэрэгтэй жижиг мэдээлэл (хичээлийн нүүр, зам). */
export type TemeeLessonMeta = {
  vocabCount?: number;
  quizCount?: number;
  hasSounds: boolean;
  hasPractice: boolean;
  replacesGrammar: boolean;
  teachLabel: string;
  teachMinutes?: number;
  soundsLabel?: string;
  soundsMinutes?: number;
};
