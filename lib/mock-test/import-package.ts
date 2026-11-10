/**
 * Жинхэнэ шалгалт (真题) импортын багцын формат — `<TID>.json`.
 * Zip: `<TID>.json` + `audio/<TID>.mp3` + `images/*.png|jpg`.
 * `audio/…`, `images/…` гэсэн харьцангуй замууд Storage URL болж солигдоно.
 * Хуучин scripts/load_tests.mjs-тэй нийцтэй, дээр нь tutor_note / audio_* талбарууд.
 */
import { parseTutorNote, type TutorNote } from "@/lib/mock-test/tutor-note";

export type MockPackageOption = { key: string; text?: string; image_url?: string | null };

export type MockPackageQuestion = {
  skill: string;
  part: number;
  q_no: number;
  q_type: string;
  stem?: string | null;
  options?: MockPackageOption[] | null;
  correct_answer?: string | null;
  autograde?: string;
  points?: number;
  audio_url?: string | null;
  image_url?: string | null;
  needs_image?: boolean;
  tags?: string[];
  target_lesson_id?: string | null;
  explanation_mn?: string | null;
  audio_start_sec?: number | null;
  audio_end_sec?: number | null;
  audio_transcript?: string | null;
  tutor_note?: TutorNote | null;
};

export type MockPackageSection = {
  skill: string;
  time_min?: number;
  audio_url?: string | null;
  parts: { part: number; range: [number, number]; q_type: string; desc?: string }[];
};

export type MockPackage = {
  test_id: string;
  hsk_level: number;
  title: string;
  total_questions: number;
  time_limit_min: number;
  has_writing: boolean;
  sections: MockPackageSection[];
  questions: MockPackageQuestion[];
};

export type MockPackageValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  assetRefs: string[];
  stats: {
    questions: number;
    listening: number;
    withExplanation: number;
    withTutorNote: number;
    withAudioSlice: number;
    withTranscript: number;
    optionImages: number;
  };
};

export const TEST_ID_RE = /^[A-Z]\d{5}[A-Z]?$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isRelativeAsset(path: unknown): path is string {
  return typeof path === "string" && (path.startsWith("audio/") || path.startsWith("images/"));
}

/** Кирилл ө/ү дутуу бичигдсэн байж болзошгүй үгс — анхааруулга (import зогсоохгүй). */
const SUSPICIOUS_MN = /\b(огуулбэр|хуухэд|хуухд|дугнэлт|оорийн|оороор|сорог|зовхон|бурэн|угийн|угс|хун)\b/i;

