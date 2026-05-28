import type {
  Lesson,
  LessonDetail,
  LessonQuiz,
  LessonVocabulary,
  LessonWatch,
} from "@/types/lesson";

export const hsk5CourseDetail = {
  title: "HSK5 Short Drama Chinese",
  subtitle:
    "Богино бичлэг, subtitle, vocabulary, quiz ашиглан HSK5 түвшний хятад хэлийг сур.",
  stats: [
    { label: "20 lessons" },
    { label: "500 vocabulary" },
    { label: "Shadowing practice" },
    { label: "Quiz included" },
  ],
  progress: {
    completed: 0,
    total: 20,
  },
};

export const hsk5Lessons: Lesson[] = [
  {
    id: 1,
    number: 1,
    title: "Lesson 1",
    chineseTitle: "爱的细节",
    description:
      "Хайрын жижиг деталь, халамж, ойлголцлын тухай богино хичээл.",
    durationMin: 8,
    vocabulary: 20,
    quizQuestions: 10,
    status: "start",
    href: "/lessons/1",
  },
  {
    id: 2,
    number: 2,
    title: "Lesson 2",
    chineseTitle: "你真的懂我吗？",
    description:
      "Харилцаанд ойлголцол, асуулт, сэтгэл хөдлөлийн хэллэгүүд.",
    durationMin: 7,
    vocabulary: 22,
    quizQuestions: 10,
    status: "locked",
    href: null,
  },
  {
    id: 3,
    number: 3,
    title: "Lesson 3",
    chineseTitle: "我只是想照顾你",
    description:
      "Халамжлах, санаа тавих, тайлбарлах үед хэрэглэгдэх өгүүлбэрүүд.",
    durationMin: 9,
    vocabulary: 25,
    quizQuestions: 12,
    status: "locked",
    href: null,
  },
];

export const lesson1Detail: LessonDetail = {
  id: 1,
  title: "Lesson 1 — 爱的细节",
  subtitle:
    "Хайрын жижиг деталь, халамж, ойлголцлын тухай богино хичээл.",
  backHref: "/courses/hsk5",
  videoPlaceholder: "Video lesson placeholder",
  watchHref: "/lessons/1/watch",
  vocabularyHref: "/lessons/1/vocabulary",
  quizHref: "/lessons/1/quiz",
  subtitles: [
    {
      chinese: "你真的懂我吗？",
      pinyin: "Nǐ zhēn de dǒng wǒ ma?",
      mongolian: "Чи намайг үнэхээр ойлгодог уу?",
    },
    {
      chinese: "我只是想照顾你。",
      pinyin: "Wǒ zhǐshì xiǎng zhàogù nǐ.",
      mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
    },
  ],
  vocabulary: [
    {
      chinese: "细节",
      pinyin: "xìjié",
      mongolian: "нарийн зүйл, жижиг деталь",
      level: "HSK5",
    },
    {
      chinese: "照顾",
      pinyin: "zhàogù",
      mongolian: "асрах, халамжлах",
      level: "HSK4",
    },
    {
      chinese: "理解",
      pinyin: "lǐjiě",
      mongolian: "ойлгох",
      level: "HSK4",
    },
  ],
  quiz: {
    questionCount: 10,
    types: [
      "Multiple choice",
      "Cloze blank",
      "Match Chinese to Mongolian",
    ],
  },
  progress: {
    status: "Not started",
    percent: 0,
  },
};

export const lesson1Watch: LessonWatch = {
  title: "Watch — Lesson 1 爱的细节",
  subtitle: "Subtitle mode сонгоод, сонсож уншаарай.",
  backHref: "/lessons/1",
  videoPlaceholder: "Video lesson placeholder",
  currentTime: "00:00",
  totalTime: "08:00",
  vocabularyHref: "/lessons/1/vocabulary",
  quizHref: "/lessons/1/quiz",
  timedSubtitles: [
    {
      start: "00:00",
      end: "00:03",
      chinese: "你真的懂我吗？",
      pinyin: "Nǐ zhēn de dǒng wǒ ma?",
      mongolian: "Чи намайг үнэхээр ойлгодог уу?",
    },
    {
      start: "00:04",
      end: "00:07",
      chinese: "我只是想照顾你。",
      pinyin: "Wǒ zhǐshì xiǎng zhàogù nǐ.",
      mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
    },
    {
      start: "00:08",
      end: "00:11",
      chinese: "可是你从来不听我的感受。",
      pinyin: "Kěshì nǐ cónglái bù tīng wǒ de gǎnshòu.",
      mongolian: "Гэхдээ чи миний мэдрэмжийг хэзээ ч сонсдоггүй.",
    },
    {
      start: "00:12",
      end: "00:15",
      chinese: "我以为这就是爱。",
      pinyin: "Wǒ yǐwéi zhè jiùshì ài.",
      mongolian: "Би үүнийг л хайр гэж бодсон.",
    },
  ],
};

