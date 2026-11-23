"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToneHanzi } from "@/components/hanzi/ToneHanzi";
import { SpeakerButton } from "@/components/tts/speaker-button";
import {
  DICT_STATUS_LABEL,
  POS_OPTIONS,
  type DictCollocation,
  type DictEntry,
  type DictSavePayload,
  type DictSense,
  type DictStatus,
  type DictWordFull,
} from "@/lib/dictionary/types";

type SenseDraft = Omit<DictSense, "id" | "examples"> & {
  examples: { zh: string; pinyin: string; mn: string }[];
  synonymsText: string;
};

function emptySense(no: number): SenseDraft {
  return {
    sense_no: no,
    pos: "",
    gloss_zh: "",
    meaning_mn: "",
    synonyms_mn: [],
    synonymsText: "",
    meaning_en: "",
    note_mn: "",
    examples: [{ zh: "", pinyin: "", mn: "" }, { zh: "", pinyin: "", mn: "" }],
  };
}

function toDraft(s: DictSense): SenseDraft {
  return {
    sense_no: s.sense_no,
    pos: s.pos ?? "",
    gloss_zh: s.gloss_zh ?? "",
    meaning_mn: s.meaning_mn,
    synonyms_mn: s.synonyms_mn,
    synonymsText: s.synonyms_mn.join(", "),
    meaning_en: s.meaning_en ?? "",
    note_mn: s.note_mn ?? "",
    examples: s.examples.length
      ? s.examples.map((e) => ({ zh: e.zh, pinyin: e.pinyin ?? "", mn: e.mn }))
      : [{ zh: "", pinyin: "", mn: "" }],
  };
}

const splitList = (t: string) =>
  t.split(/[,;，；、\n]/).map((x) => x.trim()).filter(Boolean);

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none";
const label = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

