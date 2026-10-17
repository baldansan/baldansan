/**
 * Бүтэн дэлгэц: Fullscreen API байвал түүгээр, үгүй бол (iOS Safari)
 * CSS «хуурамч» бүтэн дэлгэц (position:fixed давхарга) ашиглана.
 */

export type BichlegFullscreenMode = "none" | "native" | "fake";

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

export function supportsNativeFullscreen(el: HTMLElement | null): boolean {
  if (!el || typeof document === "undefined") return false;
  const node = el as FsElement;
  return (
    typeof node.requestFullscreen === "function" ||
    typeof node.webkitRequestFullscreen === "function"
  );
}

export function currentFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as FsDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** true → native амжилттай, false → fake горим хэрэглэ. */
export async function requestNativeFullscreen(el: HTMLElement): Promise<boolean> {
  const node = el as FsElement;
  try {
    if (typeof node.requestFullscreen === "function") {
      await node.requestFullscreen();
      return true;
    }
    if (typeof node.webkitRequestFullscreen === "function") {
      await node.webkitRequestFullscreen();
      return true;
    }
  } catch {
    /* хэрэглэгчийн дохиогүй / дэмжихгүй */
  }
  return false;
}

export async function exitNativeFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  const doc = document as FsDocument;
  try {
    if (!currentFullscreenElement()) return;
    if (typeof doc.exitFullscreen === "function") await doc.exitFullscreen();
    else if (typeof doc.webkitExitFullscreen === "function")
      await doc.webkitExitFullscreen();
  } catch {
    /* аль хэдийн гарсан */
  }
}

/** Утас/таблет (мэдрэгч) мөн хэвтээ эсэх — эргүүлэхэд автоматаар бүтэн дэлгэц. */
export function isCoarsePointerLandscape(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const landscape = window.matchMedia("(orientation: landscape)").matches;
    return coarse && landscape;
  } catch {
    return false;
  }
}

export function subscribeOrientation(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(orientation: landscape)");
  const handler = () => onChange();
  mq.addEventListener("change", handler);
  const so = window.screen?.orientation;
  so?.addEventListener?.("change", handler);
  return () => {
    mq.removeEventListener("change", handler);
    so?.removeEventListener?.("change", handler);
  };
}
