/**
 * Load HSK mock tests from data/tests/<TID>/ into Supabase.
 *
 * Layout per test:
 *   data/tests/H41327/H41327.json
 *   data/tests/H41327/audio/*.mp3
 *   data/tests/H41327/images/*.png
 *
 * Optional: data/tests/tag_lesson_map.json
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Apply: supabase/migrations/029_mock_tests_system.sql
 *        supabase/storage/004_test_assets_bucket.sql
 *
 * Run: npm run load:tests
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "fs";
import { basename, join, resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "test-assets";
const ROOT = resolve("data/tests");
const UPLOAD_RETRIES = 5;
const BATCH_SIZE = 50;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function isRelativeAsset(path) {
  return typeof path === "string" && (path.startsWith("audio/") || path.startsWith("images/"));
}

function storagePath(tid, rel) {
  const name = basename(rel);
  if (rel.startsWith("audio/")) return `tests/${tid}/audio/${name}`;
  if (rel.startsWith("images/")) return `tests/${tid}/images/${name}`;
  return null;
}

function tagCategory(tag) {
  if (tag.startsWith("sk.")) return "skill";
  if (tag.startsWith("gr.")) return "grammar";
  if (tag.startsWith("voc.")) return "vocab";
  if (tag.startsWith("topic.")) return "topic";
  return "other";
}

async function uploadFile(supabase, tid, rel, buffer, contentType) {
  const path = storagePath(tid, rel);
  if (!path) return null;

  const mb = (buffer.length / (1024 * 1024)).toFixed(1);
  let lastErr = null;

  for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
    try {
      if (attempt === 1) {
        console.log(`  ↑ ${path} (${mb} MB)`);
      } else {
        console.log(`  ↻ retry ${attempt}/${UPLOAD_RETRIES}: ${path}`);
      }

      const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        upsert: true,
        contentType,
      });
      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      lastErr = err;
      if (attempt < UPLOAD_RETRIES) {
        await sleep(2000 * attempt);
      }
    }
  }

  throw new Error(`Upload ${path}: ${lastErr?.message ?? "failed"}`);
}

function resolveUrl(tid, rel, urlMap) {
  if (!rel || !isRelativeAsset(rel)) return rel ?? null;
  return urlMap.get(rel) ?? null;
}

function transformSections(sections, tid, urlMap) {
  if (!Array.isArray(sections)) return [];
  return sections.map((sec) => {
    const next = { ...sec };
    if (isRelativeAsset(sec.audio_url)) {
      next.audio_url = resolveUrl(tid, sec.audio_url, urlMap);
    }
    return next;
  });
}

function transformOptions(options, tid, urlMap) {
  if (!options || !Array.isArray(options)) return options;
  return options.map((opt) => {
    if (!opt || typeof opt !== "object") return opt;
    const next = { ...opt };
    if (isRelativeAsset(opt.image_url)) {
      next.image_url = resolveUrl(tid, opt.image_url, urlMap);
    }
    return next;
  });
}

function transformQuestion(q, tid, urlMap) {
  return {
    test_id: tid,
    skill: String(q.skill ?? ""),
    part: Number(q.part ?? 1),
    q_no: Number(q.q_no),
    q_type: String(q.q_type ?? ""),
    stem: q.stem ?? null,
    options: transformOptions(q.options, tid, urlMap),
    correct_answer: q.correct_answer ?? null,
    autograde: q.autograde ?? "auto",
    points: Number(q.points ?? 1),
    audio_url: resolveUrl(tid, q.audio_url, urlMap),
    image_url: resolveUrl(tid, q.image_url, urlMap),
    needs_image: Boolean(q.needs_image),
    tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
    target_lesson_id: q.target_lesson_id ?? null,
    explanation_mn: q.explanation_mn ?? null,
  };
}

async function loadTestFolder(supabase, tid) {
  const dir = join(ROOT, tid);
  const jsonPath = join(dir, `${tid}.json`);
  if (!existsSync(jsonPath)) {
    console.warn(`Skip ${tid}: missing ${tid}.json`);
    return null;
  }

  const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
  const testId = String(raw.test_id ?? tid).trim();
  const urlMap = new Map();
  let audioCount = 0;
  let imageCount = 0;

  for (const sub of ["audio", "images"]) {
    const subDir = join(dir, sub);
    if (!existsSync(subDir)) continue;
    for (const name of readdirSync(subDir)) {
      const full = join(subDir, name);
      if (!statSync(full).isFile()) continue;
      const rel = `${sub}/${name}`;
      const ct = sub === "audio" ? "audio/mpeg" : "image/png";
      const buf = readFileSync(full);
      const url = await uploadFile(supabase, testId, rel, buf, ct);
      urlMap.set(rel, url);
      if (sub === "audio") audioCount += 1;
      else imageCount += 1;
    }
  }

  const sections = transformSections(raw.sections ?? [], testId, urlMap);
  const header = {
    id: testId,
    hsk_level: Number(raw.hsk_level),
    title: String(raw.title ?? testId),
    total_questions: Number(raw.total_questions),
    time_limit_min: Number(raw.time_limit_min),
    has_writing: Boolean(raw.has_writing),
    sections,
  };

  const { error: testErr } = await supabase.from("mock_tests").upsert(header, {
    onConflict: "id",
  });
  if (testErr) throw new Error(`${testId} mock_tests: ${testErr.message}`);

  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  const rows = questions.map((q) => transformQuestion(q, testId, urlMap));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const { error: qErr } = await supabase
      .from("mock_test_questions")
      .upsert(chunk, { onConflict: "test_id,q_no" });
    if (qErr) throw new Error(`${testId} questions: ${qErr.message}`);
  }

  const tagSet = new Set();
  for (const row of rows) {
    for (const tag of row.tags) tagSet.add(tag);
  }

  const tagRows = [...tagSet].map((tag) => ({
    tag,
    category: tagCategory(tag),
    label_mn: tag,
    hsk_level: header.hsk_level,
  }));

  if (tagRows.length) {
    const { error: tagErr } = await supabase
      .from("skill_tags")
      .upsert(tagRows, { onConflict: "tag" });
    if (tagErr) throw new Error(`${testId} skill_tags: ${tagErr.message}`);
  }

  console.log(
    `${testId}: ${rows.length} questions, ${imageCount} images, ${audioCount} audio uploaded`
  );

  return { testId, questionCount: rows.length, tags: tagSet };
}

async function loadTagLessonMap(supabase) {
  const mapPath = join(ROOT, "tag_lesson_map.json");
  if (!existsSync(mapPath)) return;

  const rows = JSON.parse(readFileSync(mapPath, "utf8"));
  if (!Array.isArray(rows) || !rows.length) return;

  const normalized = rows.map((r) => ({
    tag: String(r.tag),
    lesson_id: String(r.lesson_id),
    priority: Number(r.priority ?? 1),
  }));

  const { error } = await supabase
    .from("tag_lesson_map")
    .upsert(normalized, { onConflict: "tag,lesson_id" });
  if (error) throw new Error(`tag_lesson_map: ${error.message}`);
  console.log(`tag_lesson_map: ${normalized.length} rows`);
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!existsSync(ROOT)) {
    console.log("data/tests/ байхгүй — 0 тест.");
    return;
  }

  const only = process.argv
    .slice(2)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  let folders = readdirSync(ROOT).filter((name) => {
    if (name.startsWith("_")) return false;
    const p = join(ROOT, name);
    if (!statSync(p).isDirectory()) return false;
    return existsSync(join(p, `${name}.json`));
  });

  if (only.length) {
    folders = folders.filter((name) => only.includes(name.toUpperCase()));
    if (!folders.length) {
      throw new Error(`Тест олдсонгүй: ${only.join(", ")}`);
    }
    console.log(`Зөвхөн: ${folders.join(", ")}`);
  }

  let totalQuestions = 0;
  let testCount = 0;

  for (const tid of folders.sort()) {
    console.log(`\n▶ ${tid}…`);
    const result = await loadTestFolder(supabase, tid);
    if (result) {
      totalQuestions += result.questionCount;
      testCount += 1;
    }
  }

  await loadTagLessonMap(supabase);

  console.log(`TOTAL: ${totalQuestions} questions across ${testCount} tests`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
