import type { LessonContent } from "@/types/lesson-content";

export const lesson3: LessonContent = {
  id: "3",
  courseId: "hsk5",
  title: "Lesson 3",
  chineseTitle: "我只是想照顾你",
  subtitle: "Халамжлах, санаа тавих, тайлбарлах үед хэрэглэгдэх өгүүлбэрүүд.",
  description:
    "Халамжлах, санаа тавих, тайлбарлах үед хэрэглэгдэх өгүүлбэрүүд.",
  duration: "9 min",
  vocabularyCount: 25,
  quizCount: 12,
  status: "locked",
  videoPlaceholder: "Video lesson placeholder",
  watchTotalTime: "09:00",
  subtitlePreview: [
    {
      chinese: "我只是想照顾你。",
      pinyin: "Wǒ zhǐshì xiǎng zhàogù nǐ.",
      mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
    },
  ],
  timedSubtitles: [
    {
      start: "00:00",
      end: "00:03",
      chinese: "我只是想照顾你。",
      pinyin: "Wǒ zhǐshì xiǎng zhàogù nǐ.",
      mongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
    },
  ],
  vocabulary: [
    {
      id: "zhaogu",
      chinese: "照顾",
      pinyin: "zhàogù",
      mongolian: "асрах, халамжлах",
      hskLevel: "HSK4",
      exampleChinese: "我只是想照顾你。",
      exampleMongolian: "Би зүгээр л чамайг халамжлахыг хүссэн.",
    },
  ],
  quizQuestions: [
    {
      id: "q1",
      type: "cloze",
      question: "我只是想____你。",
      options: ["照顾", "细节", "感受", "以为"],
      correctAnswer: "照顾",
      explanation: "Placeholder quiz — Lesson 3.",
    },
  ],
  quizTypes: ["Cloze blank"],
};
