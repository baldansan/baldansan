"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AndroidStepArt, IosStepArt } from "@/components/intro/install-step-art";
import { isNativeApp } from "@/lib/push/native-push-client";
import {
  detectPlatform,
  isInAppBrowser,
  isIosNonSafari,
  markInstalled,
  wasInstalled,
  type InstallPlatform,
} from "@/lib/pwa/install-state";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const HIDE_KEY = "buunduu-install-guide-hidden-v1";

type Step = { title: ReactNode; hint?: ReactNode };

const IOS_STEPS: Step[] = [
  {
    title: (
      <>
        Доод мөрөн дэх <b>Хуваалцах (Share)</b> товчийг дар
      </>
    ),
    hint: "Товч харагдахгүй бол ⋯ дээр дарахад Share гарч ирнэ.",
  },
  {
    title: (
      <>
        Доош гүйлгээд <b>Add to Home Screen</b> («Нүүр дэлгэцэд нэмэх»)-ийг сонго
      </>
    ),
  },
  {
    title: (
      <>
        Баруун дээд буланд <b>Add</b> («Нэмэх») дар
      </>
    ),
  },
];

const ANDROID_STEPS: Step[] = [
  {
    title: (
      <>
        Chrome-ийн баруун дээд буланд байгаа <b>⋮</b> (гурван цэг)-ийг дар
      </>
    ),
  },
  {
    title: (
      <>
        <b>Add to Home screen</b> («Нүүр дэлгэцэд нэмэх») эсвэл <b>Install app</b>-ийг сонго
      </>
    ),
  },
  {
    title: (
      <>
        Гарч ирсэн цонхон дээр <b>Install</b> («Суулгах») дар
      </>
    ),
  },
];

/**
 * «Утсандаа апп болгож суулгах» — нүүр хуудсанд. Төхөөрөмжийг таньж iPhone эсвэл
 * Android-ийн зурагтай 3 алхмыг үзүүлнэ. Аль хэдийн суулгасан (нүүр дэлгэцээс нээсэн
 * эсвэл өмнө нь суулгасан), store-ын апп, «Дахиж харуулахгүй» дарсан хүнд гарахгүй.
 */
export function InstallAppGuide() {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [open, setOpen] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [wrongBrowser, setWrongBrowser] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    let hidden = false;
    try {
      hidden = window.localStorage.getItem(HIDE_KEY) === "1";
    } catch {
      hidden = false;
    }
    if (hidden || isNativeApp() || wasInstalled()) return;

    const p = detectPlatform();
    setPlatform(p);
    setInApp(isInAppBrowser());
    setWrongBrowser(p === "ios" && isIosNonSafari());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      markInstalled();
      setPlatform(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function hide() {
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    setPlatform(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") {
      markInstalled();
      setPlatform(null);
    }
  }

  async function copyLink() {
    try {
      await window.navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!platform) return null;
  // Компьютер дээр зөвхөн хөтөч өөрөө суулгах боломж өгсөн үед л харуулна.
  if (platform === "desktop" && !deferred) return null;

  const steps = platform === "ios" ? IOS_STEPS : ANDROID_STEPS;
  const mustSwitchBrowser = inApp || wrongBrowser;
  const browserName = platform === "ios" ? "Safari" : "Chrome";

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
            <>
              <button type="button" className="bs-inst-btn" onClick={() => void install()}>
                Одоо суулгах
              </button>
              {platform === "android" ? (
                <p className="bs-inst-or">Товч ажиллахгүй бол доорх 3 алхмаар:</p>
              ) : null}
            </>
          ) : null}

          {platform !== "desktop" ? (
            <>
              <p className="bs-inst-os">{platform === "ios" ? "iPhone дээр" : "Android дээр"}</p>

              {mustSwitchBrowser ? (
                <div className="bs-inst-warn">
                  <p>
                    {inApp ? (
                      <>
                        Та одоо Facebook, Threads зэрэг аппын дотор нээсэн байна. Эндээс суулгаж болохгүй —
                        эхлээд <b>{browserName}</b>-аар нээгээрэй.
                      </>
                    ) : (
                      <>
                        iPhone дээр зөвхөн <b>Safari</b>-аас суулгаж болно. Холбоосыг хуулаад Safari-д нээгээрэй.
                      </>
                    )}
                  </p>
                  <button type="button" className="bs-inst-copy" onClick={() => void copyLink()}>
                    {copied ? "✓ Хуулагдлаа" : "Холбоос хуулах"}
                  </button>
                </div>
              ) : null}

              <ol className="bs-inst-steps">
                {steps.map((s, i) => (
                  <li key={i}>
                    <div className="bs-inst-step-text">
                      <span className="bs-inst-num">{i + 1}</span>
                      <div>
                        <p>{s.title}</p>
                        {s.hint ? <p className="bs-inst-hint">{s.hint}</p> : null}
                      </div>
                    </div>
                    {platform === "ios" ? (
                      <IosStepArt step={(i + 1) as 1 | 2 | 3} />
                    ) : (
                      <AndroidStepArt step={(i + 1) as 1 | 2 | 3} />
                    )}
                  </li>
                ))}
              </ol>
              <p className="bs-inst-done">
                ✅ Нүүр дэлгэц дээр «Тэмээ багш» гарч ирнэ. Цаашид түүгээрээ нээгээрэй
                {platform === "ios" ? " — эхний удаа дахин нэвтэрнэ." : "."}
              </p>
              <p className="bs-inst-hint">
                🔔 Апп болгож нээсний дараа өдөр бүрийн сануулгаа асааж болно.
              </p>
            </>
          ) : null}

          <button type="button" className="bs-inst-hide" onClick={hide}>
            Дахиж харуулахгүй
          </button>
        </div>
      ) : null}
    </section>
  );
}
