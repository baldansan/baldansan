import { parseTutorNote } from "@/lib/mock-test/tutor-note";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";

/** mock_test_questions мөрийг MockTestQuestionRow болгоно (сервер/клиент хоёуланд). */
export function mapQuestion(raw: Record<string, unknown>): MockTestQuestionRow {
  let options = null;
  if (raw.options != null && Array.isArray(raw.options)) {
    options = raw.options.map((o) => {
      const opt = o as Record<string, unknown>;
      return {
        key: String(opt.key ?? ""),
        text: opt.text != null ? String(opt.text) : undefined,
        image_url: opt.image_url ? String(opt.image_url) : null,
      };
    });
  }

  return {
    id: String(raw.id),
    test_id: String(raw.test_id),
    skill: String(raw.skill),
    part: Number(raw.part),
    q_no: Number(raw.q_no),
    q_type: String(raw.q_type),
    stem: raw.stem ? String(raw.stem) : null,
    options,
    correct_answer: raw.correct_answer ? String(raw.correct_answer) : null,
    autograde: String(raw.autograde ?? "auto"),
    points: Number(raw.points ?? 1),
    audio_url: raw.audio_url ? String(raw.audio_url) : null,
    image_url: raw.image_url ? String(raw.image_url) : null,
    needs_image: Boolean(raw.needs_image),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    target_lesson_id: raw.target_lesson_id ? String(raw.target_lesson_id) : null,
    explanation_mn: raw.explanation_mn ? String(raw.explanation_mn) : null,
    audio_start_sec:
      raw.audio_start_sec != null ? Number(raw.audio_start_sec) : null,
    audio_end_sec:
      raw.audio_end_sec != null ? Number(raw.audio_end_sec) : null,
    audio_transcript: raw.audio_transcript
      ? String(raw.audio_transcript)
      : null,
    tutor_note: parseTutorNote(raw.tutor_note),
  };
}
