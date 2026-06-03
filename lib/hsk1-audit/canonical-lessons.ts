/**
 * HSK Standard Course 1 — canonical lesson registry.
 * Page ranges are NOT guessed; audio inventories require ZIP extraction.
 */

export const HSK1_SOURCE_FILES = {
  textbook: "HSK-1-Textbook (1).pdf",
  teacherBook: "HSK_Standard_Course_1_Teacher_39_s_Book.pdf",
  workbook: "HSK-1-Workbook (1).pdf",
  workbookAnswers: "hsk1-workbook-answers (1).pdf",
  textbookAudioZip: "hsk1textbookaudios.zip",
  workbookAudioZip: "hsk1workbookaudios.zip",
} as const;

/** Previously imported packages that contradict Standard Course 1 lesson order. */
export const HSK1_INVALID_LEGACY_PACKAGES = [
  {
    lessonNumber: 2,
    invalidLessonIdPattern: "nihao-ma|你好吗|l02.*ma",
    wrongChineseTitle: "你好吗",
    correctChineseTitle: "谢谢你",
    reason:
      "HSK Standard Course 1 Lesson 2 is 谢谢你 (thank you), not 你好吗.",
  },
  {
    lessonNumber: 4,
    invalidLessonIdPattern: "nationality|哪国人|哪国",
    wrongChineseTitle: "你是哪国人",
    correctChineseTitle: "她是我的汉语老师",
    reason:
      "HSK Standard Course 1 Lesson 4 is 她是我的汉语老师 (introducing others), not nationality lesson.",
  },
] as const;

export type Hsk1LessonPhase =
  | "foundation-pinyin"
  | "foundation-pinyin-2"
  | "introduction"
  | "grammar-basic"
  | "numbers-age"
  | "ability"
  | "date"
  | "desire-shopping"
  | "location"
  | "existence"
  | "time"
  | "weather-health"
  | "progressive"
  | "completion"
  | "emphasis-travel";

export type Hsk1CanonicalLesson = {
  lessonNumber: number;
  lessonId: string;
  chineseTitle: string;
  englishTitle: string;
  mongolianTitle: string;
  phase: Hsk1LessonPhase;
  /** DigMandarin / Teacher's Book functional focus (summary). */
  functionalFocus: string;
  /** Grammar / notes focus from standard course references. */
  grammarFocus: string[];
  /** Pronunciation teaching emphasis if any. */
  pronunciationFocus: string[];
  /** Character teaching emphasis. */
  characterFocus: string[];
  /** Expected workbook exercise section labels (一–八 typical). */
  workbookSectionLabels: string[];
  /** Whether lesson has dedicated culture section in textbook. */
  hasCultureSection: boolean;
  /** Lesson 1 only: classroom expressions mini-section. */
  hasClassroomExpressions: boolean;
};

