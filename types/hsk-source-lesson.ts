/**
 * ЭХ СУРВАЛЖИЙН САН — HSK Standard Course номын хичээл бүрийн БҮХ агуулга,
 * номд байгаа хэлбэрээрээ (хятад + пиньинь + англи). Монгол орчуулга, заах
 * тайлбар, зохиомол дасгал ЭНД ОРОХГҮЙ — тэдгээр нь дараагийн алхмын
 * (заах арга барил → хичээл үйлдвэрлэх) гаралт.
 *
 * Зарчим: ном юу хэлж байна, тэр л. Уншигдахгүй/тодорхойгүй бол `unclear`
 * талбарт тэмдэглэнэ, таахгүй. Хуудасны дугаар бүрийг PDF хуудсаар тэмдэглэнэ.
 *
 * Хадгалалт: `hsk_source_lessons.payload` (jsonb), нэг мөр = нэг хичээл.
 */

/** PDF хуудсын дугаар (номын хэвлэсэн дугаар биш). */
export type PdfPage = number;

export type SourceRef = {
  /** textbook | teacher | workbook | workbook_answers (дасгалын номын 录音文本及答案 товхимол / HSK1 хариултын ном) | textbook_answers (课本参考答案) */
  book: "textbook" | "teacher" | "workbook" | "workbook_answers" | "textbook_answers";
  pages: PdfPage[];
};

export type SourceWord = {
  /** Номын дугаар (生词 хүснэгт). */
  n: number;
  zh: string;
  pinyin: string;
  /** Үгийн ай номд байгаагаар: n., v., adj., adv., m., conj., prep., pron., num., part., aux. … */
  pos?: string;
  en: string;
  /** * тэмдэгтэй (тухайн түвшний жагсаалтаас гадуурх) эсэх. */
  star?: boolean;
  /** Аль бичвэрт анх гарч байгаа (1–4). */
  text?: number;
};

export type SourceProperNoun = { zh: string; pinyin: string; en: string };

export type SourceLine = {
  /** Ярьж буй хүн (小丽, 周太太, 秘书…) — өгүүлэмж бол хоосон. */
  speaker?: string;
  zh: string;
  pinyin?: string;
};

export type SourceText = {
  /** 课文 дугаар 1–4. */
  n: number;
  /** Номын гарчиг (下山的路上) — байхгүй бол хоосон. */
  title_zh?: string;
  title_en?: string;
  /** Яриа (dialogue) уу, өгүүлэмж (narrative) үү. */
  kind: "dialogue" | "narrative";
  lines: SourceLine[];
  /** English Version — номын англи орчуулга (HSK1–2-т байдаг), бүтнээр. */
  english_version?: string;
  /** Аудио файлын нэр (мэдэгдэж байвал) — hsk3-textbook-0201.mp3 */
  audio?: string;
  new_words: SourceWord[];
  proper_nouns?: SourceProperNoun[];
};

export type SourceExample = {
  n?: number;
  zh: string;
  /** Номын хаалтан доторх тайлбар: (说话的人在楼上) */
  note_zh?: string;
};

export type SourceGrammarPoint = {
  n: number;
  /** 注释-ийн гарчиг: 简单趋向补语 */
  title_zh: string;
  title_en?: string;
  /** Тайлбар номд байгаагаар (хятад, англи хоёулаа байвал хоёулаа). */
  explanation_zh: string;
  explanation_en?: string;
  /** Бүтцийн хүснэгт байвал мөр мөрөөр: ["桌子上 | 放着 | 一杯咖啡"] */
  structure_rows?: string[];
  examples: SourceExample[];
  /** 练一练 — номын даалгавар, хариулт хэвлэгдээгүй бол answer байхгүй. */
  practice?: SourceExerciseItem[];
  practice_instruction_zh?: string;
};

export type SourceExerciseItem = {
  n?: number | string;
  /** Асуулт/өгүүлбэр номд байгаагаар, хоосон зайг ________ гэж. */
  zh: string;
  /** Пиньинь (HSK1–2 дасгалын номд ханзын дээр хэвлэгддэг). */
  pinyin?: string;
  /** Сануулга үг: (回家) */
  hint_zh?: string;
  /** Сонголтууд (A–F гэх мэт түлхүүртэй) */
  options?: Record<string, string>;
  /** Албан ёсны хариулт (багшийн ном / хариултын ном) — байхгүй бол ОРУУЛАХГҮЙ. */
  answer?: string;
  /** Хариултын эх сурвалж. */
  answer_ref?: SourceRef;
  /** Сонсголын бичвэр (дасгалын номын сонсгол). */
  transcript_zh?: string;
  /** Зурагтай даалгаврын зургийн тайлбар (номд текст байхгүй тул зургаас товч, объектив). */
  picture_desc_en?: string;
};

