"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminAlert,
  AdminEditorSection,
  adminInputClass,
} from "@/components/admin/admin-editor-ui";
import { parseTutorNote, type TutorNote } from "@/lib/mock-test/tutor-note";

const btnPrimary =
  "inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TestOption = {
  id: string;
  title: string;
  hsk_level: number;
  total_questions: number;
};

type PreviewRow =
  | { index: number; ok: true; id: string; note: TutorNote }
  | { index: number; ok: false; id: string | null; error: string };

type ImportResult = {
  ok: boolean;
  updated: number;
  missing?: string[];
  errors?: string[];
  mode?: string;
};

const SAMPLE = `[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "tutor_note": {
      "transcript": [
        { "zh": "男：…", "pinyin": "…", "mn": "…" }
      ],
      "key": "…",
      "keyMn": "…",
      "why": "…",
      "wrong": { "A": "…", "C": "…" },
      "trap": "…",
      "tip": "…",
      "words": [ { "zh": "…", "pinyin": "…", "mn": "…" } ]
    }
  }
]`;

function parsePasted(text: string): { rows: PreviewRow[]; fatal: string | null } {
  const trimmed = text.trim();
  if (!trimmed) return { rows: [], fatal: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    return {
      rows: [],
      fatal: `JSON уншигдсангүй: ${error instanceof Error ? error.message : "алдаа"}`,
    };
  }
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
      ? ((parsed as { items: unknown[] }).items)
      : null;
  if (!list) return { rows: [], fatal: "JSON массив хүлээж байна: [{ id, tutor_note }, …]" };

  const rows: PreviewRow[] = list.map((raw, index) => {
    const row = raw as { id?: unknown; tutor_note?: unknown };
    const id = typeof row?.id === "string" ? row.id.trim() : null;
    if (!id || !UUID_RE.test(id)) {
      return { index, ok: false, id, error: "id буруу (uuid биш)" };
    }
    const note = parseTutorNote(row.tutor_note);
    if (!note) {
      return {
        index,
        ok: false,
        id,
        error: "tutor_note буруу — «why» заавал; transcript/wrong/words төрлөө шалга",
      };
    }
    return { index, ok: true, id, note };
  });
  return { rows, fatal: null };
}

