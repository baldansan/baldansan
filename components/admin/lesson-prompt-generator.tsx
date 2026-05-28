"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  buildLessonContentPrompt,
  PROMPT_EXAMPLE_PREVIEW,
  type HskTargetLevel,
  type LessonPromptTone,
} from "@/lib/admin/lesson-prompt";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
};

const HSK_LEVELS: HskTargetLevel[] = [
  "HSK1",
  "HSK2",
  "HSK3",
  "HSK4",
  "HSK5",
  "HSK6",
];

const TONES: { id: LessonPromptTone; label: string }[] = [
  { id: "emotional_drama", label: "Emotional short drama" },
  { id: "daily_conversation", label: "Daily conversation" },
  { id: "taobao_practical", label: "Taobao practical Chinese" },
  { id: "workplace", label: "Workplace conversation" },
];

export function LessonPromptGenerator({ lesson }: Props) {
  const [hskLevel, setHskLevel] = useState<HskTargetLevel>("HSK5");
  const [subtitleLineCount, setSubtitleLineCount] = useState(12);
  const [vocabularyCount, setVocabularyCount] = useState(10);
  const [quizCount, setQuizCount] = useState(5);
  const [tone, setTone] = useState<LessonPromptTone>("emotional_drama");
  const [includePinyin, setIncludePinyin] = useState(true);
  const [promptText, setPromptText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const defaultPrompt = useMemo(
    () =>
      buildLessonContentPrompt({
        lessonId: lesson.id,
        title: lesson.title,
        chineseTitle: lesson.chineseTitle,
        subtitle: lesson.subtitle,
        description: lesson.description,
        hskLevel,
        subtitleLineCount,
        vocabularyCount,
        quizCount,
        tone,
        includePinyin,
      }),
    [
      lesson.id,
      lesson.title,
      lesson.chineseTitle,
      lesson.subtitle,
      lesson.description,
      hskLevel,
      subtitleLineCount,
      vocabularyCount,
      quizCount,
      tone,
      includePinyin,
    ]
  );

  const handleGenerate = useCallback(() => {
    setPromptText(defaultPrompt);
    setCopySuccess(null);
    setCopyError(null);
  }, [defaultPrompt]);

  async function handleCopy() {
    const text = promptText.trim() || defaultPrompt;
    setCopyError(null);
    setCopySuccess(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess("Prompt clipboard руу хууллаа.");
    } catch {
      setCopyError("Clipboard хуулахад алдаа. Prompt-оо гараар copy хийнэ үү.");
    }
  }

  function handleClear() {
    setPromptText("");
    setCopySuccess(null);
    setCopyError(null);
  }

  const displayPrompt = promptText.trim() || defaultPrompt;

  return (
    <AdminEditorSection
      title="Lesson content prompt generator"
      description="ChatGPT/Cursor-д өгөх JSON prompt үүсгэнэ. API дуудахгүй — зөвхөн текст."
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            Target HSK level
            <select
              value={hskLevel}
              onChange={(e) => setHskLevel(e.target.value as HskTargetLevel)}
              className={adminInputClass}
            >
              {HSK_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Tone
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as LessonPromptTone)}
              className={adminInputClass}
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Subtitle lines
            <input
              type="number"
              min={1}
              max={80}
              value={subtitleLineCount}
              onChange={(e) =>
                setSubtitleLineCount(Math.max(1, Number(e.target.value) || 1))
              }
              className={adminInputClass}
            />
          </label>
          <label className="text-sm text-slate-700">
            Vocabulary count
            <input
              type="number"
              min={1}
              max={50}
              value={vocabularyCount}
              onChange={(e) =>
                setVocabularyCount(Math.max(1, Number(e.target.value) || 1))
              }
              className={adminInputClass}
            />
          </label>
          <label className="text-sm text-slate-700">
            Quiz count
            <input
              type="number"
              min={1}
              max={20}
              value={quizCount}
              onChange={(e) =>
                setQuizCount(Math.max(1, Number(e.target.value) || 1))
              }
              className={adminInputClass}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includePinyin}
              onChange={(e) => setIncludePinyin(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Include pinyin
          </label>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
          <p>
            <span className="font-medium text-slate-800">Lesson:</span>{" "}
            {lesson.title} · {lesson.chineseTitle}
          </p>
          {lesson.subtitle ? (
            <p className="mt-1">{lesson.subtitle}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="w-fit text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          {showPreview ? "Example prompt preview нуух" : "Example prompt preview"}
        </button>
        {showPreview ? (
          <p className="text-xs text-slate-500">{PROMPT_EXAMPLE_PREVIEW}</p>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Generated prompt (editable)
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={16}
            placeholder="Generate prompt дарж эхлэнэ үү…"
            className={`${adminInputClass} font-mono text-xs leading-relaxed`}
            spellCheck={false}
          />
        </label>

        {!promptText.trim() ? (
          <p className="text-xs text-slate-500">
            Preview: {displayPrompt.slice(0, 120)}…
          </p>
        ) : null}

        <AdminAlert error={copyError} success={copySuccess} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Generate prompt
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Copy prompt
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300"
          >
            Clear
          </button>
        </div>
      </div>
    </AdminEditorSection>
  );
}
