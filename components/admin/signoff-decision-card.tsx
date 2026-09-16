"use client";

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import {
  DEFAULT_VERSION_LABEL,
  type SignoffDecisionState,
  type SignoffDecisionValue,
  type SignoffMetaState,
} from "@/lib/admin/launch-signoff-data";

type Props = {
  decision: SignoffDecisionState;
  meta: SignoffMetaState;
  onSetDecision: (value: SignoffDecisionValue) => void;
  onMetaChange: (patch: Partial<SignoffMetaState>) => void;
  onResetDecision: () => void;
};

function decisionLabel(value: SignoffDecisionValue): string {
  if (value === "go_live") return "Гаргая";
  if (value === "needs_review") return "Шалгах шаардлагатай";
  if (value === "blocked") return "Түр зогсоосон";
  return "Шийдээгүй";
}

function decisionClass(value: SignoffDecisionValue): string {
  if (value === "go_live") return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  if (value === "needs_review") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (value === "blocked") return "bg-red-50 text-red-900 ring-red-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function SignoffDecisionCard({
  decision,
  meta,
  onSetDecision,
  onMetaChange,
  onResetDecision,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Гаргах эсэх шийдвэр</h2>
      <p className="mt-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${decisionClass(decision.value)}`}
        >
          {decisionLabel(decision.value)}
        </span>
      </p>
      {decision.updatedAt && decision.value !== "not_decided" ? (
        <p className="mt-2 text-xs text-slate-500">
          Шинэчилсэн: {formatMongoliaDateTimeWithLabel(decision.updatedAt)}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Гаргах хувилбар</span>
          <input
            type="text"
            value={meta.versionLabel}
            onChange={(e) => onMetaChange({ versionLabel: e.target.value })}
            placeholder={DEFAULT_VERSION_LABEL}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Хариуцагч</span>
          <input
            type="text"
            value={meta.owner}
            onChange={(e) => onMetaChange({ owner: e.target.value })}
            placeholder="Нэр эсвэл баг"
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Гаргалтын тэмдэглэл</span>
        <textarea
          value={meta.launchNotes}
          onChange={(e) => onMetaChange({ launchNotes: e.target.value })}
          rows={3}
          placeholder="Хамрах хүрээ, хугацаа, зөвшөөрлийн товч"
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Мэдэгдэж буй алдаа</span>
        <textarea
          value={meta.knownIssues}
          onChange={(e) => onMetaChange({ knownIssues: e.target.value })}
          rows={3}
          placeholder="Хүлээн зөвшөөрсөн хязгаарлалт эсвэл засаагүй алдаа"
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Эцсийн шийдвэрийн тэмдэглэл</span>
        <textarea
          value={meta.finalDecisionNote}
          onChange={(e) => onMetaChange({ finalDecisionNote: e.target.value })}
          rows={2}
          placeholder="go_live, needs_review, blocked шийдвэрийн үндэслэл"
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSetDecision("go_live")}
          className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Гаргая
        </button>
        <button
          type="button"
          onClick={() => onSetDecision("needs_review")}
          className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
        >
          Шалгах шаардлагатай
        </button>
        <button
          type="button"
          onClick={() => onSetDecision("blocked")}
          className="inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100"
        >
          Түр зогсоох
        </button>
        <button
          type="button"
          onClick={onResetDecision}
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-red-200"
        >
          Шийдвэрийг цэвэрлэх
        </button>
      </div>
    </section>
  );
}
