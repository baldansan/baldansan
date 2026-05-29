"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAvailableVoices,
  isSpeechSupported,
  loadVoices,
  speakText,
  TTS_UNAVAILABLE_MESSAGE,
} from "@/lib/tts/speech";
import {
  getLangTtsSettings,
  saveLangTtsSettings,
  type LangTtsSettings,
  type TtsLangKey,
} from "@/lib/tts/tts-settings";

type LanguageTab = "ko-KR" | "zh-CN";

const LANGUAGE_TABS: { id: LanguageTab; label: string; settingsKey: TtsLangKey }[] =
  [
    { id: "ko-KR", label: "Солонгос (ko-KR)", settingsKey: "koKR" },
    { id: "zh-CN", label: "Хятад (zh-CN)", settingsKey: "zhCN" },
  ];

const TEST_PHRASES: Record<LanguageTab, string> = {
  "ko-KR": "안녕하세요. 저는 몽골 사람입니다.",
  "zh-CN": "你好。我们一起学习中文。",
};

export function TtsSettingsCard() {
  const [supported, setSupported] = useState(false);
  const [activeLang, setActiveLang] = useState<LanguageTab>("ko-KR");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [draft, setDraft] = useState<LangTtsSettings>(() =>
    getLangTtsSettings("ko-KR")
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const activeTab = useMemo(
    () => LANGUAGE_TABS.find((tab) => tab.id === activeLang) ?? LANGUAGE_TABS[0],
    [activeLang]
  );

  const refreshVoices = useCallback(async () => {
    if (!isSpeechSupported()) return;
    await loadVoices();
    setVoices(await getAvailableVoices());
  }, []);

  useEffect(() => {
    setSupported(isSpeechSupported());
    void refreshVoices();
  }, [refreshVoices]);

  useEffect(() => {
    setDraft(getLangTtsSettings(activeLang));
    setSavedMessage(null);
    setTestError(null);
  }, [activeLang]);

  const langVoices = useMemo(() => {
    const base = activeLang.split("-")[0].toLowerCase();
    return voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(base)
    );
  }, [activeLang, voices]);

  function handleSave() {
    saveLangTtsSettings(activeLang, draft);
    setSavedMessage("Хадгалагдлаа.");
    window.setTimeout(() => setSavedMessage(null), 2500);
  }

  async function handleTest() {
    setTestError(null);
    if (!supported) {
      setTestError(TTS_UNAVAILABLE_MESSAGE);
      return;
    }
    const result = await speakText(TEST_PHRASES[activeLang], {
      lang: activeLang,
      voiceURI: draft.voiceURI,
      rate: draft.rate,
      pitch: draft.pitch,
      volume: draft.volume,
    });
    if (!result.ok) {
      setTestError(result.error ?? TTS_UNAVAILABLE_MESSAGE);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blue-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Дуудлага (TTS)</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Төхөөрөмж/хөтчийн дуут уншилт ашиглана. Сонгосон дуу, хурд, өндөр
        localStorage-д хадгалагдана. Жинхэнэ audio файл байвал тэрнийг эхлээд
        тоглуулна.
      </p>

      {!supported ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {TTS_UNAVAILABLE_MESSAGE}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {LANGUAGE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveLang(tab.id)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeLang === tab.id
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-800 ring-1 ring-blue-200 hover:bg-blue-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Дуу хоолой</span>
          <select
            value={draft.voiceURI ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                voiceURI: event.target.value || undefined,
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Системийн default</option>
            {langVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
          {langVoices.length === 0 ? (
            <span className="mt-1 block text-xs text-slate-500">
              Энэ хэлний дуу хоолой олдсонгүй. Утасныхаа системийн TTS
              тохиргооноос солонгос/хятад дуу нэмнэ үү.
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Хурд ({draft.rate.toFixed(2)})
          </span>
          <input
            type="range"
            min={0.6}
            max={1.3}
            step={0.05}
            value={draft.rate}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, rate: Number(event.target.value) }))
            }
            className="mt-2 w-full accent-blue-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Өндөр ({draft.pitch.toFixed(2)})
          </span>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.05}
            value={draft.pitch}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, pitch: Number(event.target.value) }))
            }
            className="mt-2 w-full accent-blue-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Дууны хэм ({draft.volume.toFixed(2)})
          </span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={draft.volume}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                volume: Number(event.target.value),
              }))
            }
            className="mt-2 w-full accent-blue-600"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void handleTest();
          }}
          className="min-h-[44px] rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Тест уншуулах
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="min-h-[44px] rounded-full border border-blue-300 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100"
        >
          Хадгалах
        </button>
        <button
          type="button"
          onClick={() => {
            void refreshVoices();
          }}
          className="min-h-[44px] rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Дуу жагсаалт шинэчлэх
        </button>
      </div>

      {savedMessage ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">{savedMessage}</p>
      ) : null}
      {testError ? (
        <p className="mt-3 text-sm text-red-600">{testError}</p>
      ) : null}
    </section>
  );
}