export type SourceExercise = {
  /** 练习 дугаар (1, 2, 3 …) эсвэл хэсгийн нэр. */
  n: number | string;
  /** 朗读 / 选词填空 / 描述图片 / 回答问题 / 听力 第一部分 … */
  type_zh: string;
  instruction_zh: string;
  instruction_en?: string;
  /** Үгийн сан (选词填空). */
  word_bank?: string[][];
  items: SourceExerciseItem[];
  audio?: string;
};

export type SourceCharacters = {
  /** 汉字知识 гарчиг: 形声字1 — байхгүй бол хоосон. */
  knowledge_title_zh?: string;
  knowledge_zh?: string;
  knowledge_en?: string;
  characters?: { zh: string; pinyin?: string; note_zh?: string }[];
  /** 旧字新词: 办公室 + 大楼 → 办公大楼 */
  word_game?: { parts: string[]; result: string; en?: string }[];
  /** Ханз ялгах хосууд (дасгалын номын 汉字辨认): 白/百 */
  confusable_pairs?: string[][];
};

export type SourceTeacher = {
  ref: SourceRef;
  /** 教学内容和教学目标 — хүснэгтийн мөрүүд номд байгаагаар. */
  objectives_zh: string[];
  /** 教学步骤 — хэсэг бүрийн гарчиг + бичвэр (热身, 生词, 课文, 语言点, 练习 …). */
  steps: { title_zh: string; body_zh: string }[];
  /** 注意 / 辨析 / 对比 — багшийн номын анхааруулга, харьцуулалт. */
  notes_zh: string[];
  /** Багшийн номын 热身-ийн хариулт, 课文 асуулт-хариулт. */
  warmup_answers_zh?: string[];
  text_questions?: { text: number; q_zh: string; a_zh?: string }[];
  /** 本课小结 */
  summary_zh?: string;
};

export type SourceWorkbook = {
  ref: SourceRef;
  /** 听力 (4 хэсэг), 阅读 (3 хэсэг), 书写 (2–4 хэсэг), 复习 */
  sections: SourceExercise[];
  /** Хариултын эх сурвалж (багшийн номын хавсралт / хариултын ном). */
  answers_ref?: SourceRef;
};

export type HskSourceLesson = {
  /** "hsk1" … "hsk6" */
  level: string;
  /** Хичээлийн дугаар номынхоор (4B: 11–20, 5B: 19–36, 6B: 21–40). */
  lesson: number;
  /** Ном: "HSK1", "HSK4B" … */
  book: string;
  title_zh: string;
  title_pinyin: string;
  title_en?: string;
  textbook: {
    ref: SourceRef;
    warmup?: { instruction_zh: string; instruction_en?: string; items?: string[]; pictures_desc_en?: string[] }[];
    /** 语音 (HSK1–2): пиньинь, хөг, дуудлагын дасгал — номд байгаагаар. */
    pronunciation?: {
      title_zh: string;
      /** Хүснэгт/мөрүүд номд байгаагаар: "b p m f", "bā bá bǎ bà" … */
      rows: string[];
      notes_zh?: string[];
      notes_en?: string[];
      audio?: string;
    }[];
    texts: SourceText[];
    /** 课堂用语 (HSK1): ангийн хэллэг. */
    classroom_expressions?: { zh: string; pinyin: string; en: string }[];
    /** 拼音课文 — пиньинь бичвэр бүтнээр (мөр мөрөөр) — texts.lines.pinyin-д тараасан бол дахин хэрэггүй. */
    grammar: SourceGrammarPoint[];
    exercises: SourceExercise[];
    characters?: SourceCharacters;
    /** 运用 — 双人活动/小组活动 даалгаврууд */
    application?: { title_zh: string; instruction_zh: string; instruction_en?: string; example_zh?: string[] }[];
    saying?: { zh: string; pinyin: string; en?: string; explanation_zh?: string; explanation_en?: string };
    culture?: { title_zh: string; body_zh: string; body_en?: string };
  };
  teacher?: SourceTeacher;
  workbook?: SourceWorkbook;
  /** Аудио файлууд (мэдэгдэж байвал): textbook clips, workbook parts. */
  audio?: { textbook: string[]; workbook: string[] };
  /** Уншигдахгүй, эргэлзээтэй, номын өөрийн зөрүү — таахын оронд энд. */
  unclear: string[];
  /** Шалгалтын тэмдэглэл: ямар хуудсыг зургаар шалгасан. */
  verified_pages: PdfPage[];
  schema_version: 1;
};
