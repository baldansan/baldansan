import { normalizeLessonRouteId } from "@/lib/lesson-id";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";

export const LESSON_MEDIA_BUCKET = "lesson-media";

export type LessonMediaType = "thumbnail" | "audio" | "video";

export type MediaUploadResult = {
  publicUrl: string | null;
  path: string | null;
  error: string | null;
};

type MediaValidationRules = {
  mimeTypes: Set<string>;
  extensions: Set<string>;
  maxBytes: number;
  label: string;
};

const MEDIA_RULES: Record<LessonMediaType, MediaValidationRules> = {
  thumbnail: {
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    extensions: new Set(["jpg", "jpeg", "png", "webp"]),
    maxBytes: 5 * 1024 * 1024,
    label: "Thumbnail",
  },
  audio: {
    mimeTypes: new Set([
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/mp4",
      "audio/x-wav",
    ]),
    extensions: new Set(["mp3", "wav", "m4a"]),
    maxBytes: 50 * 1024 * 1024,
    label: "Audio",
  },
  video: {
    mimeTypes: new Set(["video/mp4", "video/webm", "video/quicktime"]),
    extensions: new Set(["mp4", "webm", "mov"]),
    maxBytes: 500 * 1024 * 1024,
    label: "Video",
  },
};

function fileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

function formatMaxSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${bytes / (1024 * 1024 * 1024)}GB`;
  }
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function validateMediaFile(
  file: File,
  mediaType: LessonMediaType
): string | null {
  const rules = MEDIA_RULES[mediaType];
  const ext = fileExtension(file.name);
  const mimeOk =
    !file.type || rules.mimeTypes.has(file.type.toLowerCase());
  const extOk = ext ? rules.extensions.has(ext) : false;

  if (!mimeOk && !extOk) {
    return `${rules.label}: allowed types — ${[...rules.extensions].join(", ")}`;
  }

  if (file.size > rules.maxBytes) {
    return `${rules.label}: max size ${formatMaxSize(rules.maxBytes)}`;
  }

  if (file.size <= 0) {
    return `${rules.label}: file is empty`;
  }

  return null;
}

export function getMediaStoragePath(
  lessonId: string,
  file: File,
  mediaType: LessonMediaType
): string {
  const normalizedId = normalizeLessonRouteId(lessonId);
  const timestamp = Date.now();
  const safeFilename = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  const fallbackName =
    safeFilename || `${mediaType}.${mediaType === "thumbnail" ? "jpg" : mediaType === "audio" ? "mp3" : "mp4"}`;

  return `lessons/${normalizedId}/${mediaType}-${timestamp}-${fallbackName}`;
}

export async function uploadLessonMediaFile(
  lessonId: string,
  file: File,
  mediaType: LessonMediaType
): Promise<MediaUploadResult> {
  if (!supabase || !hasSupabaseConfig) {
    return {
      publicUrl: null,
      path: null,
      error: "Supabase is not configured.",
    };
  }

  const validationError = validateMediaFile(file, mediaType);
  if (validationError) {
    return { publicUrl: null, path: null, error: validationError };
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return {
      publicUrl: null,
      path: null,
      error: "Admin эрх шаардлагатай.",
    };
  }

  const path = getMediaStoragePath(lessonId, file, mediaType);

  try {
    const { error: uploadError } = await supabase.storage
      .from(LESSON_MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      return {
        publicUrl: null,
        path: null,
        error: uploadError.message,
      };
    }

    const { data } = supabase.storage
      .from(LESSON_MEDIA_BUCKET)
      .getPublicUrl(path);

    if (!data.publicUrl) {
      return {
        publicUrl: null,
        path,
        error: "Public URL үүсгэж чадсангүй.",
      };
    }

    return {
      publicUrl: data.publicUrl,
      path,
      error: null,
    };
  } catch {
    return {
      publicUrl: null,
      path: null,
      error: "Upload хийхэд алдаа гарлаа.",
    };
  }
}

export function mediaTypeAcceptAttribute(mediaType: LessonMediaType): string {
  if (mediaType === "thumbnail") {
    return "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
  }
  if (mediaType === "audio") {
    return "audio/mpeg,audio/mp3,audio/wav,audio/mp4,.mp3,.wav,.m4a";
  }
  return "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";
}

export function mediaTypeHint(mediaType: LessonMediaType): string {
  const rules = MEDIA_RULES[mediaType];
  return `${[...rules.extensions].join(", ")} · max ${formatMaxSize(rules.maxBytes)}`;
}