export function validateMockPackage(raw: unknown): { pkg: MockPackage | null; report: MockPackageValidation } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const assetRefs = new Set<string>();
  const stats = {
    questions: 0,
    listening: 0,
    withExplanation: 0,
    withTutorNote: 0,
    withAudioSlice: 0,
    withTranscript: 0,
    optionImages: 0,
  };
  const fail = () => ({ pkg: null, report: { ok: false, errors, warnings, assetRefs: [...assetRefs], stats } });

  if (!isRecord(raw)) {
    errors.push("JSON нь объект биш.");
    return fail();
  }
  const testId = typeof raw.test_id === "string" ? raw.test_id.trim() : "";
  if (!TEST_ID_RE.test(testId)) errors.push(`test_id буруу: «${testId}» (жишээ H41329).`);
  const hskLevel = Number(raw.hsk_level);
  if (!Number.isInteger(hskLevel) || hskLevel < 1 || hskLevel > 6) errors.push("hsk_level 1–6 байх ёстой.");
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : `HSK ${hskLevel} — ${testId}`;
  const totalQuestions = Number(raw.total_questions);
  const timeLimit = Number(raw.time_limit_min);
  if (!Number.isInteger(totalQuestions) || totalQuestions <= 0) errors.push("total_questions буруу.");
  if (!Number.isInteger(timeLimit) || timeLimit <= 0) errors.push("time_limit_min буруу.");

  const sections: MockPackageSection[] = [];
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    errors.push("sections хоосон.");
  } else {
    raw.sections.forEach((s, i) => {
      if (!isRecord(s) || typeof s.skill !== "string" || !Array.isArray(s.parts)) {
        errors.push(`sections[${i}] буруу бүтэц.`);
        return;
      }
      if (isRelativeAsset(s.audio_url)) assetRefs.add(s.audio_url);
      sections.push({
        skill: s.skill,
        time_min: typeof s.time_min === "number" ? s.time_min : undefined,
        audio_url: typeof s.audio_url === "string" ? s.audio_url : null,
        parts: s.parts.map((p) => {
          const pr = isRecord(p) ? p : {};
          const range = Array.isArray(pr.range) ? pr.range : [0, 0];
          return {
            part: Number(pr.part ?? 1),
            range: [Number(range[0]), Number(range[1])] as [number, number],
            q_type: String(pr.q_type ?? "choice"),
            desc: typeof pr.desc === "string" ? pr.desc : undefined,
          };
        }),
      });
    });
  }

  const questions: MockPackageQuestion[] = [];
  const seen = new Set<number>();
  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    errors.push("questions хоосон.");
  } else {
    raw.questions.forEach((q, i) => {
      if (!isRecord(q)) {
        errors.push(`questions[${i}] объект биш.`);
        return;
      }
      const qNo = Number(q.q_no);
      if (!Number.isInteger(qNo) || qNo <= 0) {
        errors.push(`questions[${i}] q_no буруу.`);
        return;
      }
      if (seen.has(qNo)) errors.push(`q_no ${qNo} давхардсан.`);
      seen.add(qNo);
      const skill = typeof q.skill === "string" ? q.skill : "";
      if (!["listening", "reading", "writing"].includes(skill)) errors.push(`q${qNo}: skill буруу «${skill}».`);
      const qType = typeof q.q_type === "string" ? q.q_type : "";
      if (!qType) errors.push(`q${qNo}: q_type хоосон.`);

      let options: MockPackageOption[] | null = null;
      if (Array.isArray(q.options)) {
        options = q.options.map((o) => {
          const or = isRecord(o) ? o : {};
          const opt: MockPackageOption = { key: String(or.key ?? "") };
          if (typeof or.text === "string") opt.text = or.text;
          if (typeof or.image_url === "string" && or.image_url) {
            opt.image_url = or.image_url;
            if (isRelativeAsset(or.image_url)) assetRefs.add(or.image_url);
            stats.optionImages += 1;
          }
          return opt;
        });
        if (options.some((o) => !o.key)) errors.push(`q${qNo}: option key хоосон.`);
      }
      const correct = typeof q.correct_answer === "string" ? q.correct_answer.trim() : null;
      const autograde = typeof q.autograde === "string" ? q.autograde : "auto";
      if (autograde === "auto" && !correct) errors.push(`q${qNo}: correct_answer хоосон.`);
      if (correct && options && options.length && !["match", "fill_match", "fill_word", "complete", "fill_char", "essay", "essay_picture", "summary", "error_find"].includes(qType)) {
        const keys = new Set(options.map((o) => o.key));
        if (!keys.has(correct) && !["√", "×", "✓", "✗", "T", "F"].includes(correct)) {
          warnings.push(`q${qNo}: correct_answer «${correct}» options дотор алга.`);
        }
      }

      if (isRelativeAsset(q.audio_url)) assetRefs.add(q.audio_url);
      if (isRelativeAsset(q.image_url)) assetRefs.add(q.image_url);

      const tutor = q.tutor_note == null ? null : parseTutorNote(q.tutor_note);
      if (q.tutor_note != null && !tutor) warnings.push(`q${qNo}: tutor_note бүтэц буруу (why алга) — алгасав.`);
      const expl = typeof q.explanation_mn === "string" && q.explanation_mn.trim() ? q.explanation_mn.trim() : null;
      if (!expl && !["essay", "essay_picture", "summary"].includes(qType)) warnings.push(`q${qNo}: explanation_mn хоосон.`);
      if (!tutor && !["essay", "essay_picture", "summary"].includes(qType)) warnings.push(`q${qNo}: tutor_note алга.`);

      const textForCheck = (expl ?? "") + " " + (tutor ? JSON.stringify(tutor) : "");
      if (SUSPICIOUS_MN.test(textForCheck)) warnings.push(`q${qNo}: ө/ү дутуу бичигдсэн үг байж магадгүй.`);

      const start = typeof q.audio_start_sec === "number" ? q.audio_start_sec : null;
      const end = typeof q.audio_end_sec === "number" ? q.audio_end_sec : null;
      if (skill === "listening") {
        stats.listening += 1;
        if (start == null) warnings.push(`q${qNo}: сонсголын асуултад audio_start_sec алга.`);
        else stats.withAudioSlice += 1;
        if (typeof q.audio_transcript === "string" && q.audio_transcript.trim()) stats.withTranscript += 1;
      }
      if (expl) stats.withExplanation += 1;
      if (tutor) stats.withTutorNote += 1;
      stats.questions += 1;

      questions.push({
        skill,
        part: Number(q.part ?? 1),
        q_no: qNo,
        q_type: qType,
        stem: typeof q.stem === "string" ? q.stem : null,
        options,
        correct_answer: correct,
        autograde,
        points: typeof q.points === "number" ? q.points : 1,
        audio_url: typeof q.audio_url === "string" ? q.audio_url : null,
        image_url: typeof q.image_url === "string" ? q.image_url : null,
        needs_image: Boolean(q.needs_image),
        tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
        target_lesson_id: typeof q.target_lesson_id === "string" ? q.target_lesson_id : null,
        explanation_mn: expl,
        audio_start_sec: start,
        audio_end_sec: end,
        audio_transcript: typeof q.audio_transcript === "string" ? q.audio_transcript : null,
        tutor_note: tutor,
      });
    });
    if (Number.isInteger(totalQuestions) && questions.length !== totalQuestions) {
      warnings.push(`total_questions=${totalQuestions} боловч асуулт ${questions.length}.`);
    }
  }

  if (errors.length) return fail();
  return {
    pkg: {
      test_id: testId,
      hsk_level: hskLevel,
      title,
      total_questions: totalQuestions,
      time_limit_min: timeLimit,
      has_writing: Boolean(raw.has_writing),
      sections,
      questions,
    },
    report: { ok: true, errors, warnings, assetRefs: [...assetRefs], stats },
  };
}

/** Харьцангуй asset замыг Storage URL болгож солино. */
export function resolvePackageAssets(pkg: MockPackage, urlMap: Record<string, string>): MockPackage {
  const res = (v: string | null | undefined) => (isRelativeAsset(v) ? urlMap[v] ?? null : v ?? null);
  return {
    ...pkg,
    sections: pkg.sections.map((s) => ({ ...s, audio_url: res(s.audio_url) })),
    questions: pkg.questions.map((q) => ({
      ...q,
      audio_url: res(q.audio_url),
      image_url: res(q.image_url),
      options: q.options ? q.options.map((o) => ({ ...o, image_url: res(o.image_url) })) : q.options,
    })),
  };
}

export function storagePathForAsset(testId: string, rel: string): string | null {
  const name = rel.split("/").pop() ?? rel;
  if (rel.startsWith("audio/")) return `tests/${testId}/audio/${name}`;
  if (rel.startsWith("images/")) return `tests/${testId}/images/${name}`;
  return null;
}
