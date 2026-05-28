"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import {
  bulkImportLessonContent,
  parseAndValidateLessonImport,
  type BulkImportMode,
  type ImportValidationResult,
} from "@/lib/supabase/admin-import";

const EXAMPLE_JSON = `{
  "subtitles": [
    {
      "start": "00:00",
      "end": "00:03",
      "chinese": "你为什么不说？",
      "pinyin": "Nǐ wèishénme bù shuō?",
      "mongolian": "Чи яагаад хэлээгүй юм бэ?"
    }
  ],
  "vocabulary": [
    {
      "chinese": "为什么",
      "pinyin": "wèishénme",
      "mongolian": "яагаад",
      "hskLevel": "HSK2",
      "exampleChinese": "你为什么不说？",
      "exampleMongolian": "Чи яагаад хэлээгүй юм бэ?"
    }
  ],
  "quizQuestions": [
    {
      "type": "multiple_choice",
      "question": "\\"为什么\\" гэдэг үгийн зөв утга аль вэ?",
      "options": ["яагаад", "хаана", "хэзээ", "хэн"],
      "correctAnswer": "яагаад",
      "explanation": "\\"为什么\\" нь why буюу яагаад гэсэн утгатай."
    }
  ]
}`;

type Props = {
  lessonId: string;
  onImportSuccess?: () => void;
};

export function BulkImportEditor({ lessonId, onImportSuccess }: Props) {
  const router = useRouter();
  const [rawJson, setRawJson] = useState("");
  const [mode, setMode] = useState<BulkImportMode>("append");
  const [showExample, setShowExample] = useState(false);
  const [validation, setValidation] = useState<ImportValidationResult | null>(
    null
  );
  const [busy, setBusy] = useState<"validate" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleValidate = useCallback(() => {
    setError(null);
    setSuccess(null);
    setBusy("validate");
    const result = parseAndValidateLessonImport(rawJson);
    setBusy(null);
    setValidation(result);
    if (!result.valid) {
      setError(result.errors.join(" "));
      return;
    }
    setSuccess(
      `Validation OK: ${result.counts.subtitles} subtitles, ${result.counts.vocabulary} vocabulary, ${result.counts.quizQuestions} quiz.`
    );
  }, [rawJson]);

  async function handleImport() {
    setError(null);
    setSuccess(null);
    setBusy("import");

    const result = parseAndValidateLessonImport(rawJson);
    setValidation(result);

    if (!result.valid) {
      setBusy(null);
      setError(result.errors.join(" "));
      return;
    }

    const imported = await bulkImportLessonContent(lessonId, result.payload, {
      mode,
    });
    setBusy(null);

    if (imported.error) {
      setError(imported.error);
      return;
    }

    const summary = imported.data;
    setSuccess(
      summary
        ? `Import амжилттай боллоо. (${summary.mode}: +${summary.subtitlesInserted} subtitles, +${summary.vocabularyInserted} vocabulary, +${summary.quizQuestionsInserted} quiz)`
        : "Import амжилттай боллоо."
    );
    onImportSuccess?.();
    router.refresh();
  }

  function handleClear() {
    setRawJson("");
    setValidation(null);
    setError(null);
    setSuccess(null);
  }

  return (
    <AdminEditorSection
      title="Bulk import content"
      description="ChatGPT/Cursor-оор үүсгэсэн JSON content-оо энд paste хийнэ."
    >
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="w-fit text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          {showExample ? "Example JSON нуух" : "Example JSON харах"}
        </button>

        {showExample ? (
          <pre className="max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            {EXAMPLE_JSON}
          </pre>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Lesson JSON
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            rows={14}
            placeholder='{ "subtitles": [], "vocabulary": [], "quizQuestions": [] }'
            className={`${adminInputClass} font-mono text-xs`}
            spellCheck={false}
          />
        </label>

        <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <legend className="sr-only">Import mode</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={`import-mode-${lessonId}`}
              checked={mode === "append"}
              onChange={() => setMode("append")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            Append to existing content
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={`import-mode-${lessonId}`}
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            Replace existing content
          </label>
        </fieldset>

        {validation?.valid ? (
          <p className="text-sm text-emerald-800">
            Ready: {validation.counts.subtitles} subtitles ·{" "}
            {validation.counts.vocabulary} vocabulary ·{" "}
            {validation.counts.quizQuestions} quiz questions
          </p>
        ) : null}

        <AdminAlert error={error} success={success} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null || !rawJson.trim()}
            onClick={handleValidate}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "validate" ? "Validating…" : "Validate JSON"}
          </button>
          <button
            type="button"
            disabled={busy !== null || !rawJson.trim()}
            onClick={handleImport}
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {busy === "import" ? "Importing…" : "Import content"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleClear}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300"
          >
            Clear
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Format: project root <code className="text-emerald-800">LESSON_IMPORT_FORMAT.md</code>.
          Replace mode зөвхөн энэ хичээлийн subtitle/vocabulary/quiz мөрүүдийг устгана.
        </p>
      </div>
    </AdminEditorSection>
  );
}
