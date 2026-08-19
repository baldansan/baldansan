"use client";

import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";


type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIosDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac with touch support.
    (ua.includes("Macintosh") && window.navigator.maxTouchPoints > 1);
  return isIosDevice;
}

export function PwaInstallCard({ className = "" }: { className?: string }) {
  const locale = useUiLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsIos(isIosBrowser());

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) {
      setInstalled(true);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferred(null);
  }

  if (installed || dismissed) {
    return null;
  }

  if (!deferred) {
    if (isIos) {
      return (
        <section
          className={`rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200 ${className}`}
        >
          <p className="font-semibold">{tr(locale, "iPhone/iPad дээр app шиг суулгах:")}</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-emerald-800">
            <li>
              {tr(locale, "Safari-ийн доод талын")} <strong>Share</strong>{" "}
              <span aria-hidden>{tr(locale, "(⬆️ дөрвөлжин дотор сум)")}</span> {tr(locale, "товчийг дар")}
            </li>
            <li>
              <strong>
                {tr(locale, "«Нүүр дэлгэцэд нэмэх» (Add to Home Screen)")}
              </strong>
              {tr(locale, "-ийг сонго")}
            </li>
            <li>
              {tr(locale, "Баруун дээд буланд")}{" "}
              <strong>{tr(locale, "Нэмэх (Add)")}</strong>{" "}
              {tr(locale, "дар — нүүр дэлгэцэд app болж суугдана")}
            </li>
          </ol>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-3 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700"
          >
            {tr(locale, "Ойлголоо")}
          </button>
        </section>
      );
    }
    return (
      <section
        className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 ${className}`}
      >
        <p>
          {tr(locale, "Chrome/Edge дээр Share →")} <strong>Install app</strong>{" "}
          {tr(locale, "эсвэл address bar дээрх install товчоор app шиг нэмж болно.")}
        </p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 sm:p-6 ${className}`}
    >
      <h2 className="text-base font-semibold text-emerald-900">{tr(locale, "App суулгах")}</h2>
      <p className="mt-2 text-sm text-emerald-800">
        {tr(locale, "Утас/компьютер дээрээ app шиг хадгалж ашиглаарай.")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Install app
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600"
        >
          {tr(locale, "Дараа")}
        </button>
      </div>
    </section>
  );
}
