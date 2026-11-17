"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/push/native-push-client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const HIDE_KEY = "buunduu-install-guide-hidden-v1";

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && window.navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/**
 * «Апп болгож суулгах» заавар — нүүр хуудсанд. Аль хэдийн апп болгосон (нүүр дэлгэцээс
 * нээсэн), store-ын апп, эсвэл «Дахиж харуулахгүй» дарсан бол огт гарахгүй.
 */
export function InstallAppGuide() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    let hidden = false;
    try {
      hidden = window.localStorage.getItem(HIDE_KEY) === "1";
    } catch {
      hidden = false;
    }
    if (hidden || isStandalone() || isNativeApp()) return;
    setIos(isIos());
    setShow(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => hide();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hide() {
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") hide();
  }

  if (!show) return null;

  const steps = ios
    ? [
        <>
          <b>Safari</b>-аар нээсэн байх (Chrome биш)
        </>,
        <>
          Доод талын <b>Share</b> (дөрвөлжин + сум) товчийг дар
        </>,
        <>
          Доош гүйлгээд <b>Add to Home Screen</b> → <b>Add</b>
        </>,
      ]
    : [
        <>
          <b>Chrome</b>-оор нээсэн байх
        </>,
        <>
          Баруун дээд буланд <b>⋮</b> дар
        </>,
        <>
          <b>Add to Home screen</b> (эсвэл Install app) → <b>Add</b>
        </>,
      ];

  return (
    <section className="bs-inst">
      <button type="button" className="bs-inst-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="bs-inst-ico" aria-hidden>
          📲
        </span>
        <span className="bs-inst-body">
          <span className="bs-inst-title">Утсандаа апп болгож суулгах</span>
          <span className="bs-inst-sub">Татах шаардлагагүй · 1 минут л болно</span>
        </span>
        <span className="bs-inst-arrow" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div className="bs-inst-panel">
          {deferred ? (
            <button type="button" className="bs-inst-btn" onClick={() => void install()}>
              Одоо суулгах
            </button>
          ) : null}
          <p className="bs-inst-os">{ios ? "iPhone дээр" : "Android дээр"}</p>
          <ol className="bs-inst-steps">
            {steps.map((s, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <div>{s}</div>
              </li>
            ))}
          </ol>
          <p className="bs-inst-done">✅ Нүүр дэлгэц дээр «Сурцгаая» апп гарч ирнэ. Дараа нь түүгээрээ нээгээрэй.</p>
          <details className="bs-inst-more">
            <summary>Зурагтай заавар (Android + iPhone)</summary>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/intro/install.webp" alt="Апп болгож суулгах зурагтай заавар" loading="lazy" />
          </details>
          <button type="button" className="bs-inst-hide" onClick={hide}>
            Дахиж харуулахгүй
          </button>
        </div>
      ) : null}
    </section>
  );
}
