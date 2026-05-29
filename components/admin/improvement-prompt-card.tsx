"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AdminAlert } from "@/components/admin/admin-editor-ui";
import {
  IMPROVEMENT_ISSUE_LABELS,
  type ImprovementIssueType,
} from "@/lib/admin/improvement-prompts";

type Props = {
  title: string;
  subtitle?: string;
  prompt: string;
  issueType: ImprovementIssueType;
  relatedLessonId?: string;
  defaultCollapsed?: boolean;
  onRegenerate?: () => string;
};

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function ImprovementPromptCard({
  title,
  subtitle,
  prompt,
  issueType,
  relatedLessonId,
  defaultCollapsed = false,
  onRegenerate,
}: Props) {
  const textareaId = useId();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [promptText, setPromptText] = useState(prompt);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    setPromptText(prompt);
  }, [prompt]);

  const handleCopy = useCallback(async () => {
    const text = promptText.trim();
    if (!text) {
      setCopyError("Prompt хоосон байна.");
      setCopySuccess(null);
      return;
    }
    setCopyError(null);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopySuccess("Prompt clipboard руу хууллаа.");
    } else {
      setCopyError("Clipboard хуулахад алдаа. Prompt-оо гараар copy хийнэ үү.");
    }
  }, [promptText]);

  const handleRegenerate = useCallback(() => {
    if (!onRegenerate) return;
    setPromptText(onRegenerate());
    setCopySuccess(null);
    setCopyError(null);
  }, [onRegenerate]);

  const badgeLabel = IMPROVEMENT_ISSUE_LABELS[issueType] ?? issueType;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
              {badgeLabel}
            </span>
            {relatedLessonId ? (
              <span className="font-mono text-xs text-slate-500">
                Lesson {relatedLessonId}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed ? (
        <div className="mt-4 flex flex-col gap-3">
          <textarea
            id={textareaId}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-relaxed text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Copy prompt
            </button>
            {onRegenerate ? (
              <button
                type="button"
                onClick={handleRegenerate}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Regenerate
              </button>
            ) : null}
          </div>
          <AdminAlert error={copyError} success={copySuccess} />
        </div>
      ) : null}
    </section>
  );
}

type InlineProps = {
  label?: string;
  prompt: string;
  className?: string;
};

/** Compact copy button for analytics table rows. */
export function ImprovementPromptCopyButton({
  label = "Generate fix prompt",
  prompt,
  className = "",
}: InlineProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    setCopySuccess(false);
    setCopyError(false);
    const ok = await copyTextToClipboard(prompt.trim());
    if (ok) {
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2500);
    } else {
      setCopyError(true);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="text-left text-xs font-medium text-emerald-700 hover:text-emerald-800"
      >
        {label}
      </button>
      {copySuccess ? (
        <p className="mt-0.5 text-xs text-emerald-700">
          Prompt clipboard руу хууллаа.
        </p>
      ) : null}
      {copyError ? (
        <p className="mt-0.5 text-xs text-red-700">Copy failed — select manually.</p>
      ) : null}
    </div>
  );
}

export { copyTextToClipboard };
