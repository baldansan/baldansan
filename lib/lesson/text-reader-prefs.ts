const PINYIN_KEY = "buunduu-text-reader:show-pinyin";
const MN_KEY = "buunduu-text-reader:show-mn";

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
  } catch {
    // ignore
  }
  return fallback;
}

function writeBool(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadTextReaderShowPinyin(): boolean {
  return readBool(PINYIN_KEY, true);
}

export function loadTextReaderShowMn(): boolean {
  return readBool(MN_KEY, true);
}

export function saveTextReaderShowPinyin(value: boolean) {
  writeBool(PINYIN_KEY, value);
}

export function saveTextReaderShowMn(value: boolean) {
  writeBool(MN_KEY, value);
}
