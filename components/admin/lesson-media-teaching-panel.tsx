"use client";

import { inferLessonLanguage } from "@/lib/language-track";
import {
  KOREAN_TEACHING_VISUAL_RECOMMENDATIONS,
  parseTeachingImagesFromSourceNote,
} from "@/lib/lesson/teaching-media";
import { hasAudioUrl, hasThumbnailUrl, hasVideoUrl } from "@/lib/lesson-media";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
};

export function LessonMediaTeachingPanel({ lesson }: Props) {
  const isKorean = inferLessonLanguage(lesson) === "ko";
  const teachingImages = parseTeachingImagesFromSourceNote(lesson.sourceNote);
  const hasVideo = hasVideoUrl(lesson);
  const hasThumb = hasThumbnailUrl(lesson);
  const hasAudio = hasAudioUrl(lesson);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Media status</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        <li>{hasThumb ? "✓ Thumbnail" : "○ Thumbnail — missing"}</li>
        <li>{hasAudio ? "✓ Lesson audio" : "○ Lesson audio — TTS fallback OK"}</li>
        <li>{hasVideo ? "✓ Video URL" : "○ Video — optional for Korean textbook"}</li>
        <li>
          {teachingImages.length > 0
            ? `✓ Teaching visuals (${teachingImages.length})`
            : "○ Teaching visuals — optional"}
        </li>
      </ul>

      {teachingImages.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Imported teaching images
          </p>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
            {teachingImages.map((image) => (
              <li key={image.url}>{image.title}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {isKorean ? (
        <div className="mt-4 rounded-lg bg-white p-3 ring-1 ring-emerald-100">
          <p className="text-xs font-semibold text-emerald-800">
            Recommended Korean teaching visuals
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {KOREAN_TEACHING_VISUAL_RECOMMENDATIONS.map((item) => (
              <li key={item.file}>
                <span className="font-medium text-slate-800">{item.label}</span>
                <span className="text-slate-500"> — {item.file}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Images can be included in ZIP under <code className="text-emerald-700">images/</code>{" "}
            and referenced from <code className="text-emerald-700">lesson.json</code>{" "}
            <code className="text-emerald-700">teachingImages</code> array. Per-word audio goes in{" "}
            <code className="text-emerald-700">audio/</code> with{" "}
            <code className="text-emerald-700">audioFile</code> on vocabulary rows.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Upload thumbnail, audio, or video above. External URLs can be pasted in the manual
          fields below.
        </p>
      )}
    </div>
  );
}