export const lesson1Vocabulary: LessonVocabulary = {
  title: "Vocabulary — Lesson 1 爱的细节",
  subtitle: "Үг бүрийг pinyin, Монгол утга, жишээ өгүүлбэртэй сур.",
  backHref: "/lessons/1",
  watchHref: "/lessons/1/watch",
  quizHref: "/lessons/1/quiz",
  words: [
    {
      id: "xijie",
      chinese: "细节",
      pinyin: "xìjié",
      mongolian: "нарийн зүйл, жижиг деталь",
      hskLevel: "HSK5",
      exampleChinese: "爱的细节很重要。",
      exampleMongolian: "Хайрын жижиг зүйлс маш чухал.",
    },
    {
      id: "zhaogu",
      chinese: "照顾",
      pinyin: "zhàogù",
      mongolian: "асрах, халамжлах",
      hskLevel: "HSK4",
      exampleChinese: "他很会照顾别人。",
      exampleMongolian: "Тэр бусдыг халамжлахдаа сайн.",
    },
    {
      id: "lijie",
      chinese: "理解",
      pinyin: "lǐjiě",
      mongolian: "ойлгох",
      hskLevel: "HSK4",
      exampleChinese: "我希望你能理解我。",
      exampleMongolian: "Чи намайг ойлгоосой гэж би хүсэж байна.",
    },
    {
      id: "ganshou",
      chinese: "感受",
      pinyin: "gǎnshòu",
      mongolian: "мэдрэмж",
      hskLevel: "HSK5",
      exampleChinese: "你从来不听我的感受。",
      exampleMongolian: "Чи миний мэдрэмжийг хэзээ ч сонсдоггүй.",
    },
    {
      id: "yiwei",
      chinese: "以为",
      pinyin: "yǐwéi",
      mongolian: "гэж бодох, андуурах",
      hskLevel: "HSK4",
      exampleChinese: "我以为这就是爱。",
      exampleMongolian: "Би үүнийг л хайр гэж бодсон.",
    },
  ],
};

export const lesson1Quiz: LessonQuiz = {
  title: "Quiz — Lesson 1 爱的细节",
  subtitle: "Сурсан үг, өгүүлбэрээ шалгаарай.",
  backHref: "/lessons/1",
  watchHref: "/lessons/1/watch",
  vocabularyHref: "/lessons/1/vocabulary",
  courseHref: "/courses/hsk5",
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      question: "“细节” гэдэг үгийн зөв утга аль вэ?",
      options: [
        "нарийн зүйл, жижиг деталь",
        "хурдан явах",
        "маргааш уулзах",
        "хоол хийх",
      ],
      correctAnswer: "нарийн зүйл, жижиг деталь",
      explanation:
        "“细节” нь detail буюу жижиг нарийн зүйл гэсэн утгатай.",
    },
    {
      id: "q2",
      type: "multiple_choice",
      question: "“照顾” гэдэг үгийн зөв утга аль вэ?",
      options: ["асрах, халамжлах", "сонгох", "худалдаж авах", "явуулах"],
      correctAnswer: "асрах, халамжлах",
      explanation: "“照顾” нь care for, look after гэсэн утгатай.",
    },
    {
      id: "q3",
      type: "cloze",
      question: "我只是想____你。",
      options: ["照顾", "细节", "感受", "以为"],
      correctAnswer: "照顾",
      explanation:
        "“我只是想照顾你。” = Би зүгээр л чамайг халамжлахыг хүссэн.",
    },
    {
      id: "q4",
      type: "multiple_choice",
      question: "“感受” гэдэг үгийн зөв утга аль вэ?",
      options: ["мэдрэмж", "үнэ", "хаяг", "зам"],
      correctAnswer: "мэдрэмж",
      explanation: "“感受” нь feeling, sensation гэсэн утгатай.",
    },
    {
      id: "q5",
      type: "cloze",
      question: "我____这就是爱。",
      options: ["以为", "理解", "照顾", "细节"],
      correctAnswer: "以为",
      explanation: "“我以为这就是爱。” = Би үүнийг л хайр гэж бодсон.",
    },
  ],
};
