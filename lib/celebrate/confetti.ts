/**
 * Хөнгөн canvas confetti — гадны сан хэрэггүй (~2KB).
 * Нэг fixed canvas-ыг дахин ашиглана; хэсэг бүр дууссаны дараа canvas устгагдана.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  life: number;
  ttl: number;
  shape: 0 | 1;
};

const COLORS = ["#1FB85A", "#F2A93B", "#ff6b6b", "#4d9fff", "#9b6bff", "#ffd93d", "#46d07c"];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let raf = 0;
let last = 0;

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (canvas && ctx) return ctx;
  canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  return ctx;
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function teardown() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  particles = [];
  if (canvas) {
    window.removeEventListener("resize", resize);
    canvas.remove();
  }
  canvas = null;
  ctx = null;
}

function frame(now: number) {
  const c = ctx;
  if (!c || !canvas) return;
  const dt = Math.min(0.05, (now - (last || now)) / 1000);
  last = now;
  c.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const alive: Particle[] = [];
  for (const p of particles) {
    p.life += dt;
    if (p.life >= p.ttl) continue;
    p.vy += 900 * dt; // таталцал
    p.vx *= 0.985;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const alpha = p.life > p.ttl - 0.4 ? Math.max(0, (p.ttl - p.life) / 0.4) : 1;
    c.save();
    c.globalAlpha = alpha;
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    c.fillStyle = p.color;
    if (p.shape === 0) {
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      c.beginPath();
      c.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    alive.push(p);
  }
  particles = alive;
  if (particles.length > 0) {
    raf = requestAnimationFrame(frame);
  } else {
    teardown();
  }
}

export type ConfettiOptions = {
  /** Хэдэн ширхэг (өгөгдмөл 40). */
  count?: number;
  /** Гарах цэг — дэлгэцийн хувиар 0..1 (өгөгдмөл төв дээд хэсэг). */
  x?: number;
  y?: number;
  /** Тархалтын хүч (өгөгдмөл 1). */
  power?: number;
};

/** Жижиг тэсрэлт — зөв хариулт бүрд. */
export function burstConfetti(opts: ConfettiOptions = {}): void {
  const c = ensureCanvas();
  if (!c) return;
  const count = opts.count ?? 40;
  const power = opts.power ?? 1;
  const ox = (opts.x ?? 0.5) * window.innerWidth;
  const oy = (opts.y ?? 0.35) * window.innerHeight;
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = (260 + Math.random() * 320) * power;
    const size = 5 + Math.random() * 6;
    particles.push({
      x: ox + (Math.random() - 0.5) * 30,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: size,
      h: size * (0.5 + Math.random()),
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0,
      ttl: 1.3 + Math.random() * 0.9,
      shape: Math.random() < 0.3 ? 1 : 0,
    });
  }
  if (!raf) {
    last = 0;
    raf = requestAnimationFrame(frame);
  }
}

/** Том баяр — хичээл/үе дуусахад хоёр талаас бороо. */
export function rainConfetti(): void {
  burstConfetti({ count: 70, x: 0.15, y: 0.55, power: 1.3 });
  burstConfetti({ count: 70, x: 0.85, y: 0.55, power: 1.3 });
  window.setTimeout(() => burstConfetti({ count: 50, x: 0.5, y: 0.3, power: 1.1 }), 260);
}
