"use client";

/** Суулгасан эсэх, ямар төхөөрөмж/хөтөч дээр байгааг таних жижиг туслахууд. */

export type InstallPlatform = "ios" | "android" | "desktop";

const INSTALLED_KEY = "buunduu-pwa-installed-v1";

export function detectPlatform(): InstallPlatform {
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  // iPadOS 13+ өөрийгөө Mac гэж мэдээлдэг ч хүрэлттэй дэлгэцтэй.
  if (ua.includes("Macintosh") && window.navigator.maxTouchPoints > 1) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** Facebook / Instagram / Threads / TikTok зэрэг апп доторх хөтөч — эндээс суулгаж болдоггүй. */
export function isInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Barcelona|Line\/|MicroMessenger|TikTok|musical_ly/i.test(
    window.navigator.userAgent
  );
}

/** iPhone дээр Safari биш хөтөч (Chrome, Firefox, Edge). */
export function isIosNonSafari(): boolean {
  return /CriOS|FxiOS|EdgiOS|OPiOS/i.test(window.navigator.userAgent);
}

/** Нүүр дэлгэцээс (суулгасан апп болгож) нээсэн эсэх. */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function markInstalled(): void {
  try {
    window.localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Энэ төхөөрөмж дээр аль хэдийн суулгасан эсэх. Android дээр хөтөч ба суулгасан апп
 * нэг санах ойтой тул апп нэг удаа нээгдсэн бол хөтөч дээр ч мэдэгдэнэ.
 */
export function wasInstalled(): boolean {
  if (isStandalone()) return true;
  try {
    return window.localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}
