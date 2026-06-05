/**
 * Cloze / quiz blanks (ASCII or fullwidth underscores, etc.) must not be sent to
 * speech synthesis — browsers often read each mark as "доогуур зураас" repeatedly.
 */
const CLOZE_BLANK_CHARS = "_＿﹍﹎﹏﹋﹌‾￣";

const CLOZE_BLANK_RUN = new RegExp(
  `[${escapeForCharClass(CLOZE_BLANK_CHARS)}]+`,
  "g"
);

function escapeForCharClass(chars: string): string {
  return chars.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
}

/** Normalize learner-facing text before TTS (single utterance, no blank markers). */
export function prepareTextForTts(text: string): string {
  return text
    .replace(CLOZE_BLANK_RUN, " ")
    .replace(/\s+/g, " ")
    .trim();
}
