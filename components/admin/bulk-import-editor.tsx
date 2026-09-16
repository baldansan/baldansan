"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import {
  getLessonContentRowCounts,
  type LessonContentRowCounts,
} from "@/lib/supabase/admin-content";

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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [existingCounts, setExistingCounts] =
    useState<LessonContentRowCounts | null>(null);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getLessonContentRowCounts(lessonId).then((result) => {
      if (!cancelled && result.data) {
        setExistingCounts(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const handleValidate = useCallback(() => {
    setError(null);
    setSuccess(null);
    setWarnings([]);
    setBusy("validate");
    const result = parseAndValidateLessonImport(rawJson);
    setBusy(null);
    setValidation(result);
    setWarnings(result.warnings);
    if (!result.valid) {
      setError(result.errors.join(" "));
      return;
    }
    const warnNote =
      result.warnings.length > 0
        ? ` (${result.warnings.length} анхааруулга — оруулж болно)`
        : "";
    setSuccess(
      `Шалгалт давлаа: ${result.counts.subtitles} хадмал, ${result.counts.vocabulary} үг, ${result.counts.quizQuestions} дасгал.${warnNote}`
    );
  }, [rawJson]);

  async function handleImport() {
    setError(null);
    setSuccess(null);

    if (mode === "replace" && !replaceConfirmed) {
      setError("Солих үйлдлийг баталгаажуулна уу.");
      return;
    }

    setBusy("import");

    const result = parseAndValidateLessonImport(rawJson);
    setValidation(result);

    setWarnings(result.warnings);

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
        ? `Амжилттай орууллаа. (${summary.mode}: +${summary.subtitlesInserted} хадмал, +${summary.vocabularyInserted} үг, +${summary.quizQuestionsInserted} дасгал)`
        : "Амжилттай орууллаа."
    );
    onImportSuccess?.();
    void getLessonContentRowCounts(lessonId).then((r) => {
      if (r.data) setExistingCounts(r.data);
    });
    router.refresh();
  }

  function handleClear() {
    setRawJson("");
    setValidation(null);
    setError(null);
    setSuccess(null);
    setWarnings([]);
    setReplaceConfirmed(false);
  }

  return (
    <AdminEditorSection
      title="Контент бөөнөөр оруулах"
      description="ChatGPT/Cursor-оор үүсгэсэн JSON-оо энд буулгана. Нөөц хуулбарын JSON (`lesson`, `exportedAt`) буулгавал ерөнхий мэдээллийн хэсгийг тооцохгүй — зөвхөн subtitles, vocabulary, quizQuestions хэсгийг оруулна."
    >
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="w-fit text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          {showExample ? "Жишээ JSON нуух" : "Жишээ JSON харах"}
        </button>

        {showExample ? (
          <pre className="max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            {EXAMPLE_JSON}
          </pre>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Хичээлийн JSON
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
          <legend className="sr-only">Оруулах горим</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={`import-mode-${lessonId}`}
              checked={mode === "append"}
              onChange={() => {
                setMode("append");
                setReplaceConfirmed(false);
              }}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            Одоо байгаа контент дээр нэмэх
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={`import-mode-${lessonId}`}
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            Одоо байгаа контентыг солих
          </label>
        </fieldset>

        {existingCounts ? (
          <p className="text-sm text-slate-600">
            Одоогийн контент: {existingCounts.subtitles} хадмал ·{" "}
            {existingCounts.vocabulary} үг ·{" "}
            {existingCounts.quizQuestions} дасгал
          </p>
        ) : null}

        {mode === "replace" ? (
          <div className="space-y-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <p>
              Солих горим нь одоогийн хадмал, үг, дасгалыг устгаад шинэ JSON-оор
              солино.
            </p>
            <p>
              Энэ үйлдлийг буцаах боломжгүй байж магадгүй. Нөөц хуулбараа
              гаргасан эсэхээ шалгана уу.
            </p>
            <p className="font-medium text-amber-950">
              Эхлээд хичээлийн нөөц хуулбарыг гаргахыг зөвлөж байна.
            </p>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={replaceConfirmed}
                onChange={(e) => setReplaceConfirmed(e.target.checked)}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Би энэ үйлдлийг ойлгож байна.</span>
            </label>
          </div>
        ) : null}

        {validation?.valid ? (
          <p className="text-sm text-emerald-800">
            Оруулахад бэлэн: {validation.counts.subtitles} хадмал ·{" "}
            {validation.counts.vocabulary} үг ·{" "}
            {validation.counts.quizQuestions} дасгалын асуулт
          </p>
        ) : null}

        {validation && !validation.valid && validation.errors.length > 0 ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
            <p className="font-semibold">Алдаа (оруулах боломжгүй)</p>
            <ul className="mt-2 max-h-32 list-inside list-disc overflow-auto">
              {validation.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <p className="font-semibold">Анхааруулга (оруулж болно)</p>
            <ul className="mt-2 max-h-32 list-inside list-disc overflow-auto">
              {warnings.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <AdminAlert error={error} success={success} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null || !rawJson.trim()}
            onClick={handleValidate}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "validate" ? "Шалгаж байна…" : "JSON шалгах"}
          </button>
          <button
            type="button"
            disabled={
              busy !== null ||
              !rawJson.trim() ||
              (mode === "replace" && !replaceConfirmed)
            }
            onClick={handleImport}
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {busy === "import" ? "Оруулж байна…" : "Контент оруулах"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleClear}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300"
          >
            Цэвэрлэх
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Формат: төслийн үндсэн хавтасны{" "}
          <code className="text-emerald-800">LESSON_IMPORT_FORMAT.md</code>. Солих
          горим нь зөвхөн энэ хичээлийн хадмал, үг, дасгалын мөрүүдийг устгана.
        </p>
      </div>
    </AdminEditorSection>
  );
}
