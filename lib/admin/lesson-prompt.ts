export type HskTargetLevel = "HSK1" | "HSK2" | "HSK3" | "HSK4" | "HSK5" | "HSK6";

export type LessonPromptTone =
  | "emotional_drama"
  | "daily_conversation"
  | "taobao_practical"
  | "workplace";

export type LessonPromptInput = {
  lessonId: string;
  title: string;
  chineseTitle: string;
  subtitle: string;
  description: string;
  hskLevel: HskTargetLevel;
  subtitleLineCount: number;
  vocabularyCount: number;
  quizCount: number;
  tone: LessonPromptTone;
  includePinyin: boolean;
};

const TONE_LABELS: Record<LessonPromptTone, string> = {
  emotional_drama:
    "emotional short drama — natural, conversational, relationship-focused dialogue",
  daily_conversation: "daily conversation — practical, friendly, everyday situations",
  taobao_practical:
    "Taobao / e-commerce practical Chinese — shopping, orders, delivery, customer chat",
  workplace: "workplace conversation — polite, professional, office scenarios",
};

export function buildLessonContentPrompt(input: LessonPromptInput): string {
  const desc = [input.subtitle, input.description].filter(Boolean).join(" — ");
  const pinyinRule = input.includePinyin
    ? "Include pinyin for every subtitle line and vocabulary item."
    : "Omit pinyin fields or use empty string.";

  return `You are creating lesson content JSON for Buunduu Surtsgaay (Mongolian learners studying Chinese).

LESSON CONTEXT
- Lesson ID: ${input.lessonId}
- Title: ${input.title}
- Chinese title: ${input.chineseTitle}
- Summary: ${desc || "(add lesson theme in subtitles)"}
- Target HSK level: ${input.hskLevel}
- Tone / style: ${TONE_LABELS[input.tone]}
- Mongolian explanations and translations must be natural, not robotic.
- Use short-drama conversational style where dialogue fits the tone.

OUTPUT REQUIREMENTS (STRICT)
- Return VALID JSON ONLY. No markdown, no code fences, no commentary before or after.
- Root object with exactly these keys: "subtitles", "vocabulary", "quizQuestions"
- ${pinyinRule}

COUNTS
- subtitles: exactly ${input.subtitleLineCount} timed lines
- vocabulary: exactly ${input.vocabularyCount} words (mostly ${input.hskLevel} level; mix adjacent levels if needed for the scene)
- quizQuestions: exactly ${input.quizCount} questions (mix multiple_choice and cloze)

SUBTITLES (array items)
- start: "MM:SS" or "HH:MM:SS"
- end: "MM:SS" or "HH:MM:SS"
- chinese: string
- pinyin: string
- mongolian: natural Mongolian translation

VOCABULARY (array items)
- chinese, pinyin, mongolian, hskLevel (e.g. "${input.hskLevel}")
- exampleChinese: example sentence in Chinese
- exampleMongolian: natural Mongolian for the example
- No duplicate chinese words.

QUIZ (array items)
- type: "multiple_choice" or "cloze"
- question: string (Mongolian question text is OK)
- options: array of at least 2 strings
- correctAnswer: MUST exactly match one value in options
- explanation: short Mongolian explanation

JSON SHAPE EXAMPLE (structure only — replace all content):
{
  "subtitles": [
    {
      "start": "00:00",
      "end": "00:03",
      "chinese": "...",
      "pinyin": "...",
      "mongolian": "..."
    }
  ],
  "vocabulary": [
    {
      "chinese": "...",
      "pinyin": "...",
      "mongolian": "...",
      "hskLevel": "${input.hskLevel}",
      "exampleChinese": "...",
      "exampleMongolian": "..."
    }
  ],
  "quizQuestions": [
    {
      "type": "multiple_choice",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}

Generate the full JSON now.`;
}

export const PROMPT_EXAMPLE_PREVIEW = `Return VALID JSON ONLY with keys subtitles, vocabulary, quizQuestions…`;
