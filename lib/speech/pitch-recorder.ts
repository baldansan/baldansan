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
  /** Одоог хүртэл цугларсан цэгүүд (бичлэгийн явцад амьд зурахад). */
  peek: () => PitchSample[];
  /**
   * `record: true`-гээр эхлүүлсэн бол stop()-ын дараа хэрэглэгчийн дууны
   * бичлэг (webm/mp4). MediaRecorder байхгүй эсвэл алдаа гарвал null.
   */
  recording: Promise<Blob | null>;
};

export type PitchRecorderOptions = {
  /** Дууг MediaRecorder-оор давхар бичих (дараа нь «▶ Таны дуу»). */
  record?: boolean;
};

const FRAME_SIZE = 2048;
const SAMPLE_INTERVAL_MS = 60;
/** Офлайн (mp3) шинжилгээнд нарийн алхам */
const OFFLINE_STEP_MS = 20;
const MIN_F0 = 70;
const MAX_F0 = 500;
const RMS_GATE = 0.012;
const CLARITY_GATE = 0.5;
/** Хамгийн богино хугацаатай (өндөр f0) оргилыг хамгийн сайнаас энэ хувиар доогуур байсан ч сонгоно — октав алдаанаас сэргийлнэ */
const PEAK_TOLERANCE = 0.9;

/**
 * Нормчилсон автокорреляциар f0 илрүүлнэ (Hz). Дуугүй/тодорхойгүй бол null.
 * Оргилуудаас хамгийн сайных нь 90%-д хүрсэн хамгийн богино хугацааг авна
 * (октав доош алдааг багасгана), парабол интерполяцоор нарийвчилна.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  const n = buf.length;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += buf[i] * buf[i];
  const rms = Math.sqrt(energy / n);
  if (rms < RMS_GATE || energy === 0) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_F0));
  const maxLag = Math.min(Math.floor(sampleRate / MIN_F0), n - 2);
  if (maxLag <= minLag) return null;

  // Нормчилсон автокорреляци: r(lag) = Σx[i]x[i+lag] / sqrt(Σx[i]² · Σx[i+lag]²)
  const corr = new Float32Array(maxLag + 2);
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let e0 = 0;
    let e1 = 0;
    for (let i = 0; i + lag < n; i++) {
      const a = buf[i];
      const b = buf[i + lag];
      sum += a * b;
      e0 += a * a;
      e1 += b * b;
    }
    const c = e0 > 0 && e1 > 0 ? sum / Math.sqrt(e0 * e1) : 0;
    corr[lag] = c;
    if (c > bestCorr) bestCorr = c;
  }
  if (bestCorr < CLARITY_GATE) return null;

  // Хамгийн богино lag дээрх хангалттай сайн орон нутгийн оргил
  let bestLag = -1;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (corr[lag] >= bestCorr * PEAK_TOLERANCE && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag <= 0) return null;

  // Парабол интерполяци
  const y0 = corr[bestLag - 1];
  const y1 = corr[bestLag];
  const y2 = corr[bestLag + 1];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  const lag = bestLag + (Math.abs(shift) < 1 ? shift : 0);
  return sampleRate / lag;
}

/**
 * Бэлэн дууны буферээс (жишээ нь тайлсан mp3) аялгын муруй гаргана —
 * микрофоны хэмжигчтэй ижил алгоритм, нарийн алхам (20 мс).
 */
export function pitchTrackFromBuffer(
  data: Float32Array,
  sampleRate: number,
  stepMs: number = OFFLINE_STEP_MS
): PitchSample[] {
  const out: PitchSample[] = [];
  const step = Math.max(1, Math.floor((sampleRate * stepMs) / 1000));
  const frame = new Float32Array(FRAME_SIZE);
  for (let start = 0; start + FRAME_SIZE <= data.length; start += step) {
    frame.set(data.subarray(start, start + FRAME_SIZE));
    const f0 = detectPitch(frame, sampleRate);
    if (f0 != null) out.push({ t: start / sampleRate, f0 });
  }
  return out;
}

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      // ignore
    }
  }
  return undefined;
}

/**
 * Бичлэг эхлүүлнэ. Микрофоны зөвшөөрөл асууна — зөвшөөрөөгүй бол throw.
 */
export async function startPitchRecorder(
  options: PitchRecorderOptions = {}
): Promise<PitchRecorderHandle> {
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

  // Дууг давхар бичих (ижил stream дээр MediaRecorder)
  let mediaRecorder: MediaRecorder | null = null;
  let resolveRecording: (b: Blob | null) => void = () => undefined;
  const recording = new Promise<Blob | null>((resolve) => {
    resolveRecording = resolve;
  });
  if (options.record && typeof MediaRecorder !== "undefined") {
    try {
      const mimeType = pickRecorderMime();
      mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        resolveRecording(
          chunks.length > 0
            ? new Blob(chunks, { type: mediaRecorder?.mimeType || mimeType || "audio/webm" })
            : null
        );
      };
      mediaRecorder.onerror = () => resolveRecording(null);
      mediaRecorder.start(250);
    } catch {
      mediaRecorder = null;
      resolveRecording(null);
    }
  } else {
    resolveRecording(null);
  }

  const timer = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    const f0 = detectPitch(buf, audioCtx.sampleRate);
    if (f0 != null) {
      samples.push({ t: (performance.now() - startedAt) / 1000, f0 });
    }
  }, SAMPLE_INTERVAL_MS);

  let stopped = false;
  return {
    recording,
    peek() {
      return samples;
    },
    stop() {
      if (stopped) return samples;
      stopped = true;
      window.clearInterval(timer);
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try {
          mediaRecorder.stop();
        } catch {
          resolveRecording(null);
        }
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
