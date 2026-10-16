"use client";
// components/talk/talk-client.tsx — AI ролийн яриа (чат).
// AI_API_KEY байвал /api/talk (чөлөөт яриа), байхгүй бол сценарын салаалсан
// скрипт (3 сонголт). Хоёуланд нь микрофоноор хэлж болно (SpeechRecognition).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { awardTalkPoints } from "@/lib/pronunciation/award";
import {
  abortRecognition,
  isSpeechRecognitionSupported,
  recognitionErrorMessage,
  recognizeOnce,
} from "@/lib/pronunciation/speech-recognition";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { saveLessonWordsBatch } from "@/lib/supabase/saved-words";
import { closestOptionIndex, getTalkNode } from "@/lib/talk/scenarios";
import type { TalkApiReply, TalkMessage, TalkOption, TalkScenario } from "@/lib/talk/types";
import { speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";
import "./talk.css";

type Mode = "checking" | "ai" | "script";

const PREF_KEY = "buunduu-talk-show-v1";

function readPrefs(): { py: boolean; mn: boolean } {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const v = JSON.parse(raw) as { py?: boolean; mn?: boolean };
      return { py: v.py ?? true, mn: v.mn ?? true };
    }
  } catch {
    /* ignore */
  }
  return { py: true, mn: true };
}

