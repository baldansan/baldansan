"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { recordFeedback } from "@/lib/analytics/record-feedback";
import { uploadReportScreenshotClient } from "@/lib/feedback/upload-screenshot-client";

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
 * Дэлгэцийн зураг — modern-screenshot (lazy). html2canvas нь Tailwind 4-ийн oklch()
 * өнгийг ойлгодоггүй тул бүтдэггүй байсан; modern-screenshot DOM-ийг SVG
 * foreignObject-оор хөтчөөр нь зуруулдаг тул орчин үеийн CSS бүгд зөв гарна.
 * Overlay нээгдэхээс ӨМНӨ авна. JPEG 0.7, хамгийн ихдээ 1.5× scale.
 */
async function captureScreen(): Promise<string | null> {
  try {
    const { domToJpeg } = await import("modern-screenshot");
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dataUrl = await domToJpeg(document.documentElement, {
      quality: 0.7,
      scale: Math.min(1.5, window.devicePixelRatio || 1),
      width: w,
      height: h,
      backgroundColor: getComputedStyle(document.body).backgroundColor || "#fff",
      style: {
        // Одоогийн гүйлгэсэн байрлалыг хэвээр нь (viewport-ын хэсгийг) буулгана.
        transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`,
        transformOrigin: "top left",
      },
      filter: (node) => {
        const el = node as HTMLElement;
        if (!el || !el.classList) return true;
        return (
          !el.classList.contains("bs-fb-report-fab") &&
          !el.classList.contains("bs-fb-report-overlay")
        );
      },
      fetch: { requestInit: { mode: "cors", credentials: "omit" }, bypassingCache: true },
      timeout: 15000,
    });
    return dataUrl && dataUrl.length > 1000 ? dataUrl : null;
  } catch (error) {
    console.warn("[feedback] screenshot failed", error);
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
      // Server route бүтэхгүй бол (service role байхгүй г.м.) клиент өөрөө оролдоно:
      // зургийг anon-аар bucket-д (077 migration-ийн policy) → мөрийг RLS insert-ээр.
      const shotUrl =
        shot.kind === "ready" ? await uploadReportScreenshotClient(shot.dataUrl) : null;
      recordFeedback({
        stage: "report",
        lessonId,
        note: text,
        pagePath: pathname,
        screenshotUrl: shotUrl,
        userAgent: payload.userAgent,
        viewport: payload.viewport,
      });
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
