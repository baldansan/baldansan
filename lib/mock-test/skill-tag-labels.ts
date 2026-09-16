/**
 * Асуултын шошгуудын МОНГОЛ нэр.
 *
 * Яагаад энд байна вэ: `skill_tags` хүснэгтийн `label_mn` багана бүх мөрөнд
 * шошгын кодтой яг адилхан («sk.listening.judge») бичигдсэн байсан тул
 * дэлгэц дээр ойлгомжгүй англи/цэгтэй код харагдаж байв. Энэ файл нь кодыг
 * хүн уншиж ойлгохоор нэр рүү хөрвүүлнэ.
 *
 * ДҮРЭМ: түлхүүрүүд нь өгөгдлийн сангийн `tags` массив дахь кодууд —
 * ОРЧУУЛЖ БОЛОХГҮЙ. Зөвхөн утгыг нь монголоор бичнэ.
 */

export const SKILL_TAG_LABELS_MN: Record<string, string> = {
  // ---- Сонсгол ----
  "sk.listening.picture_choice": "Сонсоод зураг сонгох",
  "sk.listening.picture_judge": "Сонсоод зураг тохирч байгаа эсэхийг шийдэх",
  "sk.listening.picture_match": "Сонсоод зураг тааруулах",
  "sk.listening.judge": "Сонсоод өгүүлбэр зөв эсэхийг шийдэх",
  "sk.listening.dialogue": "Богино яриа сонсох",
  "sk.listening.interview": "Ярилцлага сонсох",
  "sk.listening.passage": "Урт яриа сонсох",
  "sk.listening.short_news": "Богино мэдээ сонсох",

  // ---- Унших ----
  "sk.reading.word_picture": "Үг ↔ зураг тааруулах",
  "sk.reading.picture_match": "Өгүүлбэр ↔ зураг тааруулах",
  "sk.reading.qa_match": "Асуулт ↔ хариу тааруулах",
  "sk.reading.match": "Өгүүлбэр тааруулах",
  "sk.reading.match_statement": "Агуулгад тохирох өгүүлбэр сонгох",
  "sk.reading.judge": "Уншаад зөв эсэхийг шийдэх",
  "sk.reading.cloze": "Цоорхой нөхөх (үг сонгох)",
  "sk.reading.sentence_cloze": "Цоорхойд тохирох өгүүлбэр сонгох",
  "sk.reading.comprehension": "Уншиж ойлгох",
  "sk.reading.order": "Өгүүлбэр дараалуулах",
  "sk.reading.error": "Алдаатай өгүүлбэр олох",

  // ---- Бичих ----
  "sk.writing.char": "Ханз бичих",
  "sk.writing.order": "Үг эмхэтгэж өгүүлбэр болгох",
  "sk.writing.complete": "Өгсөн үгээр өгүүлбэр зохиох",
  "sk.writing.picture": "Зураг харж өгүүлбэр бичих",
  "sk.writing.essay": "Эссэ бичих",
  "sk.writing.essay_picture": "Зурагт тулгуурлан эссэ бичих",
  "sk.writing.summary": "Уншсанаа товчлон бичих",

  // ---- Дүрэм ----
  "gr.adverb_order": "Дайвар үгийн байрлал",
  "gr.adverb_yijing": "已经 (аль хэдийн)",
  "gr.ba": "把 бүтэц",
  "gr.ba_de_complement": "把 + үр дүнгийн гишүүн",
  "gr.ba_translate": "把 бүтцийн орчуулга",
  "gr.bu_yunxu": "不允许 (зөвшөөрөхгүй)",
  "gr.chusheng_zai": "出生在 (хаана төрсөн)",
  "gr.complement": "Үйлийн гишүүн (补语)",
  "gr.degree": "Хэмжээ, зэргийн илэрхийлэл",
  "gr.dui_de": "对…的 хэлбэр",
  "gr.error_detection": "Өгүүлбэрийн алдаа олох",
  "gr.fraction": "Бутархай, хувь илэрхийлэх",
  "gr.gen_chabuduo": "跟…差不多 (…-тай ойролцоо)",
  "gr.jiang_future": "将 (ирээдүй цаг)",
  "gr.jiujing": "究竟 (эцэст нь, яг)",
  "gr.sentence_order": "Өгүүлбэрийн үгийн дараалал",
  "gr.shang_chulai": "上 / 出来 чиглэлийн гишүүн",
  "gr.shide": "是…的 бүтэц",
  "gr.tai_le": "太…了 (хэт …)",
  "gr.you": "又 (дахин, бас)",
  "gr.you_shide": "有…的 хэлбэр",
  "gr.zaici": "再次 (дахин нэг удаа)",

  // ---- Үгийн сан ----
  "voc.hsk1": "HSK 1 үгийн сан",
  "voc.hsk2": "HSK 2 үгийн сан",
  "voc.hsk3": "HSK 3 үгийн сан",
  "voc.hsk4": "HSK 4 үгийн сан",
  "voc.hsk5": "HSK 5 үгийн сан",
  "voc.hsk6": "HSK 6 үгийн сан",
};

export type SkillTagCategory = "skill" | "grammar" | "vocab" | "other";

export function skillTagCategory(tag: string): SkillTagCategory {
  if (tag.startsWith("sk.")) return "skill";
  if (tag.startsWith("gr.")) return "grammar";
  if (tag.startsWith("voc.")) return "vocab";
  return "other";
}

export const SKILL_TAG_CATEGORY_LABELS_MN: Record<SkillTagCategory, string> = {
  skill: "Чадвар",
  grammar: "Дүрэм",
  vocab: "Үгийн сан",
  other: "Бусад",
};

/**
 * Шошгыг монгол нэр рүү хөрвүүлнэ. Мэдэхгүй шошгыг ЗОХИОХГҮЙ — кодыг нь
 * буцаана (дэлгэц дээр код харагдвал энэ жагсаалтад дутуу байна гэсэн үг).
 */
export function skillTagLabelMn(tag: string): string {
  return SKILL_TAG_LABELS_MN[tag] ?? tag;
}