export function TalkClient({ scenario }: { scenario: TalkScenario }) {
  const locale = useUiLocale();
  const [mode, setMode] = useState<Mode>("checking");
  const [messages, setMessages] = useState<TalkMessage[]>([]);
  const [nodeId, setNodeId] = useState<string>(scenario.start);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [awarded, setAwarded] = useState(0);
  const [showPy, setShowPy] = useState(true);
  const [showMn, setShowMn] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [micOk, setMicOk] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const autoSpeakRef = useRef(true);

  const node = useMemo(() => getTalkNode(scenario, nodeId), [scenario, nodeId]);
  const userTurns = messages.filter((m) => m.role === "user").length;

  const speak = useCallback((zh: string) => {
    stopPronunciation();
    void speakWithSavedSettings(zh, "zh-CN");
  }, []);

  const pushAi = useCallback(
    (m: Omit<TalkMessage, "role">) => {
      setMessages((prev) => [...prev, { role: "ai", ...m }]);
      if (autoSpeakRef.current) speak(m.zh);
    },
    [speak]
  );

  // Горим тогтоох + эхний реплик
  useEffect(() => {
    let cancelled = false;
    // Хөтчийн тохиргоо — hydration-ийн дараа (effect дотор синхрон setState хийхгүй)
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const p = readPrefs();
      setShowPy(p.py);
      setShowMn(p.mn);
      setMicOk(isSpeechRecognitionSupported());
    });
    if (hasSupabaseConfig) {
      void getCurrentUser().then((r) => {
        if (!cancelled) setLoggedIn(Boolean(r.data));
      });
    }
    (async () => {
      let ai = false;
      try {
        const res = await fetch("/api/talk", { cache: "no-store" });
        const j = (await res.json()) as { ai?: boolean };
        ai = Boolean(j.ai);
      } catch {
        ai = false;
      }
      if (cancelled) return;
      if (ai) {
        setMode("ai");
        setBusy(true);
        const reply = await requestAi([]);
        if (cancelled) return;
        setBusy(false);
        if (reply) {
          pushAi(reply);
        } else {
          // AI унавал скрипт рүү
          setMode("script");
          const first = getTalkNode(scenario, scenario.start);
          if (first) pushAi(first.ai);
        }
      } else {
        setMode("script");
        const first = getTalkNode(scenario, scenario.start);
        if (first) pushAi(first.ai);
      }
    })();
    return () => {
      cancelled = true;
      abortRecognition();
      stopPronunciation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ py: showPy, mn: showMn }));
    } catch {
      /* ignore */
    }
  }, [showPy, showMn]);

  async function requestAi(history: TalkMessage[]): Promise<TalkApiReply | null> {
    try {
      const res = await fetch("/api/talk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          messages: history.map((m) => ({ role: m.role, zh: m.zh })),
        }),
      });
      const j = (await res.json()) as { ok?: boolean; reply?: TalkApiReply; message?: string; fallback?: boolean };
      if (!res.ok || !j.ok || !j.reply) {
        if (res.status === 401) setError(tr(locale, "AI-тай ярихын тулд нэвтэрнэ үү — одоохондоо скриптээр үргэлжилнэ."));
        else if (res.status === 429) setError(j.message ?? null);
        return null;
      }
      return j.reply;
    } catch {
      return null;
    }
  }

  function finish(steps: number) {
    if (done) return;
    setDone(true);
    if (loggedIn) setAwarded(awardTalkPoints(scenario.id, steps));
  }

  // ---- Скрипт горим: сонголт дарах ----
  function chooseOption(opt: TalkOption) {
    if (busy || done) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", zh: opt.zh, pinyin: opt.pinyin, mn: opt.mn }]);
    if (!opt.next) {
      finish(userTurns + 1);
      return;
    }
    const next = getTalkNode(scenario, opt.next);
    if (!next) {
      finish(userTurns + 1);
      return;
    }
    setNodeId(next.id);
    window.setTimeout(() => {
      pushAi(next.ai);
      if (next.options.length === 0) finish(userTurns + 1);
    }, 350);
  }

  // ---- AI горим: чөлөөт хариулт ----
  async function sendFree(text: string) {
    const zh = text.trim();
    if (!zh || busy || done) return;
    setError(null);
    setInput("");
    const history: TalkMessage[] = [...messages, { role: "user", zh }];
    setMessages(history);
    setBusy(true);
    const reply = await requestAi(history);
    setBusy(false);
    if (!reply) {
      if (!error) setError(tr(locale, "AI хариу ирсэнгүй — дахин оролдоно уу."));
      return;
    }
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && last.role === "user" && reply.correction) {
        copy[copy.length - 1] = { ...last, correction: reply.correction };
      }
      return copy;
    });
    pushAi({ zh: reply.zh, pinyin: reply.pinyin, mn: reply.mn });
    if (reply.done) finish(history.filter((m) => m.role === "user").length);
  }

  // ---- Микрофон (хоёр горимд) ----
  async function listen() {
    if (listening) {
      abortRecognition();
      setListening(false);
      return;
    }
    stopPronunciation();
    setError(null);
    setListening(true);
    const res = await recognizeOnce({ lang: "zh-CN", timeoutMs: 7000 });
    setListening(false);
    if (!res.ok) {
      if (res.error !== "aborted") setError(tr(locale, recognitionErrorMessage(res.error)));
      return;
    }
    const heard = res.alternatives[0] ?? "";
    if (mode === "ai") {
      setInput(heard);
      await sendFree(heard);
      return;
    }
    const opts = node?.options ?? [];
    let idx = -1;
    for (const alt of res.alternatives) {
      idx = closestOptionIndex(opts, alt);
      if (idx >= 0) break;
    }
    if (idx < 0) {
      setError(`${tr(locale, "Танигдсан")}: «${heard}» — ${tr(locale, "сонголтуудын аль нэгийг хэлээрэй")}`);
      return;
    }
    chooseOption(opts[idx]!);
  }

  async function saveVocab() {
    if (saveState !== "idle") return;
    setSaveState("saving");
    const r = await saveLessonWordsBatch(scenario.vocab.map((v) => ({ zh: v.zh, pinyin: v.pinyin, mn: v.mn })));
    setSaveState(r.ok ? "saved" : "idle");
    if (!r.ok) setError(r.error ?? tr(locale, "Хадгалж чадсангүй"));
  }

  function restart() {
    abortRecognition();
    stopPronunciation();
    setMessages([]);
    setDone(false);
    setAwarded(0);
    setError(null);
    setSaveState("idle");
    setNodeId(scenario.start);
    if (mode === "script") {
      const first = getTalkNode(scenario, scenario.start);
      if (first) pushAi(first.ai);
    } else {
      setBusy(true);
      void requestAi([]).then((reply) => {
        setBusy(false);
        if (reply) pushAi(reply);
      });
    }
  }

  const options = mode === "script" && !done && node ? node.options : [];

  return (
    <div className="bs-talk">
      <div className="bs-talk-head">
        <Link href="/talk" className="bs-talk-back" aria-label={tr(locale, "Буцах")}>
          ←
        </Link>
        <div className="bs-talk-title">
          <b>
            {scenario.emoji} {locale === "zh" ? scenario.title_zh : scenario.title_mn}
          </b>
          <small>
            {tr(locale, "Та")}: {scenario.user_role_mn} · AI: {locale === "zh" ? scenario.ai_role_zh : scenario.ai_role_mn} · {scenario.level}
          </small>
        </div>
        <span className={`bs-talk-mode bs-talk-mode--${mode}`}>
          {mode === "ai" ? "AI" : mode === "script" ? tr(locale, "Скрипт") : "…"}
        </span>
      </div>

      <div className="bs-talk-toggles">
        <button type="button" className={`bs-talk-tg${showPy ? " bs-on" : ""}`} onClick={() => setShowPy((v) => !v)} aria-pressed={showPy}>
          {tr(locale, "Пиньинь")}
        </button>
        <button type="button" className={`bs-talk-tg${showMn ? " bs-on" : ""}`} onClick={() => setShowMn((v) => !v)} aria-pressed={showMn}>
          {tr(locale, "Орчуулга")}
        </button>
        <button
          type="button"
          className={`bs-talk-tg${autoSpeakRef.current ? " bs-on" : ""}`}
          onClick={(e) => {
            autoSpeakRef.current = !autoSpeakRef.current;
            e.currentTarget.classList.toggle("bs-on", autoSpeakRef.current);
          }}
        >
          🔊 {tr(locale, "Автоматаар унших")}
        </button>
      </div>

      <p className="bs-talk-setting" translate="no">
        {locale === "zh" ? scenario.setting_zh : scenario.setting_mn}
      </p>

      <div className="bs-talk-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bs-talk-row bs-talk-row--${m.role}`}>
            <div className="bs-talk-bubble">
              {m.role === "ai" ? (
                <button type="button" className="bs-talk-spk" onClick={() => speak(m.zh)} aria-label={tr(locale, "Сонсох")}>
                  🔊
                </button>
              ) : null}
              <div className="bs-talk-zh hanzi" translate="no">
                {m.zh}
              </div>
              {showPy && m.pinyin ? <div className="bs-talk-py" translate="no">{m.pinyin}</div> : null}
              {showMn && m.mn ? <div className="bs-talk-mn" translate="no">{m.mn}</div> : null}
              {m.correction ? (
                <div className="bs-talk-corr" translate="no">
                  ✏️ <b>{m.correction.zh}</b>
                  {m.correction.mn ? <span> — {m.correction.mn}</span> : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="bs-talk-row bs-talk-row--ai">
            <div className="bs-talk-bubble bs-talk-bubble--typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
        {mode === "checking" && messages.length === 0 && !busy ? (
          <p className="bs-talk-hint">{tr(locale, "Бэлдэж байна…")}</p>
        ) : null}
      </div>

      {error ? (
        <p className="bs-talk-err" role="alert">
          {error}
        </p>
      ) : null}

      {done ? (
        <div className="bs-talk-done">
          <div className="bs-talk-done-ic" aria-hidden>
            🎉
          </div>
          <b>{tr(locale, "Яриа дууслаа!")}</b>
          <p>
            {userTurns} {tr(locale, "удаа хариулсан")}
            {awarded > 0 ? ` · +${awarded} ${tr(locale, "оноо")}` : ""}
            {!loggedIn ? ` · ${tr(locale, "оноо авахын тулд нэвтэрнэ үү")}` : ""}
          </p>
          <div className="bs-talk-vocab" translate="no">
            {scenario.vocab.map((v) => (
              <span key={v.zh} className="bs-talk-vchip" title={v.mn}>
                <b>{v.zh}</b> <small>{v.pinyin}</small>
              </span>
            ))}
          </div>
          <div className="bs-talk-done-btns">
            {loggedIn ? (
              <button type="button" className="bs-talk-btn bs-talk-btn--primary" onClick={() => void saveVocab()} disabled={saveState !== "idle"}>
                {saveState === "saved"
                  ? tr(locale, "Миний үгсэд хадгалсан ✓")
                  : saveState === "saving"
                    ? tr(locale, "Хадгалж байна…")
                    : tr(locale, "Шинэ үгсийг «Миний үгс»-д хадгалах")}
              </button>
            ) : null}
            <button type="button" className="bs-talk-btn" onClick={restart}>
              ↻ {tr(locale, "Дахин ярилцах")}
            </button>
            <Link href="/talk" className="bs-talk-btn">
              {tr(locale, "Өөр сценар")}
            </Link>
          </div>
        </div>
      ) : mode === "script" ? (
        <div className="bs-talk-options">
          <p className="bs-talk-hint">{tr(locale, "Хариултаа сонго эсвэл микрофоноор хэл:")}</p>
          {options.map((o, i) => (
            <button key={i} type="button" className="bs-talk-opt" onClick={() => chooseOption(o)} disabled={busy}>
              <span className="bs-talk-opt-zh hanzi" translate="no">
                {o.zh}
              </span>
              {showPy ? <span className="bs-talk-opt-py" translate="no">{o.pinyin}</span> : null}
              {showMn ? <span className="bs-talk-opt-mn" translate="no">{o.mn}</span> : null}
              {o.tip_mn ? <span className="bs-talk-opt-tip">💡 {o.tip_mn}</span> : null}
            </button>
          ))}
          {micOk ? (
            <button type="button" className={`bs-talk-mic${listening ? " bs-talk-mic--live" : ""}`} onClick={() => void listen()}>
              {listening ? `⏺ ${tr(locale, "Сонсож байна… дарж зогсоо")}` : `🎤 ${tr(locale, "Микрофоноор хэлэх")}`}
            </button>
          ) : null}
        </div>
      ) : mode === "ai" ? (
        <form
          className="bs-talk-input"
          onSubmit={(e) => {
            e.preventDefault();
            void sendFree(input);
          }}
        >
          {micOk ? (
            <button
              type="button"
              className={`bs-talk-micbtn${listening ? " bs-talk-mic--live" : ""}`}
              onClick={() => void listen()}
              aria-label={tr(locale, "Микрофоноор хэлэх")}
              disabled={busy}
            >
              {listening ? "⏺" : "🎤"}
            </button>
          ) : null}
          <input
            className="bs-talk-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tr(locale, "Хятадаар бич… (пиньинь ч болно)")}
            disabled={busy}
            autoComplete="off"
            lang="zh-CN"
          />
          <button type="submit" className="bs-talk-send" disabled={busy || !input.trim()}>
            ➤
          </button>
        </form>
      ) : null}
    </div>
  );
}
