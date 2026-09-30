"use client";

/**
 * Тоглоомын «juice»: дуу чимээ (Web Audio, файлгүй), combo/үржүүлэгч, хурдны урамшуулал,
 * confetti, өдрийн даалгавар. Бүх тоглоом энэ нэг файлыг ашиглана.
 */

/* ---------------- Дуу чимээ ---------------- */

const SFX_KEY = "buunduu-sfx-off-v1";

export function isSfxMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SFX_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean): void {
  try {
    if (muted) localStorage.setItem(SFX_KEY, "1");
    else localStorage.removeItem(SFX_KEY);
  } catch {
    /* ignore */
  }
}

let audioCtx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  startAt: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.16
) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, startAt);
  g.gain.setValueAtTime(0.0001, startAt);
  g.gain.exponentialRampToValueAtTime(gain, startAt + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(startAt);
  o.stop(startAt + dur + 0.02);
}

export type SfxKind = "correct" | "wrong" | "combo" | "finish" | "bonus" | "heart";

export function playSfx(kind: SfxKind): void {
  if (isSfxMuted()) return;
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime;
  switch (kind) {
    case "correct":
      tone(ac, 660, t, 0.09);
      tone(ac, 880, t + 0.08, 0.14);
      break;
    case "wrong":
      tone(ac, 220, t, 0.16, "square", 0.08);
      tone(ac, 180, t + 0.12, 0.2, "square", 0.08);
      break;
    case "combo":
      tone(ac, 660, t, 0.08);
      tone(ac, 830, t + 0.07, 0.08);
      tone(ac, 990, t + 0.14, 0.08);
      tone(ac, 1320, t + 0.21, 0.22);
      break;
    case "bonus":
      tone(ac, 1200, t, 0.06, "triangle", 0.12);
      tone(ac, 1600, t + 0.06, 0.1, "triangle", 0.12);
      break;
    case "heart":
      tone(ac, 300, t, 0.12, "sawtooth", 0.06);
      tone(ac, 200, t + 0.1, 0.25, "sawtooth", 0.06);
      break;
    case "finish":
      tone(ac, 523, t, 0.14);
      tone(ac, 659, t + 0.13, 0.14);
      tone(ac, 784, t + 0.26, 0.14);
      tone(ac, 1046, t + 0.39, 0.42);
      break;
  }
}

/* ---------------- Combo / оноо ---------------- */

export const BASE_POINTS = 10;
export const SPEED_BONUS = 5;
export const SPEED_LIMIT_MS = 3000;
export const START_LIVES = 3;

/** 0–2 → ×1, 3–5 → ×2, 6+ → ×3 */
export function comboMultiplier(combo: number): number {
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

export function isComboMilestone(combo: number): boolean {
  return combo > 0 && (combo === 3 || combo === 6 || combo % 5 === 0);
}

export type AnswerOutcome = {
  points: number;
  multiplier: number;
  speedBonus: number;
  combo: number;
};

/** Зөв хариултын оноо: суурь × үржүүлэгч + хурдны урамшуулал. */
export function scoreCorrect(comboAfter: number, elapsedMs: number): AnswerOutcome {
  const multiplier = comboMultiplier(comboAfter);
  const speedBonus = elapsedMs > 0 && elapsedMs <= SPEED_LIMIT_MS ? SPEED_BONUS : 0;
  return { points: BASE_POINTS * multiplier + speedBonus, multiplier, speedBonus, combo: comboAfter };
}

/* ---------------- Confetti ---------------- */

export function fireConfetti(durationMs = 1800): void {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const g = canvas.getContext("2d");
  if (!g) {
    canvas.remove();
    return;
  }
  g.scale(dpr, dpr);
  const colors = ["#1fb85a", "#f2a93b", "#8b5cf6", "#3b82f6", "#ef4444", "#facc15"];
  const W = window.innerWidth;
  const H = window.innerHeight;
  const parts = Array.from({ length: 140 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.5,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  function frame(now: number) {
    const t = now - start;
    g!.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.r += p.vr;
      g!.save();
      g!.translate(p.x, p.y);
      g!.rotate(p.r);
      g!.globalAlpha = Math.max(0, 1 - t / durationMs);
      g!.fillStyle = p.c;
      g!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g!.restore();
    }
    if (t < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

/* ---------------- Өдрийн даалгавар ---------------- */

const MISSION_KEY = "buunduu-daily-missions-v1";

export type DailyMissionState = {
  date: string;
  gamesPlayed: number;
  correctAnswers: number;
  bestCombo: number;
};

export type DailyMission = {
  id: "play3" | "correct20" | "combo5";
  label: string;
  current: number;
  target: number;
  done: boolean;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function readDailyMissionState(): DailyMissionState {
  const empty: DailyMissionState = { date: todayKey(), gamesPlayed: 0, correctAnswers: 0, bestCombo: 0 };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(MISSION_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as DailyMissionState;
    if (parsed.date !== todayKey()) return empty;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

/** Тоглоом дуусахад дуудна — өдрийн даалгаврын явц нэмэгдэнэ. Буцаах: шинээр биелсэн даалгаврууд. */
export function recordDailyMissionProgress(input: { correct: number; bestCombo: number }): DailyMission[] {
  const before = getDailyMissions(readDailyMissionState());
  const s = readDailyMissionState();
  s.gamesPlayed += 1;
  s.correctAnswers += Math.max(0, input.correct);
  s.bestCombo = Math.max(s.bestCombo, input.bestCombo);
  try {
    localStorage.setItem(MISSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  const after = getDailyMissions(s);
  return after.filter((m) => m.done && !before.find((b) => b.id === m.id)?.done);
}

export function getDailyMissions(state = readDailyMissionState()): DailyMission[] {
  return [
    { id: "play3", label: "3 тоглоом тогло", current: Math.min(3, state.gamesPlayed), target: 3, done: state.gamesPlayed >= 3 },
    { id: "correct20", label: "20 үг зөв хариул", current: Math.min(20, state.correctAnswers), target: 20, done: state.correctAnswers >= 20 },
    { id: "combo5", label: "Combo 5 хий", current: Math.min(5, state.bestCombo), target: 5, done: state.bestCombo >= 5 },
  ];
}
