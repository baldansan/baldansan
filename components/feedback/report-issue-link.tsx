"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { recordFeedback } from "@/lib/analytics/record-feedback";

type Props = {
  lessonId?: string | null;
  variant?: "fab" | "inline";
};

export function ReportIssueLink({ lessonId = null, variant = "fab" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  function submit() {
    if (!note.trim() || sent) return;
    recordFeedback({
      stage: "report",
      lessonId,
      note: note.trim(),
      pagePath: pathname,
    });
    setSent(true);
    window.setTimeout(() => {
      setOpen(false);
      setSent(false);
      setNote("");
    }, 1800);
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        className="bs-fb-report-inline"
        onClick={() => setOpen(true)}
      >
        ❗ Алдаа мэдээлэх
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="bs-fb-report-fab"
        onClick={() => setOpen(true)}
        aria-label="Алдаа мэдээлэх"
      >
        ❗
      </button>
      {open ? (
        <div className="bs-fb-report-overlay" role="dialog" aria-modal="true">
          <div className="bs-fb-report-panel">
            <h3 className="bs-fb-report-title">Алдаа мэдээлэх</h3>
            <p className="bs-fb-report-meta">
              Хуудас: <code>{pathname}</code>
              {lessonId ? (
                <>
                  <br />
                  Хичээл: <code>{lessonId}</code>
                </>
              ) : null}
            </p>
            {sent ? (
              <p className="bs-fb-sent">Илгээгдлээ. Баярлалаа!</p>
            ) : (
              <>
                <textarea
                  className="bs-fb-note-input"
                  rows={4}
                  value={note}
                  placeholder="Юу болсон, юу хийж байсан бэ?"
                  onChange={(e) => setNote(e.target.value)}
                  autoFocus
                />
                <div className="bs-fb-report-actions">
                  <button
                    type="button"
                    className="bs-fb-report-cancel"
                    onClick={() => setOpen(false)}
                  >
                    Болих
                  </button>
                  <button
                    type="button"
                    className="bs-fb-report-send"
                    disabled={!note.trim()}
                    onClick={submit}
                  >
                    Илгээх
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
