/**
 * Микрофоноос дууны үндсэн давтамжийг (f0 — pitch) хэмжигч.
 * Автокорреляциар 70–400 Hz мужид илрүүлнэ (хүний ярианы аялга).
 * Гадны сангүй, бүх тооцоолол клиент дээр.
 */

export type PitchSample = {
  /** секунд (бичлэг эхэлснээс) */
  t: number;
  /** Hz */
  f0: number;
};

export type PitchRecorderHandle = {
  /** Бичлэгийг зогсоож цуглуулсан цэгүүдийг буцаана. */
  stop: () => PitchSample[];
};

const FRAME_SIZE = 2048;
const SAMPLE_INTERVAL_MS = 60;
const MIN_F0 = 70;
const MAX_F0 = 400;
const RMS_GATE = 0.012;
const CLARITY_GATE = 0.5;

function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  const n = buf.length;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += buf[i] * buf[i];
  const rms = Math.sqrt(energy / n);
  if (rms < RMS_GATE || energy === 0) return null;

  const minLag = Math.floor(sampleRate / MAX_F0);
  const maxLag = Math.min(Math.floor(sampleRate / MIN_F0), n - 1);

  let bestCorr = 0;
  let bestLag = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < n; i++) {
      sum += buf[i] * buf[i + lag];
    }
    const corr = sum / energy;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || bestCorr < CLARITY_GATE) return null;

  // Парабол интерполяци — жаахан нарийвчлал нэмнэ
  return sampleRate / bestLag;
}

/**
 * Бичлэг эхлүүлнэ. Микрофоны зөвшөөрөл асууна — зөвшөөрөөгүй бол throw.
 */
export async function startPitchRecorder(): Promise<PitchRecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  type AudioContextCtor = typeof AudioContext;
  const Ctx: AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: AudioContextCtor })
      .webkitAudioContext;
  const audioCtx = new Ctx();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = FRAME_SIZE;
  source.connect(analyser);

  const buf = new Float32Array(FRAME_SIZE);
  const samples: PitchSample[] = [];
  const startedAt = performance.now();

  const timer = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    const f0 = detectPitch(buf, audioCtx.sampleRate);
    if (f0 != null) {
      samples.push({ t: (performance.now() - startedAt) / 1000, f0 });
    }
  }, SAMPLE_INTERVAL_MS);

  let stopped = false;
  return {
    stop() {
      if (stopped) return samples;
      stopped = true;
      window.clearInterval(timer);
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      for (const track of stream.getTracks()) track.stop();
      void audioCtx.close().catch(() => undefined);
      return samples;
    },
  };
}

/** Медиан шүүлт — ганц нэг алдаатай цэгийг дарна. */
export function smoothPitch(samples: PitchSample[]): PitchSample[] {
  if (samples.length < 5) return samples;
  const out: PitchSample[] = [];
  for (let i = 0; i < samples.length; i++) {
    const window = samples
      .slice(Math.max(0, i - 1), Math.min(samples.length, i + 2))
      .map((s) => s.f0)
      .sort((a, b) => a - b);
    out.push({ t: samples[i].t, f0: window[Math.floor(window.length / 2)] });
  }
  return out;
}
