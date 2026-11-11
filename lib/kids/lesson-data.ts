import type { LessonContent } from "@/types/lesson-content";
import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";
import {
  buildLessonPackageAudioPublicBase,
  parsePackageAudioUploadMapFromSourceNote,
  resolveLessonPackagePlayableUrl,
  resolveStorageLessonIdForAudio,
} from "@/lib/lesson/package-audio-resolve";
import { resolveVocabularyAudioUrl } from "@/lib/lesson/teaching-media";

/**
 * Хүүхдийн тоглуулагчийн цэвэр өгөгдөл — YCT (болон бусад) ZIP багцаас
 * (sourceNote.hskStudyContent + teachingImages) бүтээнэ. Client талд зөвхөн энэ очно.
 */

export type KidsWord = {
  zh: string;
  pinyin: string;
  mn: string;
  imageUrl: string | null;
  audioUrl: string | null;
  exampleZh?: string;
  exampleMn?: string;
};

export type KidsDialogue = {
  id: number;
  title: string;
  scene?: string;
  imageUrl: string | null;
  audioUrl: string | null;
  lines: { speaker: string; zh: string; pinyin: string; mn: string }[];
};

export type KidsSongKind = "song" | "chant" | "story" | "read";

export type KidsSong = {
  kind: KidsSongKind;
  title: string;
  audioUrl: string | null;
  imageUrl: string | null;
  lines: { zh: string; pinyin: string; mn: string }[];
};

export type KidsKeySentence = {
  zh: string;
  pinyin: string;
  mn: string;
  teacherMn: string;
  check?: { question: string; options: string[]; answer: number };
};

export type KidsListeningItem = {
  n: number;
  scriptZh: string;
  imageUrl: string | null;
  options: string[];
  optionImages: (string | null)[];
  answer: string;
  explanation: string;
};

/** scriptZh байвал «сонсоод ✓/✗» (ханз нуугдана), байхгүй бол «унш → ✓/✗». */
export type KidsJudgeItem = {
  n: number;
  zh: string;
  scriptZh: string | null;
  imageUrl: string | null;
  answer: boolean;
  explanation: string;
};

export type KidsChoiceItem = {
  n: number;
  questionZh: string;
  questionMn: string;
  imageUrl: string | null;
  options: string[];
  optionImages: (string | null)[];
  answer: string;
  explanation: string;
};

