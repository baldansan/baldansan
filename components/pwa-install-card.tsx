"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallCard({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
    return (
      <section
        className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 ${className}`}
      >
        <p>
          Chrome/Edge дээр Share → <strong>Install app</strong> эсвэл address bar
          дээрх install товчоор app шиг нэмж болно.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 sm:p-6 ${className}`}
    >
      <h2 className="text-base font-semibold text-emerald-900">App суулгах</h2>
      <p className="mt-2 text-sm text-emerald-800">
        Утас/компьютер дээрээ app шиг хадгалж ашиглаарай.
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
          Дараа
        </button>
      </div>
    </section>
  );
}
