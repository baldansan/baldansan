import type { TutorNote } from "@/lib/mock-test/tutor-note";
import type { MockTestQuestionRow, MockTestRow } from "@/lib/mock-test/types";

const DEMO_SILENT_WAV =
  "data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/**
 * ЗӨВХӨН ХӨГЖҮҮЛЭЛТ: өгөгдлийн сан холбогдоогүй (dummy env) үед `?demoTutor=1`
 * картыг харуулах жишээ шалгалт + нэг сонсголын асуулт. Бүх текст «(жишээ)».
 */
export function devDemoPracticeData(
  testId: string
): { test: MockTestRow; questions: MockTestQuestionRow[] } | null {
  if (process.env.NODE_ENV === "production") return null;
  const id = testId.toUpperCase() || "DEMO";
  const test: MockTestRow = {
    id,
    hsk_level: 1,
    title: "(жишээ) Багшийн тайлбарын үзүүлбэр",
    total_questions: 1,
    time_limit_min: 5,
    has_writing: false,
    sections: [
      {
        skill: "listening",
        parts: [{ part: 1, q_type: "choice", range: [1, 1], desc: "(жишээ) 1-р хэсэг" }],
      },
    ],
    created_at: new Date(0).toISOString(),
  };
  const question: MockTestQuestionRow = {
    id: "00000000-0000-4000-8000-000000000001",
    test_id: id,
    skill: "listening",
    part: 1,
    q_no: 1,
    q_type: "choice",
    stem: "(жишээ) 问：他们在说什么？",
    options: [
      { key: "A", text: "(жишээ) 选项 A" },
      { key: "B", text: "(жишээ) 选项 B" },
      { key: "C", text: "(жишээ) 选项 C" },
    ],
    correct_answer: "A",
    autograde: "auto",
    points: 1,
    // 0.1 секундын чимээгүй WAV — «🔊 Дахин сонс» товчийг харуулахад л.
    audio_url: DEMO_SILENT_WAV,
    image_url: null,
    needs_image: false,
    tags: [],
    target_lesson_id: null,
    explanation_mn: null,
    audio_start_sec: null,
    audio_end_sec: null,
    audio_transcript: null,
    tutor_note: null,
  };
  return { test, questions: [question] };
}

/**
 * ЗӨВХӨН ХӨГЖҮҮЛЭЛТ: `?demoTutor=1` үед эхний асуултад жишээ тайлбар оруулж
 * «Багшийн тайлбар» картыг харахад. Текст нь ил тод «(жишээ)» — бодит
 * асуултын тайлбар БИШ. Production дээр хэзээ ч ажиллахгүй.
 */
export function withDemoTutorNote(
  questions: MockTestQuestionRow[],
  enabled: boolean
): MockTestQuestionRow[] {
  if (process.env.NODE_ENV === "production" || !enabled) return questions;
  if (questions.length === 0) return questions;

  const first = questions[0];
  const optionKeys = (first.options ?? []).map((opt) => opt.key).filter(Boolean);
  const wrong: Record<string, string> = {};
  for (const key of optionKeys) {
    if (key === first.correct_answer) continue;
    wrong[key] = `(жишээ) ${key} сонголт яагаад таарахгүйг энд тайлбарлана.`;
  }
  if (Object.keys(wrong).length === 0) {
    wrong["×"] = "(жишээ) Энэ сонголт яагаад таарахгүйг энд тайлбарлана.";
  }

  const note: TutorNote = {
    transcript:
      first.skill === "listening"
        ? [
            { zh: "女：(жишээ) 第一句话。", pinyin: "(жишээ) dì yī jù huà", mn: "(жишээ) Эхний мөр — юу гэж хэлснийг энд бичнэ." },
            { zh: "男：(жишээ) 关键句在这里。", pinyin: "(жишээ) guān jiàn jù zài zhè lǐ", mn: "(жишээ) Хариултыг шийдсэн мөр." },
            { zh: "问：(жишээ) 问题是什么？", pinyin: "(жишээ) wèn tí shì shén me", mn: "(жишээ) Асуулт." },
          ]
        : undefined,
    key: "(жишээ) 关键句在这里。",
    keyMn: "(жишээ) Түлхүүр өгүүлбэрийн утга.",
    why: `(жишээ) Зөв хариулт ${first.correct_answer ?? "?"} яагаад зөв болохыг багш энд тайлбарлана. Энэ бол жишээ текст — бодит тайлбар биш.`,
    wrong,
    trap: "(жишээ) Асуултын урхи — төстэй үг, эсрэг утга гэх мэт.",
    tip: "(жишээ) Стратеги — эхлээд асуултыг уншаад, дараа нь түлхүүр үгээ сонс.",
    words: [
      { zh: "关键", pinyin: "guānjiàn", mn: "(жишээ) түлхүүр" },
      { zh: "问题", pinyin: "wèntí", mn: "(жишээ) асуулт" },
      { zh: "选择", pinyin: "xuǎnzé", mn: "(жишээ) сонголт" },
    ],
  };

  return [{ ...first, tutor_note: note }, ...questions.slice(1)];
}