export type KidsLessonData = {
  lessonId: string;
  courseId: string;
  title: string;
  titleZh: string;
  teacherIntro: string;
  heroUrl: string | null;
  videoUrl: string | null;
  videoPoster: string | null;
  words: KidsWord[];
  numbers: KidsWord[];
  dialogues: KidsDialogue[];
  song: KidsSong | null;
  keySentences: KidsKeySentence[];
  test: {
    audioUrl: string | null;
    listening: KidsListeningItem[];
    judge: KidsJudgeItem[];
    choice: KidsChoiceItem[];
  };
  culture: { title: string; text: string; imageUrl: string | null } | null;
  /** Хуруугаар бичиж сурах ханзууд (эхний шинэ үгсээс, 4 хүртэл). */
  writeChars: { char: string; pinyin: string; mn: string }[];
};

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const NUMBER_WORDS = new Set(["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]);

function basename(p: string): string {
  return p.replace(/^.*\//, "").replace(/\.[^.]+$/, "").toLowerCase();
}

export function buildKidsLessonData(
  lesson: LessonContent,
  opts: { videoUrl?: string | null; videoPoster?: string | null } = {}
): KidsLessonData {
  const note = parseLessonSourceNote(lesson.sourceNote);
  const study: Rec = note.format === "json" && isRec(note.data.hskStudyContent) ? note.data.hskStudyContent : {};
  const texts: Rec = isRec(study.texts) ? study.texts : {};
  const workbook: Rec = isRec(study.workbook) ? study.workbook : {};
  const grammar = arr(study.grammar);
  const media: Rec = isRec(study.media) ? study.media : {};

  // ---- зураг: file basename / id / title → url
  const images = (lesson.teachingImages ?? []) as { type?: string; title?: string; url?: string; file?: string }[];
  const byFile = new Map<string, string>();
  const byId = new Map<string, string>();
  const byTitle = new Map<string, string>();
  const bySection = new Map<string, string>();
  for (const im of images) {
    const url = str(im.url);
    if (!url) continue;
    if (im.file) byFile.set(basename(im.file), url);
    if (im.type) byId.set(str(im.type).toLowerCase(), url);
    if (im.title) byTitle.set(str(im.title), url);
  }
  // manifest.media.images (id → file/title) — teachingImages дээр type=id байдаг
  for (const raw of arr(media.images)) {
    if (!isRec(raw)) continue;
    const id = str(raw.id).toLowerCase();
    const file = str(raw.file);
    const url = byId.get(id) ?? (file ? byFile.get(basename(file)) : undefined);
    if (url && str(raw.title) && !byTitle.has(str(raw.title))) byTitle.set(str(raw.title), url);
    const sec = str(raw.section).toLowerCase();
    if (url && sec && !bySection.has(sec)) bySection.set(sec, url);
  }
  const imgByPath = (p: unknown): string | null => {
    const s = str(p);
    if (!s) return null;
    if (/^https?:\/\//i.test(s) || s.startsWith("/")) return s;
    return byFile.get(basename(s)) ?? null;
  };
  const imgForWord = (zh: string): string | null => {
    const exact = byTitle.get(zh);
    if (exact) return exact;
    for (const [title, url] of byTitle) {
      if (title.startsWith(zh + " ") || title.startsWith(zh + "！") || title.startsWith(zh + "!")) return url;
    }
    return null;
  };

  // ---- аудио
  const storageLessonId = resolveStorageLessonIdForAudio(lesson);
  const audioCtx = {
    publicStorageBase: buildLessonPackageAudioPublicBase(lesson.courseId, storageLessonId),
    uploadMap: parsePackageAudioUploadMapFromSourceNote(lesson.sourceNote),
  };
  const audio = (p: unknown): string | null => {
    const s = str(p);
    return s ? resolveLessonPackagePlayableUrl(s, audioCtx) : null;
  };

  // ---- үг
  const allWords: KidsWord[] = lesson.vocabulary.map((w) => ({
    zh: w.chinese,
    pinyin: w.pinyin,
    mn: w.mongolian,
    imageUrl: imgForWord(w.chinese),
    audioUrl: resolveVocabularyAudioUrl(w, lesson.vocabularyAudioMap) ?? null,
    exampleZh: w.exampleChinese || undefined,
    exampleMn: w.exampleMongolian || undefined,
  }));
  const numbers = allWords.filter((w) => NUMBER_WORDS.has(w.zh));
  const words = allWords.filter((w) => !NUMBER_WORDS.has(w.zh));

  // ---- яриа
  const dialogues: KidsDialogue[] = arr(texts.dialogues)
    .filter(isRec)
    .map((d, i) => {
      const lines = arr(d.lines)
        .filter(isRec)
        .map((l) => ({ speaker: str(l.speaker), zh: str(l.zh), pinyin: str(l.pinyin), mn: str(l.mn) }));
      const first = lines[0]?.zh ?? "";
      return {
        id: Number(d.id) || i + 1,
        title: str(d.title_mn) || `Яриа ${i + 1}`,
        scene: str(d.scene_mn) || undefined,
        imageUrl: byId.get(`d${i + 1}`) ?? imgForWord(first) ?? null,
        audioUrl: audio(d.audio ?? d.audioFile),
        lines,
      };
    })
    .filter((d) => d.lines.length > 0);

  // ---- дуу: mainText-ийн сүүлийн догол мөр (эсвэл бүх mainText, яриа байхгүй бол)
  let song: KidsSong | null = null;
  const main: Rec = isRec(texts.mainText) ? texts.mainText : {};
  const sentences = arr(main.sentences).filter(isRec);
  if (sentences.length) {
    const paras = sentences.map((s) => Number(s.paragraph) || 1);
    const lastPara = Math.max(...paras);
    const songLines = (dialogues.length ? sentences.filter((s) => (Number(s.paragraph) || 1) === lastPara) : sentences).map(
      (s) => ({ zh: str(s.zh), pinyin: str(s.pinyin), mn: str(s.mn) })
    );
    const label = `${str(main.title_mn)} ${str(main.mongolianTitle)}`.toLowerCase();
    const kind: KidsSongKind = /sing|дуу/.test(label)
      ? "song"
      : /chant|шүлэг|rhyme/.test(label)
        ? "chant"
        : /story|үлгэр/.test(label)
          ? "story"
          : "read";
    song = {
      kind,
      title: str(main.mongolianTitle) || str(main.title) || "Дуу",
      audioUrl: audio(main.audioFile ?? main.audio),
      imageUrl: byId.get("sing") ?? byId.get("song") ?? bySection.get("song") ?? null,
      lines: songLines,
    };
  }

  // ---- түлхүүр өгүүлбэр (grammar.json)
  const keySentences: KidsKeySentence[] = grammar.filter(isRec).map((g) => {
    const ex = arr(g.examples).filter(isRec)[0];
    const check = isRec(g.check) ? g.check : null;
    return {
      zh: str(ex?.chinese) || str(g.point).replace(/\s*—.*$/, ""),
      pinyin: str(ex?.pinyin),
      mn: str(ex?.mongolian) || str(g.gloss_mn),
      teacherMn: str(g.teacher_mn),
      check:
        check && arr(check.options).length
          ? { question: str(check.question), options: arr(check.options).map(str), answer: Number(check.answer) || 0 }
          : undefined,
    };
  });

  // ---- тест (workbook.reading.parts)
  const reading: Rec = isRec(workbook.reading) ? workbook.reading : {};
  const parts = arr(reading.parts).filter(isRec);
  const listening: KidsListeningItem[] = [];
  const judge: KidsJudgeItem[] = [];
  const choice: KidsChoiceItem[] = [];
  let testAudio: string | null = null;
  const isTick = (v: string) => v === "✓" || v === "√" || v.toLowerCase() === "true";
  const isJudgeOptions = (o: string[]) => o.length === 2 && o.every((v) => isTick(v) || v === "✗" || v === "×" || v.toLowerCase() === "false");
  const stripListen = (v: string) => v.replace(/^（.*?）/, "").trim();
  for (const part of parts) {
    const type = str(part.type);
    if (type === "listening") {
      testAudio = testAudio ?? audio(part.audio);
      for (const it of arr(part.items).filter(isRec)) {
        const options = arr(it.options).map(str);
        const scriptZh = str(it.script_zh) || stripListen(str(it.question_zh));
        if (isJudgeOptions(options)) {
          // сонсоод зурагтай тулгах ✓/✗
          judge.push({
            n: Number(it.n) || judge.length + 1,
            zh: scriptZh,
            scriptZh,
            imageUrl: imgByPath(it.image),
            answer: isTick(str(it.answer)),
            explanation: str(it.explanation_mn),
          });
          continue;
        }
        listening.push({
          n: Number(it.n) || listening.length + 1,
          scriptZh,
          imageUrl: imgByPath(it.image),
          options,
          optionImages: arr(it.optionImages).map(imgByPath),
          answer: str(it.answer),
          explanation: str(it.explanation_mn),
        });
      }
    } else if (type === "judge") {
      testAudio = testAudio ?? audio(part.audio);
      for (const it of arr(part.items).filter(isRec)) {
        const scriptZh = str(it.script_zh) || (/^（听/.test(str(it.question_zh)) ? stripListen(str(it.question_zh)) : "");
        judge.push({
          n: Number(it.n) || judge.length + 1,
          zh: scriptZh || stripListen(str(it.question_zh)),
          scriptZh: scriptZh || null,
          imageUrl: imgByPath(it.image),
          answer: isTick(str(it.answer)),
          explanation: str(it.explanation_mn),
        });
      }
    } else if (type === "choice") {
      for (const it of arr(part.items).filter(isRec)) {
        const options = arr(it.options).map(str);
        if (options.length < 2) continue;
        choice.push({
          n: Number(it.n) || choice.length + 1,
          questionZh: str(it.question_zh),
          questionMn: str(it.question_mn),
          imageUrl: imgByPath(it.image),
          options,
          optionImages: arr(it.optionImages).map(imgByPath),
          answer: str(it.answer),
          explanation: str(it.explanation_mn),
        });
      }
    }
  }

  const culture = isRec(texts.culture)
    ? { title: str(texts.culture.title_mn) || str(texts.culture.title), text: str(texts.culture.text_mn), imageUrl: byId.get("hands") ?? bySection.get("culture") ?? null }
    : null;

  const intro: Rec = isRec(texts.lessonIntro) ? texts.lessonIntro : {};

  // ---- бичих ханз: эхлээд нэг ханзтай үгс, дараа нь олон ханзтай үгийн эхний ханз
  const writeChars: KidsLessonData["writeChars"] = [];
  const seenChars = new Set<string>();
  const pushChar = (char: string, pinyin: string, mn: string) => {
    if (writeChars.length >= 4 || seenChars.has(char) || !/^[\u4e00-\u9fff]$/.test(char)) return;
    seenChars.add(char);
    writeChars.push({ char, pinyin, mn });
  };
  for (const w of [...words, ...numbers]) if ([...w.zh].length === 1) pushChar(w.zh, w.pinyin, w.mn);
  for (const w of words) {
    const chars = [...w.zh];
    if (chars.length > 1) pushChar(chars[0], "", w.mn ? `«${w.zh}» (${w.mn}) үгийн ханз` : "");
  }

  return {
    lessonId: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    titleZh: lesson.chineseTitle ?? "",
    teacherIntro: str(intro.teacher_mn),
    heroUrl: byId.get("hero") ?? lesson.imageUrl ?? lesson.thumbnailUrl ?? null,
    videoUrl: opts.videoUrl ?? lesson.videoUrl ?? null,
    videoPoster: opts.videoPoster ?? null,
    words,
    numbers,
    dialogues,
    song,
    keySentences,
    test: { audioUrl: testAudio, listening, judge, choice },
    culture,
    writeChars,
  };
}
