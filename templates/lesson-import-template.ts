/**
 * =============================================================================
 * BUUNDUU SURTSGAA — LESSON IMPORT TEMPLATE (TypeScript)
 * =============================================================================
 *
 * DO NOT import this file in the app. It is a copy-paste starter only.
 *
 * How to use:
 * 1. Copy this file to: content/courses/hsk5/lessons/lesson-N.ts
 * 2. Rename export: lessonTemplate → lesson3 (or lesson4, etc.)
 * 3. Replace every REPLACE_* placeholder with real content
 * 4. Register in content/courses/hsk5/lessons/index.ts (if new lesson file)
 * 5. Match vocabularyCount / quizCount to actual array lengths
 * 6. Set status: "available" | "locked"
 *
 * Type reference: types/lesson-content.ts (LessonContent)
 * =============================================================================
 */

import type { LessonContent } from "@/types/lesson-content";

export const lessonTemplate: LessonContent = {
  // ----- Lesson metadata (shown on course + lesson detail pages) -----

  /** URL segment: /lessons/REPLACE_ID — must be unique, e.g. "3", "4" */
  id: "REPLACE_ID",

  /** Course slug — HSK5 lessons use "hsk5" */
  courseId: "hsk5",

  /** English lesson label, e.g. "Lesson 3" */
  title: "REPLACE_Lesson N",

  /** Chinese episode title, e.g. "我只是想照顾你" */
  chineseTitle: "REPLACE_中文标题",

  /** Short Mongolian summary (lesson detail hero) */
  subtitle: "REPLACE_Монгол тайлбар (subtitle)",

  /** Longer Mongolian description (course list card) */
  description: "REPLACE_Монгол тайлбар (description)",

  /** Display string, e.g. "9 min" */
  duration: "REPLACE_9 min",

  /** Should match vocabulary.length (used in course list) */
  vocabularyCount: 0,

  /** Should match quizQuestions.length (used in lesson detail preview) */
  quizCount: 0,

  /** "available" = Start button active | "locked" = disabled on course page */
  status: "locked",

  videoPlaceholder: "Video lesson placeholder",

  /** Watch page duration display, e.g. "09:00" for 9 min lesson */
  watchTotalTime: "REPLACE_09:00",

  // ----- Subtitle preview (first 1–2 lines on lesson detail page) -----

  subtitlePreview: [
    {
      chinese: "REPLACE_中文句子",
      pinyin: "REPLACE_Pinyin",
      mongolian: "REPLACE_Монгол орчуулга",
    },
    // Optional second preview line:
    // {
    //   chinese: "...",
    //   pinyin: "...",
    //   mongolian: "...",
    // },
  ],

  // ----- Timed subtitles (watch page, full list) -----

  timedSubtitles: [
    {
      start: "00:00",
      end: "00:03",
      chinese: "REPLACE_中文",
      pinyin: "REPLACE_Pinyin",
      mongolian: "REPLACE_Монгол",
    },
    {
      start: "00:04",
      end: "00:07",
      chinese: "REPLACE_下一句",
      pinyin: "REPLACE_Xià yī jù",
      mongolian: "REPLACE_Дараагийн мөр",
    },
    // Add more timed lines…
  ],

  // ----- Vocabulary (vocabulary page; preview uses first 3 words) -----

  vocabulary: [
    {
      /** Unique slug per word in this lesson, e.g. "zhaogu" */
      id: "REPLACE_word_id",
      chinese: "REPLACE_词",
      pinyin: "REPLACE_pinyin",
      mongolian: "REPLACE_утга",
      hskLevel: "HSK4", // HSK3 | HSK4 | HSK5 (vocabulary page filters)
      exampleChinese: "REPLACE_例句中文。",
      exampleMongolian: "REPLACE_Жишээ Монгол.",
    },
    // Add more words…
  ],

  // ----- Quiz (quiz page) -----

  quizQuestions: [
    {
      id: "q1",
      type: "multiple_choice", // or "cloze"
      question: "REPLACE_Асуулт (Mongolian or mixed)?",
      options: [
        "REPLACE_correct_or_option_a",
        "REPLACE_wrong_option",
        "REPLACE_wrong_option",
        "REPLACE_wrong_option",
      ],
      correctAnswer: "REPLACE_must_match_one_option_exactly",
      explanation: "REPLACE_Тайлбар after answer.",
    },
    {
      id: "q2",
      type: "cloze",
      question: "REPLACE_我只是想____你。",
      options: ["照顾", "细节", "感受", "以为"],
      correctAnswer: "照顾",
      explanation: "REPLACE_Full sentence explanation.",
    },
    // Add more questions…
  ],

  /** Shown as tags on lesson detail quiz preview */
  quizTypes: [
    "Multiple choice",
    "Cloze blank",
    "Match Chinese to Mongolian",
  ],
};
