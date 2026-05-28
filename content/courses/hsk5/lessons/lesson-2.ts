import type { LessonContent } from "@/types/lesson-content";

export const lesson2: LessonContent = {
  id: "2",
  courseId: "hsk5",
  title: "Lesson 2",
  chineseTitle: "你真的懂我吗？",
  subtitle: "Харилцаанд ойлголцол, асуулт, сэтгэл хөдлөлийн хэллэгүүд.",
  description:
    "Харилцаанд ойлголцол, асуулт, сэтгэл хөдлөлийн хэллэгүүд.",
  duration: "7 min",
  vocabularyCount: 22,
  quizCount: 10,
  status: "locked",
  videoPlaceholder: "Video lesson placeholder",
  watchTotalTime: "07:00",
  subtitlePreview: [
    {
      chinese: "你真的懂我吗？",
      pinyin: "Nǐ zhēn de dǒng wǒ ma?",
      mongolian: "Чи намайг үнэхээр ойлгодог уу?",
    },
  ],
  timedSubtitles: [
    {
      start: "00:00",
      end: "00:03",
      chinese: "你真的懂我吗？",
      pinyin: "Nǐ zhēn de dǒng wǒ ma?",
      mongolian: "Чи намайг үнэхээр ойлгодог уу?",
    },
  ],
  vocabulary: [
    {
      id: "dong",
      chinese: "懂",
      pinyin: "dǒng",
      mongolian: "ойлгох",
      hskLevel: "HSK4",
      exampleChinese: "你真的懂我吗？",
      exampleMongolian: "Чи намайг үнэхээр ойлгодог уу?",
    },
  ],
  quizQuestions: [
    {
      id: "q1",
      type: "multiple_choice",
      question: "“懂” гэдэг үгийн утга аль вэ?",
      options: ["ойлгох", "явах", "хооллох", "унших"],
      correctAnswer: "ойлгох",
      explanation: "Placeholder quiz — Lesson 2.",
    },
  ],
  quizTypes: ["Multiple choice"],
};
