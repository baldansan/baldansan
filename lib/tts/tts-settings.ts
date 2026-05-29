export type LangTtsSettings = {
  voiceURI?: string;
  rate: number;
  pitch: number;
  volume: number;
};

export type TtsSettings = {
  koKR: LangTtsSettings;
  zhCN: LangTtsSettings;
};

export type TtsLangKey = keyof TtsSettings;

const STORAGE_KEY = "buunduu-tts-settings-v1";

const DEFAULT_LANG_SETTINGS: LangTtsSettings = {
  rate: 0.9,
  pitch: 1,
  volume: 1,
};

export const DEFAULT_TTS_SETTINGS: TtsSettings = {
  koKR: { ...DEFAULT_LANG_SETTINGS },
  zhCN: { ...DEFAULT_LANG_SETTINGS },
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function langToSettingsKey(lang: string): TtsLangKey {
  const normalized = lang.trim().toLowerCase();
  if (normalized.startsWith("ko")) return "koKR";
  if (normalized.startsWith("zh")) return "zhCN";
  return "zhCN";
}

function mergeLangSettings(
  current: LangTtsSettings,
  patch: Partial<LangTtsSettings>
): LangTtsSettings {
  return {
    voiceURI: patch.voiceURI !== undefined ? patch.voiceURI : current.voiceURI,
    rate: patch.rate ?? current.rate,
    pitch: patch.pitch ?? current.pitch,
    volume: patch.volume ?? current.volume,
  };
}

function parseStoredSettings(raw: string | null): TtsSettings {
  if (!raw) return { ...DEFAULT_TTS_SETTINGS, koKR: { ...DEFAULT_LANG_SETTINGS }, zhCN: { ...DEFAULT_LANG_SETTINGS } };

  try {
    const parsed = JSON.parse(raw) as Partial<TtsSettings>;
    return {
      koKR: {
        ...DEFAULT_LANG_SETTINGS,
        ...(parsed.koKR ?? {}),
      },
      zhCN: {
        ...DEFAULT_LANG_SETTINGS,
        ...(parsed.zhCN ?? {}),
      },
    };
  } catch {
    return {
      koKR: { ...DEFAULT_LANG_SETTINGS },
      zhCN: { ...DEFAULT_LANG_SETTINGS },
    };
  }
}

export function getTtsSettings(): TtsSettings {
  if (!isBrowser()) {
    return {
      koKR: { ...DEFAULT_LANG_SETTINGS },
      zhCN: { ...DEFAULT_LANG_SETTINGS },
    };
  }
  return parseStoredSettings(window.localStorage.getItem(STORAGE_KEY));
}

export function saveTtsSettings(settings: TtsSettings): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getLangTtsSettings(lang: string): LangTtsSettings {
  const settings = getTtsSettings();
  return settings[langToSettingsKey(lang)];
}

export function saveLangTtsSettings(
  lang: string,
  patch: Partial<LangTtsSettings>
): TtsSettings {
  const key = langToSettingsKey(lang);
  const current = getTtsSettings();
  const next: TtsSettings = {
    ...current,
    [key]: mergeLangSettings(current[key], patch),
  };
  saveTtsSettings(next);
  return next;
}
