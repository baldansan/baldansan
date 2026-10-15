/**
 * «Хичээл татах (оффлайн үзэх)» — тухайн хичээлийн бүх медиа файлын жагсаалт.
 * GET /api/lessons/{lessonId}/offline-manifest
 * → { lessonId, pages: string[], audio: string[], media: string[] }
 *
 * Клиент (components/lesson/download-lesson-button) энэ жагсаалтыг аваад
 * файл бүрийг fetch хийнэ — service worker (public/sw.js) тэднийг
 * buunduu-audio (mp3, LRU 150МБ) / buunduu-media кэшэнд хадгална.
 *
 * Урьд нь HTML-ээс regex-ээр URL түүдэг байсан — client талд
 * (audio_base_path + файлын нэр) угсардаг аудио алдагддаг байв. Одоо
 * server дээр бүрэн resolve хийсэн багцаас авна.
 */
import { NextResponse } from "next/server";
import { checkPublicRateLimit } from "@/lib/api/public-rate-limit";
import { loadLessonWatchPage } from "@/lib/lesson/lesson-watch-loader";
import { isHskStructuredLesson } from "@/lib/lesson/hsk-lesson-content";
import { resolveHskLessonPackageFromLesson } from "@/lib/lesson/resolve-hsk-lesson-package";
import { normalizeLessonRouteId } from "@/lib/lesson-id";

export const dynamic = "force-dynamic";

const RATE = { max: 30, windowMs: 60_000, keyPrefix: "offline-manifest" } as const;

const STORAGE_URL_RE =
  /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'\\)<>]+/g;

const AUDIO_EXT_RE = /\.(mp3|m4a|aac|ogg|wav|opus)(\?|$)/i;

const SUBPATHS = ["", "/watch", "/quiz", "/vocabulary", "/workbook"];

function normalizeUrl(raw: string): string {
  return raw
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/[.,;:]+$/, "");
}

function collectStorageUrls(value: unknown, into: Set<string>): void {
  let text = "";
  try {
    text = JSON.stringify(value) ?? "";
  } catch {
    return;
  }
  for (const match of text.match(STORAGE_URL_RE) ?? []) {
    into.add(normalizeUrl(match));
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  const limited = checkPublicRateLimit(request, RATE);
  if (limited) return limited;

  const { lessonId: rawId } = await context.params;
  const lessonId = normalizeLessonRouteId(rawId);
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId шаардлагатай." }, { status: 400 });
  }

  const result = await loadLessonWatchPage(lessonId);
  if (result.kind !== "ok") {
    return NextResponse.json(
      { error: "Хичээл олдсонгүй эсвэл нээлттэй биш." },
      { status: 404 }
    );
  }

  const { lesson } = result;
  const urls = new Set<string>();

  if (lesson.audioUrl) urls.add(normalizeUrl(lesson.audioUrl));
  collectStorageUrls(lesson.vocabulary, urls);
  collectStorageUrls(
    {
      audioUrl: lesson.audioUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      imageUrl: lesson.imageUrl,
    },
    urls
  );

  if (isHskStructuredLesson(lesson)) {
    const pkg = resolveHskLessonPackageFromLesson(lesson);
    if (pkg) collectStorageUrls(pkg, urls);
  }
  // source_note доторх packageAudioUrls / vocabAudio зэрэг бүх URL.
  collectStorageUrls(lesson.sourceNote, urls);

  const audio: string[] = [];
  const media: string[] = [];
  for (const url of urls) {
    if (AUDIO_EXT_RE.test(url)) audio.push(url);
    else media.push(url);
  }
  audio.sort();
  media.sort();

  return NextResponse.json(
    {
      lessonId: lesson.id,
      pages: SUBPATHS.map((sub) => `/lessons/${encodeURIComponent(lesson.id)}${sub}`),
      audio,
      media,
      generatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}
