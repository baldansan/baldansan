/**
 * Энгийн дуу бичигч: микрофон → санах ой (Blob).
 *
 * ДҮРЭМ (эзний шийдвэр, 2026-11-28): бичлэг төхөөрөмж дээрээ л үлдэнэ.
 * Энд fetch, үг таних (SpeechRecognition), хөгийн оноо ОГТ байхгүй — нэмж болохгүй.
 */
import { detectPlatform, isInAppBrowser, isStandalone } from "@/lib/pwa/install-state";

/** Бичиж чадахгүй шалтгаан — тус бүрд өөр мэдэгдэл гарна. */
export type VoiceProblem =
  /** Хөтөч микрофон/бичлэг дэмжихгүй (хуучин iOS, апп доторх хөтөч). */
  | "unsupported"
  /** Хэрэглэгч эсвэл утасны тохиргоо зөвшөөрөөгүй. */
  | "denied"
  /** Микрофон олдсонгүй. */
  | "no-mic"
  /** Өөр апп (дуудлага г.м.) микрофоныг эзэлсэн. */
  | "busy"
  /** Бичсэн ч хоосон гарсан. */
  | "empty";

export function voiceSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext !== false &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

function pickMime(): string | undefined {
  // iPhone зөвхөн audio/mp4 бичдэг; Android/Chrome webm.
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* үл тооно */
    }
  }
  return undefined;
}

function problemFromError(err: unknown): VoiceProblem {
  const name = (err as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
    return "denied";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return "no-mic";
  }
  if (name === "NotReadableError" || name === "AbortError" || name === "TrackStartError") {
    return "busy";
  }
  return "unsupported";
}

export class VoiceError extends Error {
  problem: VoiceProblem;
  constructor(problem: VoiceProblem) {
    super(problem);
    this.problem = problem;
  }
}

export type VoiceRecording = {
  /** Зогсоож бичлэгийг буцаана. Хоосон бол VoiceError("empty"). */
  stop: () => Promise<Blob>;
  /** Хадгалахгүйгээр хаяна (дэлгэцээс гарах үед). */
  cancel: () => void;
};

/**
 * Бичиж эхэлнэ. ЗААВАЛ хэрэглэгчийн даралтын дотроос дуудна (iPhone өөрөөр зөвшөөрөл асуухгүй).
 * Алдаа гарвал VoiceError шиднэ.
 */
export async function startVoiceRecording(): Promise<VoiceRecording> {
  if (!voiceSupported()) throw new VoiceError("unsupported");

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (err) {
    throw new VoiceError(problemFromError(err));
  }

  const release = () => {
    // Микрофоныг шууд суллана — iPhone дээр суллахгүй бол дараагийн дуу чихний чанга яригчаар сул гардаг.
    for (const track of stream.getTracks()) track.stop();
  };

  let recorder: MediaRecorder;
  const chunks: BlobPart[] = [];
  try {
    const mimeType = pickMime();
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.start();
  } catch {
    release();
    throw new VoiceError("unsupported");
  }

  let finished = false;
  return {
    stop() {
      return new Promise<Blob>((resolve, reject) => {
        if (finished) {
          reject(new VoiceError("empty"));
          return;
        }
        finished = true;
        const done = () => {
          release();
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/mp4" });
          if (blob.size < 200) reject(new VoiceError("empty"));
          else resolve(blob);
        };
        recorder.onstop = done;
        recorder.onerror = () => {
          release();
          reject(new VoiceError("empty"));
        };
        try {
          recorder.stop();
        } catch {
          done();
        }
      });
    },
    cancel() {
      if (finished) return;
      finished = true;
      try {
        recorder.ondataavailable = null;
        recorder.stop();
      } catch {
        /* үл тооно */
      }
      release();
    },
  };
}

/** Асуудал бүрд төхөөрөмжид таарсан, хийх алхамтай монгол мэдэгдэл. */
export function voiceProblemMessage(problem: VoiceProblem): string[] {
  const platform = typeof window === "undefined" ? "desktop" : detectPlatform();
  const installed = typeof window !== "undefined" && isStandalone();
  const inApp = typeof window !== "undefined" && isInAppBrowser();

  switch (problem) {
    case "unsupported":
      if (inApp) {
        return [
          "Энэ хөтөч дотор дуу бичиж болохгүй байна.",
          platform === "ios"
            ? "Баруун доод «···» цэсээс «Safari-аар нээх»-ийг дараад дахин оролд."
            : "Баруун дээд «⋮» цэсээс «Chrome-оор нээх»-ийг дараад дахин оролд.",
        ];
      }
      if (platform === "ios") {
        return [
          "Энэ iPhone дээр дуу бичих боломжгүй байна.",
          "Тохиргоо → Ерөнхий → Програм шинэчлэх хэсгээс iOS-оо шинэчлээд дахин оролд.",
          "Одоохондоо сонсоод чангаар дагаж хэлэхэд болно.",
        ];
      }
      return [
        "Энэ хөтөч дуу бичиж чадахгүй байна.",
        "Chrome эсвэл Safari-аар нээгээд дахин оролд.",
      ];
    case "denied":
      if (platform === "ios") {
        return installed
          ? [
              "Микрофоныг зөвшөөрөөгүй байна.",
              "Аппаа бүр хаагаад дахин нээ. «Микрофон ашиглах уу» гэж асуухад «Зөвшөөрөх»-ийг дар.",
              "Асуухгүй бол: Тохиргоо → Апп → Safari → Микрофон → «Асуух».",
            ]
          : [
              "Микрофоныг зөвшөөрөөгүй байна.",
              "Хаягийн мөрний зүүн талын товч → Вэб сайтын тохиргоо → Микрофон → «Зөвшөөрөх».",
            ];
      }
      if (platform === "android") {
        return [
          "Микрофоныг зөвшөөрөөгүй байна.",
          "Хаягийн мөрний 🔒 → Зөвшөөрөл → Микрофон → «Зөвшөөрөх».",
          "Суулгасан апп бол: апп дээр удаан дар → Аппын мэдээлэл → Зөвшөөрөл → Микрофон.",
        ];
      }
      return ["Микрофоныг зөвшөөрөөгүй байна.", "Хаягийн мөрний 🔒 → Микрофон → «Зөвшөөрөх»."];
    case "no-mic":
      return ["Микрофон олдсонгүй.", "Чихэвч залгаатай бол салгаад дахин оролд."];
    case "busy":
      return [
        "Микрофоныг өөр апп ашиглаж байна.",
        "Дуудлага, дуу бичигч зэргээ хаагаад дахин оролд.",
      ];
    case "empty":
      return ["Дуу бичигдсэнгүй.", "Товчоо дараад 1 секунд хүлээгээд, утсандаа ойрхон хэл."];
  }
}