export const HSK1_CANONICAL_LESSONS: Hsk1CanonicalLesson[] = [
  {
    lessonNumber: 1,
    lessonId: "hsk1-l01-nihao",
    chineseTitle: "你好",
    englishTitle: "Hello",
    mongolianTitle: "Сайн байна уу",
    phase: "foundation-pinyin",
    functionalFocus: "Daily greetings; pinyin foundation (initials, finals, tones, syllables)",
    grammarFocus: [],
    pronunciationFocus: [
      "initials and finals",
      "four tones",
      "tone production",
      "tone sandhi (nǐ hǎo)",
      "Chinese syllable structure",
    ],
    characterFocus: ["一", "二", "三", "十", "八", "六"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: true,
  },
  {
    lessonNumber: 2,
    lessonId: "hsk1-l02-xiexie",
    chineseTitle: "谢谢你",
    englishTitle: "Thank you",
    mongolianTitle: "Баярлалаа",
    phase: "foundation-pinyin-2",
    functionalFocus: "Thanking and responding; compound initials/finals; neutral tone introduction",
    grammarFocus: ["不客气 response pattern"],
    pronunciationFocus: ["compound initials", "compound finals", "neutral tone 不"],
    characterFocus: ["口", "马", "女", "子"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 3,
    lessonId: "hsk1-l03-name",
    chineseTitle: "你叫什么名字",
    englishTitle: "What's your name",
    mongolianTitle: "Чиний нэр хэн бэ",
    phase: "introduction",
    functionalFocus: "Asking and telling names; nationality/profession intro begins",
    grammarFocus: [
      "什么 interrogative",
      "是 sentence",
      "吗 yes-no question",
    ],
    pronunciationFocus: ["tone sandhi of 不", "ü spelling rules"],
    characterFocus: ["我", "你", "他", "谁"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 4,
    lessonId: "hsk1-l04-teacher",
    chineseTitle: "她是我的汉语老师",
    englishTitle: "She is my Chinese teacher",
    mongolianTitle: "Тэр миний Хятад хэлний багш",
    phase: "introduction",
    functionalFocus: "Introducing others; nationality, name, profession",
    grammarFocus: ["的 possession", "是 sentence with third person"],
    pronunciationFocus: ["tone sandhi of 一", "y and w spelling rules"],
    characterFocus: ["她", "他", "的", "汉"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 5,
    lessonId: "hsk1-l05-age",
    chineseTitle: "她女儿今年二十岁",
    englishTitle: "Her daughter is twenty years old this year",
    mongolianTitle: "Түүний охин энэ жил хорин настай",
    phase: "numbers-age",
    functionalFocus: "Age expressions; numbers 1–99",
    grammarFocus: ["number + measure word", "今年 time expression"],
    pronunciationFocus: ["儿 retroflex final", "i/u/ü finals differentiation"],
    characterFocus: ["女", "儿", "十", "岁"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 6,
    lessonId: "hsk1-l06-speak-chinese",
    chineseTitle: "我会说汉语",
    englishTitle: "I can speak Chinese",
    mongolianTitle: "Би Хятад хэл ярьж чадна",
    phase: "ability",
    functionalFocus: "Expressing ability with 会",
    grammarFocus: ["会 + verb ability"],
    pronunciationFocus: ["会 tone and linking"],
    characterFocus: ["会", "说", "语"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 7,
    lessonId: "hsk1-l07-date",
    chineseTitle: "今天几号",
    englishTitle: "What's the date today",
    mongolianTitle: "Өнөөдөр сарын хэдэнэ",
    phase: "date",
    functionalFocus: "Date expressions; talking about plans",
    grammarFocus: ["几号 date question", "今天/明天 time words"],
    pronunciationFocus: ["number tones in dates"],
    characterFocus: ["今", "天", "月", "号"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 8,
    lessonId: "hsk1-l08-tea",
    chineseTitle: "我想喝茶",
    englishTitle: "I'd like some tea",
    mongolianTitle: "Би цай ууж хүсэж байна",
    phase: "desire-shopping",
    functionalFocus: "Want/willingness; shopping and prices",
    grammarFocus: ["想 + verb", "多少钱 price question"],
    pronunciationFocus: ["想 tone sandhi contexts"],
    characterFocus: ["想", "喝", "茶", "钱"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 9,
    lessonId: "hsk1-l09-workplace",
    chineseTitle: "你儿子在哪儿工作",
    englishTitle: "Where does your son work",
    mongolianTitle: "Чиний хүү хаана ажилладаг вэ",
    phase: "location",
    functionalFocus: "Talking about locations and workplaces",
    grammarFocus: ["在哪儿 location question", "在 + place"],
    pronunciationFocus: ["哪儿 erhua/neutral patterns"],
    characterFocus: ["儿", "子", "在", "工"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 10,
    lessonId: "hsk1-l10-sit-here",
    chineseTitle: "我能坐这儿吗",
    englishTitle: "Can I sit here",
    mongolianTitle: "Би энд сууж болох уу",
    phase: "existence",
    functionalFocus: "Placement, existence, permission; imperative sentences",
    grammarFocus: ["能 + verb permission", "这儿/那儿 demonstratives"],
    pronunciationFocus: ["儿 final in 这儿"],
    characterFocus: ["能", "坐", "这", "儿"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 11,
    lessonId: "hsk1-l11-time",
    chineseTitle: "现在几点",
    englishTitle: "What's the time now",
    mongolianTitle: "Одоо цаг хэд вэ",
    phase: "time",
    functionalFocus: "Telling and asking time",
    grammarFocus: ["几点 time question", "现在 time adverb"],
    pronunciationFocus: ["点 tone in time expressions"],
    characterFocus: ["现", "在", "点", "钟"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 12,
    lessonId: "hsk1-l12-weather",
    chineseTitle: "明天天气怎么样",
    englishTitle: "What will the weather be like tomorrow",
    mongolianTitle: "Маргааш цаг агаар ямар байх вэ",
    phase: "weather-health",
    functionalFocus: "Weather and health; asking about status",
    grammarFocus: ["怎么样 question", "太 + adjective"],
    pronunciationFocus: ["weather compound tones"],
    characterFocus: ["明", "天", "气", "怎"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: true,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 13,
    lessonId: "hsk1-l13-cooking",
    chineseTitle: "他在学做中国菜呢",
    englishTitle: "He is learning to cook Chinese food",
    mongolianTitle: "Тэр Хятад хоол хийж сурч байна",
    phase: "progressive",
    functionalFocus: "Action in progress; phone calls; likes",
    grammarFocus: ["在 + verb + 呢 progressive", "做 + object"],
    pronunciationFocus: ["呢 neutral tone"],
    characterFocus: ["在", "学", "做", "菜"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 14,
    lessonId: "hsk1-l14-clothes",
    chineseTitle: "她买了不少衣服",
    englishTitle: "She has bought quite a few clothes",
    mongolianTitle: "Тэр их хувцас авсан",
    phase: "completion",
    functionalFocus: "Completed actions; shopping quantity",
    grammarFocus: ["了 completion", "不少 quantity"],
    pronunciationFocus: ["了 neutral/light tone contexts"],
    characterFocus: ["买", "了", "不", "少"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: false,
    hasClassroomExpressions: false,
  },
  {
    lessonNumber: 15,
    lessonId: "hsk1-l15-travel",
    chineseTitle: "我是坐飞机来的",
    englishTitle: "I came here by air",
    mongolianTitle: "Би онгоцоор ирсэн",
    phase: "emphasis-travel",
    functionalFocus: "Emphasizing time/place/manner; travel expressions",
    grammarFocus: ["是…的 emphasis structure (intro)", "来/去 direction verbs"],
    pronunciationFocus: ["的 in emphasis (light tone)"],
    characterFocus: ["坐", "飞", "机", "来"],
    workbookSectionLabels: ["一", "二", "三", "四", "五", "六", "七", "八"],
    hasCultureSection: true,
    hasClassroomExpressions: false,
  },
];

export function lessonIdPad(n: number): string {
  return String(n).padStart(2, "0");
}