export function TutorNotesAdminClient({ tests }: { tests: TestOption[] }) {
  const [skill, setSkill] = useState<string>("listening");
  const [level, setLevel] = useState<string>("");
  const [testId, setTestId] = useState<string>("");
  const [format, setFormat] = useState<"json" | "csv">("json");

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const levels = useMemo(
    () => [...new Set(tests.map((test) => test.hsk_level))].sort((a, b) => a - b),
    [tests]
  );
  const testsShown = useMemo(
    () => (level ? tests.filter((test) => String(test.hsk_level) === level) : tests),
    [tests, level]
  );

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (skill) params.set("skill", skill);
    if (level) params.set("level", level);
    if (testId) params.set("test", testId);
    if (format === "csv") params.set("format", "csv");
    const query = params.toString();
    return `/api/admin/mock-tests/export${query ? `?${query}` : ""}`;
  }, [skill, level, testId, format]);

  const preview = useMemo(() => parsePasted(text), [text]);
  const validRows = preview.rows.filter((row): row is Extract<PreviewRow, { ok: true }> => row.ok);
  const invalidRows = preview.rows.filter((row) => !row.ok);
  const duplicateIds = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const row of validRows) {
      if (seen.has(row.id)) dupes.add(row.id);
      seen.add(row.id);
    }
    return dupes;
  }, [validRows]);

  const submit = async () => {
    if (validRows.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/admin/mock-tests/tutor-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          validRows.map((row) => ({ id: row.id, tutor_note: row.note }))
        ),
      });
      const data = (await response.json()) as ImportResult;
      if (!response.ok && !data.updated) {
        setError(data.errors?.join("\n") || `Алдаа: HTTP ${response.status}`);
        return;
      }
      setResult(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Илгээхэд алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Загвар шалгалт
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          🎓 Багшийн тайлбар (私教讲解)
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          1) Асуултуудаа экспортлоод тайлбар бичүүлнэ. 2) Бэлэн болсон JSON-оо доор
          буулгаж, урьдчилан шалгаад импортлоно. Тайлбар нь дасгалын горимд
          «Багшийн тайлбар» карт болж гарна; байхгүй асуултад хуучин тайлбар
          хэвээр харагдана.
        </p>
      </div>

      <AdminEditorSection
        title="1. Экспорт"
        description="Тайлбар бичих асуултуудыг татаж авна (id, stem, options, correct_answer, audio_transcript, explanation_mn, has_tutor_note)."
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">
            Чадвар
            <select
              className={adminInputClass}
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
            >
              <option value="">Бүгд</option>
              <option value="listening">Сонсгол</option>
              <option value="reading">Унших</option>
              <option value="writing">Бичих</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Түвшин
            <select
              className={adminInputClass}
              value={level}
              onChange={(event) => {
                setLevel(event.target.value);
                setTestId("");
              }}
            >
              <option value="">Бүгд</option>
              {levels.map((item) => (
                <option key={item} value={String(item)}>
                  HSK {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Шалгалт
            <select
              className={adminInputClass}
              value={testId}
              onChange={(event) => setTestId(event.target.value)}
            >
              <option value="">Бүгд</option>
              {testsShown.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.id} · {test.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Формат
            <select
              className={adminInputClass}
              value={format}
              onChange={(event) => setFormat(event.target.value === "csv" ? "csv" : "json")}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={exportHref} className={btnPrimary} download>
            ⬇ Экспорт татах ({format.toUpperCase()})
          </a>
          <code className="text-xs text-slate-500">{exportHref}</code>
        </div>
      </AdminEditorSection>

      <AdminEditorSection
        title="2. Импорт"
        description="JSON массив буулга: [{ id: <асуултын uuid>, tutor_note: {…} }, …]. «why» заавал; бусад талбар сонголттой."
      >
        <textarea
          className={`${adminInputClass} min-h-[220px] font-mono text-xs`}
          value={text}
          placeholder={SAMPLE}
          spellCheck={false}
          onChange={(event) => {
            setText(event.target.value);
            setResult(null);
            setError(null);
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={btnPrimary}
            disabled={busy || validRows.length === 0 || duplicateIds.size > 0}
            onClick={submit}
          >
            {busy ? "Илгээж байна…" : `Импортлох (${validRows.length})`}
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setText("");
              setResult(null);
              setError(null);
            }}
          >
            Цэвэрлэх
          </button>
          <span className="text-xs text-slate-500">
            {preview.rows.length} мөр · {validRows.length} зөв · {invalidRows.length} алдаатай
            {duplicateIds.size > 0 ? ` · ${duplicateIds.size} давхардсан id` : ""}
          </span>
        </div>

        <AdminAlert
          error={
            preview.fatal ??
            error ??
            (duplicateIds.size > 0
              ? `Давхардсан id: ${[...duplicateIds].join(", ")}`
              : null)
          }
          success={
            result
              ? `${result.updated} асуултын тайлбар шинэчлэгдлээ${
                  result.missing?.length ? ` · олдоогүй id: ${result.missing.length}` : ""
                }${result.errors?.length ? ` · алдаа: ${result.errors.length}` : ""}`
              : null
          }
        />
        {result?.missing?.length ? (
          <p className="mt-2 text-xs text-amber-700">
            Олдоогүй id: {result.missing.join(", ")}
          </p>
        ) : null}
        {result?.errors?.length ? (
          <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
            {result.errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        {preview.rows.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">id</th>
                  <th className="px-3 py-2">Бичвэр</th>
                  <th className="px-3 py-2">why (тэмдэгт)</th>
                  <th className="px-3 py-2">wrong түлхүүр</th>
                  <th className="px-3 py-2">Урхи / Зөвлөгөө / Үгс</th>
                  <th className="px-3 py-2">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={`${row.index}-${row.id ?? "x"}`}
                    className={`border-t border-slate-100 ${row.ok ? "" : "bg-red-50"}`}
                  >
                    <td className="px-3 py-2 text-slate-500">{row.index + 1}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                      {row.id ?? "—"}
                    </td>
                    {row.ok ? (
                      <>
                        <td className="px-3 py-2">
                          {row.note.transcript ? `✓ ${row.note.transcript.length} мөр` : "—"}
                        </td>
                        <td className="px-3 py-2">{row.note.why.length}</td>
                        <td className="px-3 py-2">
                          {row.note.wrong ? Object.keys(row.note.wrong).join(" · ") : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {row.note.trap ? "🪤" : "·"} {row.note.tip ? "💡" : "·"}{" "}
                          {row.note.words ? `📚${row.note.words.length}` : "·"}
                        </td>
                        <td className="px-3 py-2 text-emerald-700">
                          {duplicateIds.has(row.id) ? "давхардсан" : "зөв"}
                        </td>
                      </>
                    ) : (
                      <td className="px-3 py-2 text-red-700" colSpan={5}>
                        {row.error}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminEditorSection>

      <p className="text-xs text-slate-500">
        Багана: <code>mock_test_questions.tutor_note</code> (jsonb, 069). Импортын өмнө{" "}
        <code>supabase/content/RUN-TUTOR-FROM-GITHUB.sql</code>-ийг Supabase дээр нэг удаа
        ажиллуулсан байх ёстой.{" "}
        <Link href="/review/practice" className="text-emerald-700 underline">
          Дасгалын жагсаалт →
        </Link>
      </p>
    </div>
  );
}
