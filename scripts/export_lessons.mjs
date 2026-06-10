/**
 * Export public.lessons index for tag_lesson_map / placement planning.
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: npm run export:lessons
 * Output: data/lesson_index.json
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "data", "lesson_index.json");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

function parseTagFromSourceNote(sourceNote, tag) {
  if (!sourceNote) return null;
  const text = String(sourceNote).trim();
  if (!text) return null;

  if (text.startsWith("{")) {
    try {
      const json = JSON.parse(text);
      const camel = tag;
      const snake = tag.replace(/([A-Z])/g, "_$1").toLowerCase();
      const value = json[camel] ?? json[snake];
      if (value != null && String(value).trim()) {
        return String(value).trim();
      }
    } catch {
      // fall through to key=value parsing
    }
  }

  const pattern = new RegExp(`${tag}=([^·\\s,]+)`, "i");
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function parseHskLevel(courseId, sourceNote) {
  const fromNote = parseTagFromSourceNote(sourceNote, "hskLevel");
  if (fromNote) {
    const n = Number(String(fromNote).replace(/[^\d]/g, ""));
    if (Number.isFinite(n) && n >= 1 && n <= 9) return n;
  }

  const course = String(courseId ?? "").toLowerCase();
  const courseMatch = course.match(/hsk\s*([1-9])/i);
  if (courseMatch) return Number(courseMatch[1]);

  const idLike = course.replace(/[^a-z0-9]/g, "");
  const compact = idLike.match(/hsk([1-9])/);
  if (compact) return Number(compact[1]);

  return null;
}

function parseLessonNumber(id, sourceNote, orderIndex) {
  const fromNote = parseTagFromSourceNote(sourceNote, "lessonNumber");
  if (fromNote && Number.isFinite(Number(fromNote))) {
    return Math.max(1, Math.floor(Number(fromNote)));
  }

  const idStr = String(id ?? "");
  const lMatch = idStr.match(/-l0*(\d+)/i);
  if (lMatch) return Number(lMatch[1]);

  const tailMatch = idStr.match(/(\d+)\s*$/);
  if (tailMatch) return Math.max(1, Number(tailMatch[1]));

  if (Number.isFinite(orderIndex) && orderIndex > 0) {
    return Math.floor(orderIndex);
  }

  return null;
}

function mapRow(row) {
  const titleMn = row.title?.trim() || null;
  const titleZh = row.chinese_title?.trim() || null;
  const hskLevel = parseHskLevel(row.course_id, row.source_note);
  const lessonNumber = parseLessonNumber(
    row.id,
    row.source_note,
    row.order_index
  );

  return {
    id: row.id,
    course_id: row.course_id,
    hsk_level: hskLevel,
    lesson_number: lessonNumber,
    title_mn: titleMn,
    title_zh: titleZh,
    title: titleMn ?? titleZh ?? row.id,
    order_index: row.order_index ?? null,
  };
}

function sortLessons(a, b) {
  const levelA = a.hsk_level ?? 99;
  const levelB = b.hsk_level ?? 99;
  if (levelA !== levelB) return levelA - levelB;

  const numA = a.lesson_number ?? 9999;
  const numB = b.lesson_number ?? 9999;
  if (numA !== numB) return numA - numB;

  return String(a.id).localeCompare(String(b.id));
}

async function main() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("lessons")
    .select("id, course_id, title, chinese_title, order_index, source_note")
    .order("course_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Fetch lessons failed: ${error.message}`);
  }

  const lessons = (data ?? []).map(mapRow).sort(sortLessons);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(lessons, null, 2)}\n`, "utf8");

  console.log(`exported ${lessons.length} lessons → ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
