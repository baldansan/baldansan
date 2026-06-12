"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  applyJsonBlockToGrammarItem,
  grammarItemToJsonBlock,
  parseTeacherOverlayJsonBlock,
  type TeacherGrammarItemForm,
  type TeacherOverlayAdminState,
} from "@/lib/lesson/teacher-overlay-admin";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  initial: TeacherOverlayAdminState;
};

function emptyMistake() {
  return { wrong: "", right: "", why: "" };
}


export function LessonTeacherOverlayEditor({ lesson, initial }: Props) {
  const [state, setState] = useState<TeacherOverlayAdminState>(initial);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initial.grammarItems[0]?.key ?? null
  );
  const [panelMode, setPanelMode] = useState<"form" | "json">("form");
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedItem = useMemo(
    () => state.grammarItems.find((item) => item.key === selectedKey) ?? null,
    [state.grammarItems, selectedKey]
  );

  const updateGrammarItem = useCallback(
    (key: string, patch: Partial<TeacherGrammarItemForm>) => {
      setState((prev) => ({
        ...prev,
        grammarItems: prev.grammarItems.map((item) =>
          item.key === key ? { ...item, ...patch } : item
        ),
      }));
      setSaveOk(false);
    },
    []
  );

  function selectItem(key: string) {
    setSelectedKey(key);
    setPanelMode("form");
    setJsonError(null);
    const item = state.grammarItems.find((row) => row.key === key);
    if (item) {
      setJsonDraft(JSON.stringify(grammarItemToJsonBlock(item), null, 2));
    }
  }

  function switchToJsonTab() {
    if (!selectedItem) return;
    setJsonDraft(JSON.stringify(grammarItemToJsonBlock(selectedItem), null, 2));
    setJsonError(null);
    setPanelMode("json");
  }

  function applyJsonToSelected() {
    if (!selectedItem) return;
    const parsed = parseTeacherOverlayJsonBlock(jsonDraft);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    const next = applyJsonBlockToGrammarItem(selectedItem, parsed.data ?? {});
    updateGrammarItem(selectedItem.key, next);
    setJsonError(null);
    setPanelMode("form");
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}/teacher`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overlay: state }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setSaveError(data.error ?? "Хадгалахад алдаа гарлаа.");
        return;
      }
      setSaveOk(true);
    } catch {
      setSaveError("Сүлжээний алдаа — дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  }

  if (!state.hasJsonSource) {
    return (
      <div className="admin-panel p-6">
        <h1 className="text-lg font-bold text-slate-900">Багшийн давхарга</h1>
        <p className="mt-2 text-sm text-slate-600">
          Энэ хичээл JSON <code className="text-xs">source_note</code> ашигладаггүй тул
          энд засварлах боломжгүй. Эхлээд HSK ZIP импорт хийж JSON бүтэц үүсгэнэ үү.
        </p>
        <Link
          href={`/admin/lessons/${lesson.id}/edit`}
          className="admin-btn-secondary mt-4 inline-flex"
        >
          ← Засвар руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="admin-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Багшийн давхарга</h1>
            <p className="mt-1 text-sm text-slate-600">{lesson.title}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{lesson.id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={lessonPreviewPath(lesson.id, { adminPreview: true, subpath: "watch" })}
              className="admin-btn-secondary"
            >
              Хичээл үзэх
            </Link>
            <Link href={`/admin/lessons/${lesson.id}/edit`} className="admin-btn-secondary">
              ← Засвар
            </Link>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </div>
        </div>
        {saveError ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {saveError}
          </p>
        ) : null}
        {saveOk ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            Хадгалагдлаа — хичээлийн дэлгэц дээр шууд харагдана.
          </p>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <section className="admin-panel p-4">
          <h2 className="admin-section-title">Дүрэм ба үгийн тайлбар</h2>
          <p className="admin-section-desc mt-1">
            Grammar + wordExplanation — item сонгоод засна.
          </p>
          <ul className="mt-3 space-y-1">
            {state.grammarItems.length === 0 ? (
              <li className="text-sm text-slate-500">Одоогоор item алга.</li>
            ) : (
              state.grammarItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => selectItem(item.key)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedKey === item.key
                        ? "bg-emerald-50 font-semibold text-emerald-900 ring-1 ring-emerald-200"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {item.kind === "grammar" ? "Дүрэм" : "Үгийн тайлбар"}
                    </span>
                    {item.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="admin-panel p-5">
          {selectedItem ? (
            <>
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    panelMode === "form"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                  onClick={() => setPanelMode("form")}
                >
                  Форм
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    panelMode === "json"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                  onClick={switchToJsonTab}
                >
                  JSON-оор засах
                </button>
              </div>

              {panelMode === "form" ? (
                <GrammarItemForm
                  item={selectedItem}
                  onChange={(patch) => updateGrammarItem(selectedItem.key, patch)}
                />
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-500">
                    Бэлэн блок paste хийж болно. Зөвхөн teacher талбарууд (structure,
                    teacher_notes, common_mistakes, check).
                  </p>
                  <textarea
                    className="admin-textarea min-h-[220px] font-mono text-xs"
                    value={jsonDraft}
                    onChange={(e) => {
                      setJsonDraft(e.target.value);
                      setJsonError(null);
                    }}
                  />
                  {jsonError ? (
                    <p className="text-sm text-rose-700">{jsonError}</p>
                  ) : null}
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={applyJsonToSelected}
                  >
                    JSON хэрэглэх
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Засах item сонгоно уу.</p>
          )}
        </section>
      </div>

      <section className="admin-panel p-5">
        <h2 className="admin-section-title">Эх бичвэр (mainText)</h2>
        <p className="admin-section-desc mt-1">
          Өгүүлбэр бүрийн тайлбар, догол мөрийн утга, эргэцүүлэх асуултууд.
        </p>

        {state.sentences.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            mainText.sentences олдсонгүй — эх бичвэр импорт хийсний дараа энд гарна.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {state.sentences.map((sentence, idx) => (
              <div
                key={sentence.index}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {idx + 1}. {sentence.zh || "—"}
                </p>
                <label className="admin-label mt-3 block">
                  Тайлбар (note)
                  <textarea
                    className="admin-textarea mt-1 min-h-[72px]"
                    value={sentence.note}
                    onChange={(e) => {
                      const note = e.target.value;
                      setState((prev) => ({
                        ...prev,
                        sentences: prev.sentences.map((row) =>
                          row.index === sentence.index ? { ...row, note } : row
                        ),
                      }));
                      setSaveOk(false);
                    }}
                  />
                </label>
                <label className="admin-label mt-2 block">
                  Түлхүүр бүтэц (таслалаар)
                  <input
                    className="admin-input mt-1"
                    value={sentence.key_structures}
                    placeholder="在……下, 把……+V"
                    onChange={(e) => {
                      const key_structures = e.target.value;
                      setState((prev) => ({
                        ...prev,
                        sentences: prev.sentences.map((row) =>
                          row.index === sentence.index ? { ...row, key_structures } : row
                        ),
                      }));
                      setSaveOk(false);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">Догол мөрийн утга</h3>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-700"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    paragraph_summaries: [...prev.paragraph_summaries, ""],
                  }));
                  setSaveOk(false);
                }}
              >
                + Мөр нэмэх
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {state.paragraph_summaries.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 w-6 shrink-0 text-xs font-bold text-slate-400">
                    {i + 1}.
                  </span>
                  <textarea
                    className="admin-textarea min-h-[56px] flex-1"
                    value={line}
                    onChange={(e) => {
                      const value = e.target.value;
                      setState((prev) => ({
                        ...prev,
                        paragraph_summaries: prev.paragraph_summaries.map((row, idx) =>
                          idx === i ? value : row
                        ),
                      }));
                      setSaveOk(false);
                    }}
                  />
                  <button
                    type="button"
                    className="shrink-0 text-xs text-rose-600"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        paragraph_summaries: prev.paragraph_summaries.filter(
                          (_, idx) => idx !== i
                        ),
                      }));
                      setSaveOk(false);
                    }}
                  >
                    Хасах
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">Эргэцүүлье</h3>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-700"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    reflection_questions: [...prev.reflection_questions, ""],
                  }));
                  setSaveOk(false);
                }}
              >
                + Асуулт нэмэх
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {state.reflection_questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    className="admin-textarea min-h-[56px] flex-1"
                    value={q}
                    onChange={(e) => {
                      const value = e.target.value;
                      setState((prev) => ({
                        ...prev,
                        reflection_questions: prev.reflection_questions.map((row, idx) =>
                          idx === i ? value : row
                        ),
                      }));
                      setSaveOk(false);
                    }}
                  />
                  <button
                    type="button"
                    className="shrink-0 text-xs text-rose-600"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        reflection_questions: prev.reflection_questions.filter(
                          (_, idx) => idx !== i
                        ),
                      }));
                      setSaveOk(false);
                    }}
                  >
                    Хасах
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function GrammarItemForm({
  item,
  onChange,
}: {
  item: TeacherGrammarItemForm;
  onChange: (patch: Partial<TeacherGrammarItemForm>) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <label className="admin-label block">
        Бүтэц (structure)
        <input
          className="admin-input mt-1 font-mono"
          value={item.structure}
          onChange={(e) => onChange({ structure: e.target.value })}
          placeholder="该/应该 + 如何 + үйл үг"
        />
      </label>

      <label className="admin-label block">
        Багшийн зөвлөгөө (teacher_notes)
        <textarea
          className="admin-textarea mt-1 min-h-[100px]"
          value={item.teacher_notes}
          onChange={(e) => onChange({ teacher_notes: e.target.value })}
        />
      </label>

      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="admin-label">Түгээмэл алдаа</span>
          <button
            type="button"
            className="text-xs font-semibold text-emerald-700"
            onClick={() =>
              onChange({
                common_mistakes: [...item.common_mistakes, emptyMistake()],
              })
            }
          >
            + Мөр нэмэх
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {item.common_mistakes.map((row, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="admin-input"
                  placeholder="Буруу (wrong)"
                  value={row.wrong}
                  onChange={(e) => {
                    const mistakes = item.common_mistakes.map((m, idx) =>
                      idx === i ? { ...m, wrong: e.target.value } : m
                    );
                    onChange({ common_mistakes: mistakes });
                  }}
                />
                <input
                  className="admin-input"
                  placeholder="Зөв (right)"
                  value={row.right}
                  onChange={(e) => {
                    const mistakes = item.common_mistakes.map((m, idx) =>
                      idx === i ? { ...m, right: e.target.value } : m
                    );
                    onChange({ common_mistakes: mistakes });
                  }}
                />
              </div>
              <input
                className="admin-input mt-2 w-full"
                placeholder="Яагаад (why)"
                value={row.why}
                onChange={(e) => {
                  const mistakes = item.common_mistakes.map((m, idx) =>
                    idx === i ? { ...m, why: e.target.value } : m
                  );
                  onChange({ common_mistakes: mistakes });
                }}
              />
              <button
                type="button"
                className="mt-2 text-xs text-rose-600"
                onClick={() =>
                  onChange({
                    common_mistakes: item.common_mistakes.filter((_, idx) => idx !== i),
                  })
                }
              >
                Хасах
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="admin-label">Шалгаад үз (check)</span>
        <input
          className="admin-input mt-2 w-full"
          placeholder="Асуулт"
          value={item.check.question}
          onChange={(e) =>
            onChange({ check: { ...item.check, question: e.target.value } })
          }
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">Сонголтууд</span>
          <button
            type="button"
            className="text-xs font-semibold text-emerald-700"
            onClick={() =>
              onChange({
                check: { ...item.check, options: [...item.check.options, ""] },
              })
            }
          >
            + Сонголт
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {item.check.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`check-answer-${item.key}`}
                checked={item.check.answer === opt && Boolean(opt)}
                onChange={() => onChange({ check: { ...item.check, answer: opt } })}
              />
              <input
                className="admin-input flex-1"
                value={opt}
                onChange={(e) => {
                  const options = item.check.options.map((o, idx) =>
                    idx === i ? e.target.value : o
                  );
                  const answer =
                    item.check.answer === opt ? e.target.value : item.check.answer;
                  onChange({ check: { ...item.check, options, answer } });
                }}
              />
              <button
                type="button"
                className="text-xs text-rose-600"
                onClick={() => {
                  const removed = item.check.options[i];
                  const options = item.check.options.filter((_, idx) => idx !== i);
                  const answer =
                    item.check.answer === removed ? "" : item.check.answer;
                  onChange({ check: { ...item.check, options, answer } });
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {item.check.options.length === 0 ? (
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-emerald-700"
            onClick={() =>
              onChange({ check: { ...item.check, options: [""] } })
            }
          >
            Сонголт нэмэх
          </button>
        ) : null}
      </div>
    </div>
  );
}