/** Багшийн толь хянах дэлгэц — нэг үг бүтнээр: утгууд, синонимууд, жишээ, хэрэглээний тайлбар. */
export function DictionaryEditor({ data, nextHref }: { data: DictWordFull; nextHref: string | null }) {
  const router = useRouter();
  const { word } = data;
  const e0: DictEntry | null = data.entry;

  const [senses, setSenses] = useState<SenseDraft[]>(
    data.senses.length
      ? data.senses.map(toDraft)
      : [
          {
            ...emptySense(1),
            meaning_mn: word.meaning_mn ?? "",
            meaning_en: word.meaning_en ?? "",
            pos: word.pos?.[0] ?? "",
            examples: [
              { zh: word.example_zh ?? "", pinyin: "", mn: word.example_mn ?? "" },
              { zh: "", pinyin: "", mn: "" },
            ],
          },
        ]
  );
  const [usage, setUsage] = useState(e0?.usage_note_mn ?? "");
  const [measure, setMeasure] = useState((e0?.measure_words ?? []).join(", "));
  const [confusable, setConfusable] = useState((e0?.confusable_with ?? []).join(", "));
  const [register, setRegister] = useState(e0?.register ?? "хоёулаа");
  const [collocations, setCollocations] = useState<DictCollocation[]>(
    e0?.collocations?.length ? e0.collocations : [{ zh: "", pinyin: "", mn: "" }]
  );
  const [busy, setBusy] = useState<DictStatus | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const curStatus = e0?.status ?? null;

  function patchSense(i: number, p: Partial<SenseDraft>) {
    setSenses((arr) => arr.map((s, k) => (k === i ? { ...s, ...p } : s)));
  }
  function patchExample(i: number, j: number, p: Partial<{ zh: string; pinyin: string; mn: string }>) {
    setSenses((arr) =>
      arr.map((s, k) =>
        k === i ? { ...s, examples: s.examples.map((e, m) => (m === j ? { ...e, ...p } : e)) } : s
      )
    );
  }

  async function save(status: DictStatus) {
    if (busy) return;
    setBusy(status);
    setMsg(null);
    const payload: DictSavePayload = {
      wordId: word.id,
      status,
      entry: {
        usage_note_mn: usage,
        measure_words: splitList(measure),
        confusable_with: splitList(confusable),
        register,
        collocations: collocations.filter((c) => c.zh.trim() && c.mn.trim()),
      },
      senses: senses
        .filter((s) => s.meaning_mn.trim())
        .map((s, i) => ({
          sense_no: i + 1,
          pos: s.pos || null,
          gloss_zh: s.gloss_zh || null,
          meaning_mn: s.meaning_mn.trim(),
          synonyms_mn: splitList(s.synonymsText),
          meaning_en: s.meaning_en || null,
          note_mn: s.note_mn || null,
          examples: s.examples
            .filter((e) => e.zh.trim() && e.mn.trim())
            .map((e) => ({ zh: e.zh.trim(), pinyin: e.pinyin.trim() || null, mn: e.mn.trim() })),
        })),
    };
    try {
      const res = await fetch("/api/admin/dictionary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setMsg(`Хадгаллаа — ${DICT_STATUS_LABEL[status]}`);
      if (status === "approved" && nextHref) {
        router.push(nextHref);
      } else {
        router.refresh();
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Алдаа");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Зүүн: үгийн толгой */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
        <div className="flex items-start justify-between gap-2">
          <ToneHanzi word={word.simplified} pinyin={word.pinyin} size="xl" className="!items-start" />
          <SpeakerButton text={word.simplified} lang="zh-CN" size="md" showInlineError={false} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-200">
            HSK {word.hsk_level}
          </span>
          {(word.pos ?? []).map((p) => (
            <span key={p} className="rounded-full bg-slate-50 px-2 py-0.5 font-semibold text-slate-500 ring-1 ring-slate-200">
              {p}
            </span>
          ))}
          {curStatus ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 ring-1 ring-amber-200">
              {DICT_STATUS_LABEL[curStatus]}
            </span>
          ) : null}
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className={label}>Хуучин монгол утга</dt>
            <dd className="text-slate-700">{word.meaning_mn ?? "—"}</dd>
          </div>
          <div>
            <dt className={label}>Англи (CC-CEDICT)</dt>
            <dd className="text-slate-600">{word.meaning_en ?? "—"}</dd>
          </div>
          {word.example_zh ? (
            <div>
              <dt className={label}>Хуучин жишээ</dt>
              <dd className="hanzi text-slate-700">{word.example_zh}</dd>
              <dd className="text-slate-500">{word.example_mn}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void save("approved")}
            className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ✓ Батлах {nextHref ? "→ дараагийнх" : ""}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void save("reviewed")}
            className="w-full rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            Хянасан гэж хадгалах
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void save("draft")}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Ноорог хадгалах
          </button>
          {msg ? <p className="text-xs text-slate-600">{msg}</p> : null}
        </div>
      </aside>

      {/* Баруун: утгууд */}
      <div className="space-y-4">
        {senses.map((s, i) => (
          <section key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Утга {i + 1}</h3>
              <div className="flex gap-2 text-xs">
                {i > 0 ? (
                  <button
                    type="button"
                    className="text-slate-500 hover:text-slate-900"
                    onClick={() =>
                      setSenses((arr) => {
                        const c = [...arr];
                        [c[i - 1], c[i]] = [c[i], c[i - 1]];
                        return c;
                      })
                    }
                  >
                    ↑ дээш
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-rose-600 hover:text-rose-800"
                  onClick={() => setSenses((arr) => arr.filter((_, k) => k !== i))}
                >
                  Устгах
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr]">
              <div>
                <label className={label}>Аймаг</label>
                <select className={field} value={s.pos ?? ""} onChange={(e) => patchSense(i, { pos: e.target.value })}>
                  <option value="">—</option>
                  {POS_OPTIONS.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.v} · {o.mn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Монгол утга (үндсэн)</label>
                <input className={field} value={s.meaning_mn} onChange={(e) => patchSense(i, { meaning_mn: e.target.value })} />
              </div>
              <div>
                <label className={label}>Хятад тайлбар 释义</label>
                <input className={`${field} hanzi`} value={s.gloss_zh ?? ""} onChange={(e) => patchSense(i, { gloss_zh: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Монгол синонимууд (таслалаар) — үгийн баялаг</label>
                <input
                  className={field}
                  value={s.synonymsText}
                  placeholder="харах, үзэх, ажиглах, ширтэх"
                  onChange={(e) => patchSense(i, { synonymsText: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>Англи</label>
                <input className={field} value={s.meaning_en ?? ""} onChange={(e) => patchSense(i, { meaning_en: e.target.value })} />
              </div>
            </div>
            <div className="mt-3">
              <label className={label}>Энэ утгын тайлбар (хэрэглээ, өнгө аяс)</label>
              <input className={field} value={s.note_mn ?? ""} onChange={(e) => patchSense(i, { note_mn: e.target.value })} />
            </div>

            <div className="mt-3 space-y-2">
              <label className={label}>Жишээ өгүүлбэр</label>
              {s.examples.map((ex, j) => (
                <div key={j} className="grid gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input className={`${field} hanzi`} placeholder="汉语" value={ex.zh} onChange={(e) => patchExample(i, j, { zh: e.target.value })} />
                  <input className={field} placeholder="pīnyīn" value={ex.pinyin} onChange={(e) => patchExample(i, j, { pinyin: e.target.value })} />
                  <input className={field} placeholder="Монгол" value={ex.mn} onChange={(e) => patchExample(i, j, { mn: e.target.value })} />
                  <button
                    type="button"
                    className="text-xs text-rose-600"
                    onClick={() => patchSense(i, { examples: s.examples.filter((_, m) => m !== j) })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-semibold text-emerald-700"
                onClick={() => patchSense(i, { examples: [...s.examples, { zh: "", pinyin: "", mn: "" }] })}
              >
                + жишээ нэмэх
              </button>
            </div>
          </section>
        ))}
        <button
          type="button"
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
          onClick={() => setSenses((arr) => [...arr, emptySense(arr.length + 1)])}
        >
          + Утга нэмэх
        </button>

        {/* Үгийн түвшний мэдээлэл */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Үгийн хэрэглээ</h3>
          <div>
            <label className={label}>Хэрэглээний тайлбар (хэзээ, юунаас ялгаатай)</label>
            <textarea className={`${field} min-h-[72px]`} value={usage} onChange={(e) => setUsage(e.target.value)} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className={label}>Тооны нэр</label>
              <input className={`${field} hanzi`} placeholder="个, 本" value={measure} onChange={(e) => setMeasure(e.target.value)} />
            </div>
            <div>
              <label className={label}>Андуурагддаг үгс</label>
              <input className={`${field} hanzi`} placeholder="见, 瞧" value={confusable} onChange={(e) => setConfusable(e.target.value)} />
            </div>
            <div>
              <label className={label}>Хэв маяг</label>
              <select className={field} value={register} onChange={(e) => setRegister(e.target.value)}>
                {["хоёулаа", "ярианы", "бичгийн", "албан", "хуучин"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <label className={label}>Холбоо үг (collocations)</label>
            {collocations.map((c, j) => (
              <div key={j} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input className={`${field} hanzi`} placeholder="看书" value={c.zh} onChange={(e) => setCollocations((a) => a.map((x, k) => (k === j ? { ...x, zh: e.target.value } : x)))} />
                <input className={field} placeholder="kàn shū" value={c.pinyin ?? ""} onChange={(e) => setCollocations((a) => a.map((x, k) => (k === j ? { ...x, pinyin: e.target.value } : x)))} />
                <input className={field} placeholder="ном унших" value={c.mn} onChange={(e) => setCollocations((a) => a.map((x, k) => (k === j ? { ...x, mn: e.target.value } : x)))} />
                <button type="button" className="text-xs text-rose-600" onClick={() => setCollocations((a) => a.filter((_, k) => k !== j))}>
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-xs font-semibold text-emerald-700"
              onClick={() => setCollocations((a) => [...a, { zh: "", pinyin: "", mn: "" }])}
            >
              + холбоо үг нэмэх
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
