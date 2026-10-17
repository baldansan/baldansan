"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { recordFeedback } from "@/lib/analytics/record-feedback";

type Props = {
  lessonId?: string | null;
  variant?: "fab" | "inline";
};

type ShotState =
  | { kind: "idle" }
  | { kind: "capturing" }
  | { kind: "ready"; dataUrl: string }
  | { kind: "failed" };

/**
 * Дэлгэцийн зураг — html2canvas (lazy, зөвхөн энэ үед татна). Overlay нээгдэхээс
 * ӨМНӨ авна, тэгэхгүй бол цонх өөрөө зурагт орно. JPEG 0.7, 1× scale — ~150–400 KB.
 */
async function captureScreen(): Promise<string | null> {
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(document.documentElement, {
      useCORS: true,
      allowTaint: false,
      logging: false,
      scale: Math.min(1, window.devicePixelRatio || 1),
      backgroundColor: null,
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
      ignoreElements: (el) =>
        el.classList?.contains("bs-fb-report-fab") ||
        el.classList?.contains("bs-fb-report-overlay"),
    });
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
}

export function ReportIssueLink({ lessonId = null, variant = "fab" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<"no" | "sending" | "yes" | "error">("no");
  const [shot, setShot] = useState<ShotState>({ kind: "idle" });

  if (pathname.startsWith("/admin")) return null;

  async function openDialog() {
    if (open) return;
    setShot({ kind: "capturing" });
    // Overlay-г дараа нь нээнэ — зурагт орохгүй.
    const dataUrl = await captureScreen();
    setShot(dataUrl ? { kind: "ready", dataUrl } : { kind: "failed" });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setSent("no");
    setNote("");
    setShot({ kind: "idle" });
  }

  async function submit() {
    const text = note.trim();
    if (!text || sent === "sending" || sent === "yes") return;
    setSent("sending");
    const payload = {
      note: text,
      pagePath: pathname,
      lessonId,
      screenshot: shot.kind === "ready" ? shot.dataUrl : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      viewport:
        typeof window !== "undefined" ? `${window.innerWidth}×${window.innerHeight}` : null,
    };
    let ok = false;
    try {
      const res = await fetch("/api/feedback/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) {
      // Server route бүтэхгүй бол (service role байхгүй г.м.) зураггүйгээр хуучин замаар.
      recordFeedback({ stage: "report", lessonId, note: text, pagePath: pathname });
    }
    setSent("yes");
    window.setTimeout(close, 1800);
  }

  if (variant === "inline") {
    return (
      <>
        <button type="button" className="bs-fb-report-inline" onClick={() => void openDialog()}>
          💬 Алдаа мэдээлэх
        </button>
        {open ? renderDialog() : null}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="bs-fb-report-fab"
        onClick={() => void openDialog()}
        aria-label="Алдаа мэдээлэх"
        disabled={shot.kind === "capturing"}
      >
        {shot.kind === "capturing" ? "⏳" : "💬"}
      </button>
      {open ? renderDialog() : null}
    </>
  );

  function renderDialog() {
    return (
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
          {sent === "yes" ? (
            <p className="bs-fb-sent">Илгээгдлээ. Баярлалаа!</p>
          ) : (
            <>
              {shot.kind === "ready" ? (
                <div className="bs-fb-shot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.dataUrl} alt="Дэлгэцийн зураг" className="bs-fb-shot-img" />
                  <div className="bs-fb-shot-row">
                    <span>📷 Дэлгэцийн зураг хавсаргана</span>
                    <button
                      type="button"
                      className="bs-fb-shot-remove"
                      onClick={() => setShot({ kind: "failed" })}
                    >
                      Хасах
                    </button>
                  </div>
                </div>
              ) : (
                <p className="bs-fb-shot-note">Дэлгэцийн зураг хавсаргагдахгүй (зөвхөн тэмдэглэл).</p>
              )}
              <textarea
                className="bs-fb-note-input"
                rows={4}
                value={note}
                placeholder="Юу буруу байна? (жишээ: 3-р үгийн орчуулга буруу, пиньинь алдаатай…)"
                onChange={(e) => setNote(e.target.value)}
                autoFocus
              />
              <div className="bs-fb-report-actions">
                <button type="button" className="bs-fb-report-cancel" onClick={close}>
                  Болих
                </button>
                <button
                  type="button"
                  className="bs-fb-report-send"
                  disabled={!note.trim() || sent === "sending"}
                  onClick={() => void submit()}
                >
                  {sent === "sending" ? "Илгээж байна…" : "Илгээх"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
